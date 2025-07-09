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

    await logSession(
      jwtPayload,
      manager,
      `Initial charge: charged ${perRequestAmount}`
    );
  }

  // Check if threashold is reached
  // 1. Is the  remaining balance is insufficient for the next request
  // 2. Is the request count has reached the maximum allowed requests
  const hasReachedRemainingBalance = await manager.hasReachedRemainingBalance();
  const hasReachedMaximumRequestCount =
    await manager.hasReachedMaximumRequestCount();

  if (hasReachedRemainingBalance || hasReachedMaximumRequestCount) {
    await logSession(
      jwtPayload,
      manager,
      `[Threshold reached] hasReachedRemainingBalance=${hasReachedRemainingBalance} hasReachedMaximumRequestCount=${hasReachedMaximumRequestCount}`
    );

    // Check if user owes any accumulated amount
    const accumulated = await manager.getAccumulatedAmount();
    let chargeInfo = null;

    if (accumulated > 0) {
      // Charge the token
      const { remainingBalance } = await chargeToken(
        req.skyfireToken,
        accumulated
      );
      // Reset accumulated amount
      await manager.resetAccumulated();
      await manager.updateRemainingBalance(remainingBalance);

      chargeInfo = {
        charged: accumulated,
        remainingBalance: remainingBalance,
      };
    }

    // 402 Payment Required: token usage exceeded. Blocked from returning the response.
    await makePaymentHeaders(res, manager, chargeInfo?.charged);

    res.status(402).json({
      error: "Payment Required: token usage exceeded",
      chargeInfo: chargeInfo,
      reason: hasReachedRemainingBalance
        ? "insufficient_balance"
        : "batch_limit_reached",
    });
    return;
  }

  // Theashold is not reached. Update the usage session, and forward the request.
  const { count, accumulated } = await manager.updateUsage();
  if (!count || !accumulated) {
    throw new Error("Failed to update usage session");
  }

  // Add payment info to response headers
  await makePaymentHeaders(res, manager);

  await logSession(jwtPayload, manager);

  next();
}

/**
 * Creates payment headers for response
 */
async function makePaymentHeaders(
  res: Response,
  manager: UsageSessionManager,
  chargedAmount?: number
): Promise<void> {
  const [count, accumulated, remainingBalance] = await Promise.all([
    manager.getRequestCount(),
    manager.getAccumulatedAmount(),
    manager.getRemainingBalance(),
  ]);

  res.setHeader("X-Payment-Charged", chargedAmount?.toString() || "0");
  res.setHeader("X-Payment-Session-Count", count.toString());
  res.setHeader("X-Payment-Session-Accumulated-Amount", accumulated.toString());
  res.setHeader(
    "X-Payment-Session-Remaining-Balance",
    remainingBalance?.toString() || "0"
  );
}

/**
 * Logs session payment information
 */
async function logSession(
  jwtPayload: any,
  manager: UsageSessionManager,
  additionalInfo?: string
): Promise<void> {
  const [count, accumulated, remainingBalance] = await Promise.all([
    manager.getRequestCount(),
    manager.getAccumulatedAmount(),
    manager.getRemainingBalance(),
  ]);

  const logMessage = `Session Summary: jti:${
    jwtPayload.jti
  } count:${count} accumulated:${accumulated} remainingBalance:${
    remainingBalance?.toString() || "0"
  }`;

  if (additionalInfo) {
    console.log(`${additionalInfo} | ${logMessage}`);
  } else {
    console.log(logMessage);
  }
}
