export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 500,
    maxDelayMs = 5000,
    backoffMultiplier = 2,
  } = options;

  if (maxRetries < 0) {
    throw new Error("maxRetries cannot be negative.");
  }

  if (initialDelayMs < 0 || maxDelayMs < 0) {
    throw new Error("Retry delays cannot be negative.");
  }

  if (backoffMultiplier < 1) {
    throw new Error("backoffMultiplier must be at least 1.");
  }

  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= maxRetries) {
        if (error instanceof Error) {
          throw error;
        }

        throw new Error("Operation failed after all retry attempts.");
      }

      await sleep(delay);

      delay = Math.min(
        delay * backoffMultiplier,
        maxDelayMs
      );

      attempt += 1;
    }
  }
}

export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  message = "Operation timed out."
): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error(
      "timeoutMs must be a positive number."
    );
  }

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      operation,
      timeoutPromise,
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}
