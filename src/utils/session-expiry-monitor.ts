import { redis } from "../config/redis";
import { chargeToken } from "../services/skyfire-api";

const EXPIRY_TRACKING_KEY = "session_expiries";
const MONITOR_INTERVAL =
  Number(process.env.EXPIRE_MONITOR_INTERVAL) || 30 * 1000; // Default 30 seconds

/**
 * Handle session expiration - charge accumulated amounts and cleanup
 */
async function handleSessionExpiration(sessionKey: string): Promise<void> {
  try {
    // Get session data from backup hash
    const dataKey = `session_data:${sessionKey}`;
    const sessionData = await redis.hgetall(dataKey);

    if (sessionData && Object.keys(sessionData).length > 0) {
      const { accumulated, jwtToken } = sessionData;

      // Charge accumulated amount if any
      if (Number(accumulated) > 0 && jwtToken) {
        console.log(
          `Session expired: ${sessionKey}. Charging accumulated amount: ${accumulated}`
        );

        try {
          await chargeToken(jwtToken, Number(accumulated));
        } catch (error) {
          console.error(
            `Failed to charge accumulated amount for session ${sessionKey}:`,
            error
          );
        }
      } else {
        console.log(`Session expired: ${sessionKey} - No accumulated amount.`);
      }

      // Clean up the data key
      await redis.del(dataKey);
      console.log(`Cleaned up session data for: ${sessionKey}`);
    } else {
      console.log(`No session data found for: ${sessionKey}`);
    }
  } catch (error) {
    console.error(`Error processing expired session ${sessionKey}:`, error);
  }
}

/**
 * Process expired sessions using Redis Sorted Set
 */
async function processExpiredSessions(): Promise<void> {
  try {
    const now = Date.now();

    // Get all sessions that have expired (score <= now)
    const expiredSessions = await redis.zrangebyscore(
      EXPIRY_TRACKING_KEY,
      0,
      now
    );

    for (const sessionKey of expiredSessions) {
      try {
        // Double-check if the session actually exists in Redis
        const sessionExists = await redis.exists(sessionKey);

        if (!sessionExists) {
          // Session has actually expired, process it
          await handleSessionExpiration(sessionKey);

          // Remove from tracking set
          await redis.zrem(EXPIRY_TRACKING_KEY, sessionKey);
          console.log(`Removed ${sessionKey} from expiry tracking`);
        }
      } catch (error) {
        console.error(`Error processing expired session ${sessionKey}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in processExpiredSessions:", error);
  }
}

/**
 * Start the session expiry monitor
 */
export async function startExpiryMonitor(): Promise<void> {
  // Process any expired sessions on startup
  await processExpiredSessions();

  // Set up periodic monitoring
  setInterval(async () => {
    try {
      await processExpiredSessions();
    } catch (error) {
      console.error("Error in session expiry monitor:", error);
    }
  }, MONITOR_INTERVAL);

  console.log(
    `Session expiry monitor started - checking every ${
      MONITOR_INTERVAL / 1000
    } seconds`
  );
}

/**
 * Add a session to expiry tracking
 */
export async function trackSessionExpiry(
  sessionKey: string,
  expiryTime: number
): Promise<void> {
  try {
    await redis.zadd(EXPIRY_TRACKING_KEY, expiryTime, sessionKey);
    console.log(
      `Added ${sessionKey} to expiry tracking (expires at ${new Date(
        expiryTime
      )})`
    );
  } catch (error) {
    console.error(`Error tracking session expiry for ${sessionKey}:`, error);
  }
}

/**
 * Remove a session from expiry tracking (when manually deleted)
 */
export async function removeSessionFromTracking(
  sessionKey: string
): Promise<void> {
  try {
    await redis.zrem(EXPIRY_TRACKING_KEY, sessionKey);
    console.log(`Removed ${sessionKey} from expiry tracking`);
  } catch (error) {
    console.error(`Error removing session from tracking: ${sessionKey}`, error);
  }
}
