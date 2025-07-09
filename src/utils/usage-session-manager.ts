// src/utils/UsageSessionManager.ts

import { redis } from "../config/redis";

/**
 * Manages usage session, request counting, and batch charge thresholds for a token/session.
 */
export class UsageSessionManager {
  private redisKey: string;
  public perRequestAmount: number;
  public maximumRequestCount: number;
  public sessionDuration: number;

  constructor(
    redisKey: string,
    perRequestAmount: number,
    maximumRequestCount: number,
    sessionDuration: number
  ) {
    this.redisKey = redisKey;
    this.perRequestAmount = perRequestAmount;
    this.maximumRequestCount = maximumRequestCount;
    this.sessionDuration = sessionDuration;
  }

  async createNewSession(jwtToken: string): Promise<void> {
    const multi = redis.multi();
    multi.hset(this.redisKey, "jwtToken", jwtToken);
    multi.hset(this.redisKey, "count", "0");
    multi.hset(this.redisKey, "accumulated", "0");
    multi.hset(this.redisKey, "lastRequest", Date.now().toString());
    multi.hset(this.redisKey, "remainingBalance", "0");
    multi.expire(this.redisKey, this.sessionDuration);

    await multi.exec();
  }

  /**
   * Increments usage counters: count, accumulated amount, and sets last activity.
   * Returns the updated count, accumulated amount, and whether this is a new session.
   */
  async updateUsage({
    skipAccumulation = false,
  }: { skipAccumulation?: boolean } = {}): Promise<{
    count?: number;
    accumulated?: number;
    isNewSession: boolean;
  }> {
    // Check if this is a new session before incrementing
    const sessionExists = await this.sessionExists();

    const multi = redis.multi();
    multi.hincrby(this.redisKey, "count", 1);

    if (!skipAccumulation) {
      multi.hincrbyfloat(this.redisKey, "accumulated", this.perRequestAmount);
    }

    multi.hset(this.redisKey, "lastRequest", Date.now());
    multi.expire(this.redisKey, this.sessionDuration);

    const execResult = await multi.exec();

    let count: number | undefined = undefined;
    let accumulated: number | undefined = undefined;

    if (execResult && Array.isArray(execResult)) {
      const countRes = execResult[0];
      if (Array.isArray(countRes) && typeof countRes[1] === "number") {
        count = countRes[1];
      }

      if (!skipAccumulation) {
        const accumulatedRes = execResult[1];
        if (
          Array.isArray(accumulatedRes) &&
          typeof accumulatedRes[1] === "string"
        ) {
          accumulated = Number(accumulatedRes[1]);
        }
      } else {
        // If skipping accumulation, get the current accumulated amount
        accumulated = await this.getAccumulatedAmount();
      }
    }

    return { count, accumulated, isNewSession: !sessionExists };
  }

  /**
   * Updates the remaining balance in Redis.
   */
  async updateRemainingBalance(newBalance: string): Promise<void> {
    await redis.hset(this.redisKey, "remainingBalance", newBalance);
  }

  /**
   * Resets the accumulated amount and count in Redis after a batch charge.
   */
  async resetAccumulated(): Promise<void> {
    const multi = redis.multi();
    multi.hset(this.redisKey, "accumulated", "0");
    multi.hset(this.redisKey, "count", "0");
    await multi.exec();
  }

  /**
   * Gets the current remaining balance from Redis.
   */
  async getRemainingBalance(): Promise<number | null> {
    try {
      const balance = await redis.hget(this.redisKey, "remainingBalance");
      return balance !== null ? Number(balance) : null;
    } catch (err) {
      console.error("Error getting remaining balance:", err);
      return null;
    }
  }

  /**
   * Gets the current request count from Redis.
   */
  async getRequestCount(): Promise<number> {
    try {
      const count = await redis.hget(this.redisKey, "count");
      return count !== null ? Number(count) : 0;
    } catch (err) {
      console.error("Error getting request count:", err);
      return 0;
    }
  }

  /**
   * Gets the current accumulated amount from Redis.
   */
  async getAccumulatedAmount(): Promise<number> {
    try {
      const accumulated = await redis.hget(this.redisKey, "accumulated");
      return accumulated !== null ? Number(accumulated) : 0;
    } catch (err) {
      console.error("Error getting accumulated amount:", err);
      return 0;
    }
  }
  /**
   * Checks if the session exists in Redis.
   */
  async sessionExists(): Promise<boolean> {
    try {
      const exists = await redis.exists(this.redisKey);
      return exists === 1;
    } catch (err) {
      console.error("Error checking if session exists:", err);
      return false;
    }
  }

  /**
   * Checks if the request count has reached the maximum allowed requests.
   */
  async hasReachedMaximumRequestCount(): Promise<boolean> {
    try {
      const count = await this.getRequestCount();
      return count >= this.maximumRequestCount;
    } catch (err) {
      console.error("Error checking maximum request count:", err);
      return false;
    }
  }

  /**
   * Checks if the remaining balance is insufficient for the next request.
   */
  async hasReachedRemainingBalance(): Promise<boolean> {
    const balance = await this.getRemainingBalance();
    const accumulated = await this.getAccumulatedAmount();

    return (
      balance === null ||
      balance === 0 ||
      balance <= this.perRequestAmount + accumulated
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
      return false;
    }
  }

  async getSessionExpiry(): Promise<number> {
    try {
      const lastRequest = await redis.hget(this.redisKey, "lastRequest");
      if (!lastRequest) return 0;

      const lastRequestTime = Number(lastRequest);
      const currentTime = Date.now();
      const timeDiff = currentTime - lastRequestTime;
      return this.sessionDuration * 1000 - timeDiff;
    } catch (err) {
      console.error("Error getting session expiry:", err);
      return 0;
    }
  }

  /**
   * Gets the actual expiration timestamp (Unix timestamp in milliseconds)
   */
  async getSessionExpirationTimestamp(): Promise<number | null> {
    try {
      const lastRequest = await redis.hget(this.redisKey, "lastRequest");
      if (!lastRequest) return null;

      const lastRequestTime = Number(lastRequest);
      const expirationTime = lastRequestTime + this.sessionDuration * 1000;
      return expirationTime;
    } catch (err) {
      console.error("Error getting session expiration timestamp:", err);
      return null;
    }
  }

  /**
   * Gets the stored JWT token from the session
   */
  async getJWT(): Promise<string | null> {
    try {
      const jwt = await redis.hget(this.redisKey, "jwtToken");
      return jwt;
    } catch (err) {
      console.error("Error getting JWT:", err);
      return null;
    }
  }

  /**
   * Stores session data in a stream before expiration for later retrieval
   */
  async storeSessionDataForExpiration(): Promise<void> {
    try {
      const sessionData = await redis.hgetall(this.redisKey);
      if (sessionData && Object.keys(sessionData).length > 0) {
        // Store in a hash that doesn't expire (simpler than streams)
        const dataKey = `session_data:${this.redisKey}`;
        await redis.hset(
          dataKey,
          "session_id",
          this.redisKey,
          "count",
          sessionData.count || "0",
          "accumulated",
          sessionData.accumulated || "0",
          "jwtToken",
          sessionData.jwtToken || "",
          "remainingBalance",
          sessionData.remainingBalance || "0",
          "updated_at",
          Date.now().toString()
        );

        // Set expiration for the data key (cleanup after 1 hour)
        await redis.expire(dataKey, 3600);
      }
    } catch (err) {
      console.error("Error storing session data for expiration:", err);
    }
  }
}
