import { Request, Response, NextFunction } from "express";
import { jwtVerify, createRemoteJWKSet, errors as joseErrors } from "jose";
import { IdentifyBotRequest } from "./identifyBot";

const JWKS_URL =
  process.env.OFFICIAL_SKYFIRE_JWT_ISSUER + "/.well-known/jwks.json";
const JWT_ISSUER = process.env.OFFICIAL_SKYFIRE_JWT_ISSUER!;
const JWT_AUDIENCE = process.env.OFFICIAL_SKYFIRE_AGENT_ID!;
const JWT_ALGORITHM = process.env.OFFICIAL_SKYFIRE_JWT_ALGORITHM!;
const JWT_SSI = process.env.OFFICIAL_SKYFIRE_EXPECTED_SSI!;

const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

export interface SkyfireRequest extends IdentifyBotRequest {
  jwtPayload?: string;
}

async function verifyHeader(
  req: IdentifyBotRequest,
  res: Response,
  next: NextFunction
) {
  // Only verify token if request is from a bot
  if (!req.isBot) {
    next();
    return;
  }

  const skyfireToken = req.header("skyfire-pay-id") || "";

  if (!skyfireToken) {
    res.status(401).json({ error: "Missing Skyfire token `skyfire-pay-id`" });
    return;
  }

  // Verify JWT
  try {
    const { payload } = await jwtVerify(skyfireToken, JWKS, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: [JWT_ALGORITHM],
    });

    console.log(payload, "JWT Payload");

    if ((payload as any).ssi !== JWT_SSI) {
      res.status(401).json({ error: "Invalid SSI in token" });
      return;
    }

    // Attach decoded info to req for downstream middleware
    console.log(payload, "JWT Payload");

    (req as SkyfireRequest).jwtPayload = skyfireToken;

    next();
    return;
  } catch (err: unknown) {
    console.error("Error while verifying token: ", err);
    if (err instanceof joseErrors.JOSEError) {
      res.status(401).json({
        error: "Your JWT token is invalid",
        errorCode: (err as any).code,
        message: (err as any).message,
      });
      return;
    }
    res.status(401).json({
      error: "Something went wrong while verifying your JWT token",
    });
    return;
  }
}

export default (req: Request, res: Response, next: NextFunction) => {
  return Promise.resolve(verifyHeader(req as SkyfireRequest, res, next)).catch(
    next
  );
};
