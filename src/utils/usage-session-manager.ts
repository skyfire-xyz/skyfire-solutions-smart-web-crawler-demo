// src/utils/UsageSessionManager.ts

import { redis } from "../config/redis";
import { DecodedSkyfireJwt } from "../type";

/**
 * Manages usage session, request counting, and batch charge thresholds for a token/session.
 */
export class UsageSessionManager {
  private perRequestAmount: number;
  private minimumChargeAmount: number;
  private maximumRequestCount: number;

  constructor(
    private decodedJWT: DecodedSkyfireJwt,
    private redisKey: string,
    private sessionDuration: number // in seconds
  ) {
    // Extract values from JWT
    this.perRequestAmount = Number(this.decodedJWT.spr) || 0;
    this.minimumChargeAmount = 0.01; // Default minimum charge amount
    this.maximumRequestCount = Number(this.decodedJWT.mnr) || 1000;
  }

  /**
   * Updates the session in Redis: increments count, accumulated amount, sets last activity, and expiry.
   * Returns the updated count and accumulated amount.
   */
  async updateSession(): Promise<{ count?: number; accumulated?: number }> {
    const multi = redis.multi();
    multi.hincrby(this.redisKey, "count", 1);
    multi.hincrbyfloat(this.redisKey, "accumulated", this.perRequestAmount);
    multi.hset(this.redisKey, "lastRequest", Date.now());
    multi.expire(this.redisKey, this.sessionDuration);
    const execResult = await multi.exec();

    let count: number | undefined = undefined;
    let accumulated: number | undefined = undefined;

    if (execResult && Array.isArray(execResult)) {
      const countRes = execResult[0];
      const accumulatedRes = execResult[1];
      if (Array.isArray(countRes) && typeof countRes[1] === "number") {
        count = countRes[1];
      }

      if (
        Array.isArray(accumulatedRes) &&
        typeof accumulatedRes[1] === "string"
      ) {
        accumulated = Number(accumulatedRes[1]);
      }
    }
    return { count, accumulated };
  }

  /**
   * Resets the accumulated amount in Redis after a batch charge.
   */
  async resetAccumulated(): Promise<void> {
    await redis.hset(this.redisKey, "accumulated", "0");
    await redis.hset(this.redisKey, "count", 0);
  }

  /**
   * Checks if the request count has reached the maximum allowed requests.
   */
  hasReachedMaximumRequestCount(count: number): boolean {
    return (
      typeof count === "number" &&
      typeof this.maximumRequestCount === "number" &&
      count >= this.maximumRequestCount
    );
  }

  /**
   * Checks if the accumulated amount has reached the minimum charge threshold.
   */
  hasReachedMinimumAmount(accumulated: number): boolean {
    return (
      typeof accumulated === "number" &&
      typeof this.minimumChargeAmount === "number" &&
      accumulated >= this.minimumChargeAmount
    );
  }

  /**
   * Checks if the session has expired based on last activity.
   */
  async hasSessionExpired(): Promise<boolean> {
    try {
      const lastRequest = await redis.hget(this.redisKey, "lastRequest");
      if (!lastRequest) return false;

      const lastRequestTime = Number(lastRequest);
      const currentTime = Date.now();
      const timeDiff = currentTime - lastRequestTime;
      const sessionExpiryMs = this.sessionDuration * 1000;

      return timeDiff > sessionExpiryMs;
    } catch (err) {
      console.error("Error checking session expiry:", err);
      return false; // Default to not expired if we can't check
    }
  }
}
