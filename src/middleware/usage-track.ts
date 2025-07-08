import { Response, NextFunction } from "express";
import { BotProtectionRequest } from "../type";
import { UsageSessionManager } from "../utils/usage-session-manager";
import { chargeToken } from "../services/skyfire-api";

const SESSION_DURATION_SECONDS =
  Number(process.env.BOT_SESSION_DURATION_SECONDS) || 300; // 5 min default

export default async function usageTrack(
  req: BotProtectionRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.isBot) {
    next();
    return;
  }

  const jwtPayload = req.decodedJWT;
  if (!jwtPayload || !jwtPayload.jti) {
    next();
    return;
  }

  const redisKey = `session:${jwtPayload.jti}`;

  let manager: UsageSessionManager;
  try {
    manager = new UsageSessionManager(
      jwtPayload,
      redisKey,
      SESSION_DURATION_SECONDS
    );
  } catch (err) {
    console.error("Failed to instantiate UsageSessionManager:", err);
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  let count: number | undefined, accumulated: number | undefined;
  try {
    ({ count, accumulated } = await manager.updateSession());

    if (!count || !accumulated) {
      throw new Error("Failed to update usage session");
    }
  } catch (err) {
    console.error("Failed to update usage session:", {
      error: err,
      jti: jwtPayload.jti,
      user: jwtPayload.sub,
      path: req.path,
    });
    // Fail securely: deny the request
    res
      .status(500)
      .json({ error: "Failed to track usage. Please try again later." });
    return;
  }

  if (
    manager.hasReachedMinimumAmount(accumulated) ||
    manager.hasReachedMaximumRequestCount(count)
  ) {
    if (!req.skyfireToken) {
      res.status(401).json({ error: "Missing Skyfire token `skyfire-pay-id`" });
      return;
    }
    await chargeToken(req.skyfireToken, accumulated);
    await manager.resetAccumulated();
    console.log(`Batch charge triggered for token ${jwtPayload.jti}`);
  }

  // Log session counts (for debugging)
  console.log(
    `Bot session for token ${jwtPayload.jti}: count=${count} accumulated=${accumulated}`
  );

  next();
}
