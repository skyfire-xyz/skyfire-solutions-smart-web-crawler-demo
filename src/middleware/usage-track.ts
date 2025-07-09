import { Request, Response, NextFunction } from "express";
import { hasVerifiedJwt, isBotRequest } from "../type";
import { UsageSessionManager } from "../utils/usage-session-manager";
import { chargeToken } from "../services/skyfire-api";

const sessionDurationSeconds = Number(process.env.REDIS_SESSION_EXPIRY) || 300; // 5 min default
const overrideMaximumRequestCount = Number(
  process.env.OVERRIDE_MAXIMUM_REQUEST_COUNT
);

export default async function usageTrack(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Only process authenticated bot requests
  if (!isBotRequest(req) || !hasVerifiedJwt(req)) {
    next();
    return;
  }

  /**
   * 1. Initialize the usage session manager
   * => Just initializing the session manager. ( not creating a new session )
   * 2. If session doesn't exist, create a new session, charge the token first and get the remaining balance. Update the session with the remaining balance.
   * => Do this because we don't know the remainding balance unless we get the balance info from API, or rather just charnge and see the remaining balance.
   *
   * 4. If the remaining balance is insufficient, charge the token.
   * 5. If the remaining balance is sufficient, update the usage session.
   * 6. If the request count has reached the maximum allowed requests, charge the token.
   * 7. Reset the accumulated amount.
   * 8. Log the session counts (for debugging)
   *
   * 3. Check if the remaining balance is insufficient for the next request
   * 4. Update the usage session
   * 5. Check if the request count has reached the maximum allowed requests
   * 6. Charge the token
   * 7. Reset the accumulated amount
   * 8. Log the session counts (for debugging)
   */

  const jwtPayload = req.decodedJWT;
  const redisKey = `session:${jwtPayload.jti}`;
  const perRequestAmount = Number(jwtPayload.spr) || 0;
  const maximumRequestCount =
    overrideMaximumRequestCount || Number(jwtPayload.mnr) || 1000; // For testing purpose override the maximum request count

  console.log(
    "Threashold Config: ",
    `MNR=${maximumRequestCount} SPR=${perRequestAmount} MaxDuration=${sessionDurationSeconds}`
  );

  // Initialize the usage session manager
  const manager = new UsageSessionManager(
    redisKey,
    perRequestAmount,
    maximumRequestCount,
    sessionDurationSeconds
  );

  // If the session is new, charge the token first and get the remaining balance
  const sessionExists = await manager.sessionExists();
  if (!sessionExists) {
    console.log("New session created for token", jwtPayload.jti);

    // Create a new session
    await manager.createNewSession();

    const { remainingBalance } = await chargeToken(
      req.skyfireToken,
      perRequestAmount
    ); // Charge the token

    // Reset accumulated amount
    await manager.resetAccumulated();
    await manager.updateRemainingBalance(remainingBalance);

    console.log(
      `Initial charge triggered for token ${jwtPayload.jti}: charged ${perRequestAmount}: remainingBalance=${remainingBalance}`
    );
  }

  const remainingBalance = await manager.getRemainingBalance();
  console.log("remainingBalance", remainingBalance);

  // Check if the remaining balance is insufficient for the next request
  const hasReachedRemainingBalance = await manager.hasReachedRemainingBalance();
  if (hasReachedRemainingBalance) {
    // 402 Payment Required: token usage exceeded
    res.status(402).json({ error: "Payment Required: token usage exceeded" });
    return;
  }

  const { count, accumulated } = await manager.updateUsage();
  if (!count || !accumulated) {
    throw new Error("Failed to update usage session");
  }

  const hasReachedMaximumRequestCount =
    await manager.hasReachedMaximumRequestCount();
  if (hasReachedMaximumRequestCount) {
    // Charge the token
    const { remainingBalance } = await chargeToken(
      req.skyfireToken,
      accumulated
    );

    // Reset accumulated amount
    await manager.resetAccumulated();
    await manager.updateRemainingBalance(remainingBalance);

    console.log(
      `Batch charge triggered for token ${jwtPayload.jti}: charged ${accumulated}`
    );

    res.status(402).json({ error: "Payment Required: token usage exceeded" });
    return;
  }

  // Log session counts (for debugging)
  console.log(
    `Session Summary: ${jwtPayload.jti}: count=${count} accumulated=${accumulated}`
  );

  next();
}
