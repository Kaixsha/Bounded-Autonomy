export interface RateLimiterOptions {
  requestsPerMinute: number;
  tokensPerMinute: number;
  maxConcurrentRequests: number;
  windowMs?: number;
  pollIntervalMs?: number;
}

interface RequestRecord {
  timestamp: number;
  tokens: number;
}

export class RateLimiter {
  private readonly requestsPerMinute: number;
  private readonly tokensPerMinute: number;
  private readonly maxConcurrentRequests: number;
  private readonly windowMs: number;
  private readonly pollIntervalMs: number;

  private requestRecords: RequestRecord[] = [];
  private concurrentRequests = 0;

  constructor(options: RateLimiterOptions) {
    if (
      options.requestsPerMinute <= 0 ||
      options.tokensPerMinute <= 0 ||
      options.maxConcurrentRequests <= 0
    ) {
      throw new Error(
        "Rate limiter limits must be positive numbers."
      );
    }

    this.requestsPerMinute = options.requestsPerMinute;
    this.tokensPerMinute = options.tokensPerMinute;
    this.maxConcurrentRequests =
      options.maxConcurrentRequests;

    this.windowMs = options.windowMs ?? 60_000;
    this.pollIntervalMs = options.pollIntervalMs ?? 100;
  }

  public pruneOldRecords(now = Date.now()): void {
    const windowStart = now - this.windowMs;

    this.requestRecords = this.requestRecords.filter(
      (record) => record.timestamp > windowStart
    );
  }

  private getTokensUsed(): number {
    return this.requestRecords.reduce(
      (total, record) => total + record.tokens,
      0
    );
  }

  public canProceed(tokens = 0): boolean {
    if (tokens < 0) {
      throw new Error("Token count cannot be negative.");
    }

    this.pruneOldRecords();

    const requestLimitReached =
      this.requestRecords.length >= this.requestsPerMinute;

    const tokenLimitReached =
      this.getTokensUsed() + tokens > this.tokensPerMinute;

    const concurrencyLimitReached =
      this.concurrentRequests >=
      this.maxConcurrentRequests;

    return (
      !requestLimitReached &&
      !tokenLimitReached &&
      !concurrencyLimitReached
    );
  }

  public async acquire(
    tokens = 0
  ): Promise<() => void> {
    if (tokens < 0) {
      throw new Error("Token count cannot be negative.");
    }

    if (tokens > this.tokensPerMinute) {
      throw new Error(
        "Requested token count exceeds the tokens-per-minute limit."
      );
    }

    while (!this.canProceed(tokens)) {
      await this.sleep(this.pollIntervalMs);
    }

    this.requestRecords.push({
      timestamp: Date.now(),
      tokens,
    });

    this.concurrentRequests += 1;

    let released = false;

    return () => {
      if (released) {
        return;
      }

      released = true;

      this.concurrentRequests = Math.max(
        0,
        this.concurrentRequests - 1
      );
    };
  }

  public getStatus(): {
    requestsInWindow: number;
    tokensInWindow: number;
    concurrentRequests: number;
  } {
    this.pruneOldRecords();

    return {
      requestsInWindow: this.requestRecords.length,
      tokensInWindow: this.getTokensUsed(),
      concurrentRequests: this.concurrentRequests,
    };
  }

  private sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }
}

export const reviewRateLimiter = new RateLimiter({
  requestsPerMinute: 50,
  tokensPerMinute: 100_000,
  maxConcurrentRequests: 3,
});
