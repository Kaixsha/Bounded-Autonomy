import {
  describe,
  expect,
  it,
} from "vitest";

import {
  RateLimiter,
} from "../src/utils/rate-limiter.js";

describe("RateLimiter", () => {
  it("allows a request when limits are available", () => {
    const limiter = new RateLimiter({
      requestsPerMinute: 5,
      tokensPerMinute: 1000,
      maxConcurrentRequests: 2,
    });

    expect(
      limiter.canProceed(100)
    ).toBe(true);
  });

  it("tracks requests and tokens after acquire", async () => {
    const limiter = new RateLimiter({
      requestsPerMinute: 5,
      tokensPerMinute: 1000,
      maxConcurrentRequests: 2,
    });

    const release = await limiter.acquire(250);

    const status = limiter.getStatus();

    expect(status.requestsInWindow).toBe(1);
    expect(status.tokensInWindow).toBe(250);
    expect(status.concurrentRequests).toBe(1);

    release();

    expect(
      limiter.getStatus().concurrentRequests
    ).toBe(0);
  });

  it("prevents requests that exceed the token limit", async () => {
    const limiter = new RateLimiter({
      requestsPerMinute: 5,
      tokensPerMinute: 100,
      maxConcurrentRequests: 2,
    });

    const release = await limiter.acquire(80);

    expect(
      limiter.canProceed(30)
    ).toBe(false);

    release();
  });

  it("respects the concurrent request limit", async () => {
    const limiter = new RateLimiter({
      requestsPerMinute: 10,
      tokensPerMinute: 1000,
      maxConcurrentRequests: 1,
    });

    const release = await limiter.acquire(10);

    expect(
      limiter.canProceed(10)
    ).toBe(false);

    release();

    expect(
      limiter.canProceed(10)
    ).toBe(true);
  });

  it("does not release the same request twice", async () => {
    const limiter = new RateLimiter({
      requestsPerMinute: 10,
      tokensPerMinute: 1000,
      maxConcurrentRequests: 2,
    });

    const release = await limiter.acquire(10);

    release();
    release();

    expect(
      limiter.getStatus().concurrentRequests
    ).toBe(0);
  });

  it("rejects a single request that exceeds the token limit", async () => {
    const limiter = new RateLimiter({
      requestsPerMinute: 5,
      tokensPerMinute: 100,
      maxConcurrentRequests: 2,
    });

    await expect(
      limiter.acquire(101)
    ).rejects.toThrow(
      "Requested token count exceeds the tokens-per-minute limit."
    );
  });

  it("prunes records outside the sliding window", async () => {
    const limiter = new RateLimiter({
      requestsPerMinute: 1,
      tokensPerMinute: 1000,
      maxConcurrentRequests: 2,

      // Very small window so the test completes quickly.
      windowMs: 20,
      pollIntervalMs: 1,
    });

    const release = await limiter.acquire(100);
    release();

    expect(
      limiter.canProceed(100)
    ).toBe(false);

    await new Promise((resolve) => {
      setTimeout(resolve, 30);
    });

    limiter.pruneOldRecords();

    expect(
      limiter.canProceed(100)
    ).toBe(true);
  });
});
