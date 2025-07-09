import { redis } from "./redis";
import { chargeToken } from "../services/skyfire-api";

/**
 * This function runs when a session expires
 */
async function handleSessionExpiration(sessionId: string): Promise<void> {
  try {
    // Get session data from backup hash (main session was deleted by Redis)
    const dataKey = `session_data:${sessionId}`;
    const sessionData = await redis.hgetall(dataKey);

    if (sessionData && Object.keys(sessionData).length > 0) {
      const { accumulated, jwtToken } = sessionData;

      // Charge accumulated amount if any
      if (Number(accumulated) > 0 && jwtToken) {
        console.log(
          `Session expired: ${sessionId}. Charging accumulated amount: ${accumulated}`
        );

        try {
          const { remainingBalance } = await chargeToken(
            jwtToken,
            Number(accumulated)
          );
        } catch (error) {
          console.error(
            `Failed to charge accumulated amount for session ${sessionId}:`,
            error
          );
        }
      } else {
        console.log(`Session expired: ${sessionId} No accumulated amount.`);
      }

      // Clean up the data key
      await redis.del(dataKey);
      console.log(`Session Cache Deleted`);
    } else {
      console.log(`No session data found in hash for: ${sessionId}`);
    }
  } catch (error) {
    console.error(`Error processing expired session ${sessionId}:`, error);
  }
}

/**
 * Sets up Redis expiration notifications
 */
export async function setupExpirationSubscriber(): Promise<void> {
  // Enable Redis notifications
  await redis.config("SET", "notify-keyspace-events", "Ex");

  // Create subscriber
  const subscriber = redis.duplicate();
  await subscriber.subscribe("__keyevent@0__:expired");

  // Listen for expiration events
  subscriber.on("message", (_: string, message: string) => {
    if (message.startsWith("session:")) {
      handleSessionExpiration(message);
    }
  });

  console.log("Expiration subscriber ready");
}
