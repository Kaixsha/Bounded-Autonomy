import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  withRetry,
  withTimeout,
} from "../src/utils/error-handler.js";

describe("withRetry", () => {
  it("returns the result when the operation succeeds", async () => {
    const operation = vi.fn().mockResolvedValue("success");

    const result = await withRetry(operation, {
      maxRetries: 2,
      initialDelayMs: 1,
      maxDelayMs: 5,
      backoffMultiplier: 2,
    });

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("retries a failed operation until it succeeds", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error("Temporary failure"))
      .mockRejectedValueOnce(new Error("Temporary failure"))
      .mockResolvedValue("success");

    const result = await withRetry(operation, {
      maxRetries: 3,
      initialDelayMs: 1,
      maxDelayMs: 5,
      backoffMultiplier: 2,
    });

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("throws after all retry attempts fail", async () => {
    const operation = vi
      .fn()
      .mockRejectedValue(new Error("Permanent failure"));

    await expect(
      withRetry(operation, {
        maxRetries: 2,
        initialDelayMs: 1,
        maxDelayMs: 5,
        backoffMultiplier: 2,
      })
    ).rejects.toThrow("Permanent failure");

    expect(operation).toHaveBeenCalledTimes(3);
  });
});

describe("withTimeout", () => {
  it("returns the result when the operation finishes before the timeout", async () => {
    const operation = Promise.resolve("completed");

    const result = await withTimeout(
      operation,
      100
    );

    expect(result).toBe("completed");
  });

  it("rejects when the operation exceeds the timeout", async () => {
    const slowOperation = new Promise<string>(
      (resolve) => {
        setTimeout(() => {
          resolve("too late");
        }, 100);
      }
    );

    await expect(
      withTimeout(
        slowOperation,
        10,
        "Test operation timed out."
      )
    ).rejects.toThrow(
      "Test operation timed out."
    );
  });

  it("rejects invalid timeout values", async () => {
    await expect(
      withTimeout(
        Promise.resolve("result"),
        0
      )
    ).rejects.toThrow(
      "timeoutMs must be a positive number."
    );
  });
});
