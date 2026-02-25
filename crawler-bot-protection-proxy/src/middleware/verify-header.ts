import { Request, Response, NextFunction } from "express";
import { DecodedSkyfireJwt, isBotRequest } from "../type";
import { verifyKyaPayToken } from "../verify-kya-pay-token";

const MISSING_KYAPAY_TEXT =
  "Missing KYAPay token in the skyfire-pay-id header. Please create an account at https://app.skyfire.xyz and create a 'kya+pay' token - https://docs.skyfire.xyz/reference/create-token . Include the token in your request in the skyfire-pay-id header.";

const INVALID_KYAPAY_TEXT =
  "Invalid KYAPay token in the skyfire-pay-id header. Please create an account at https://app.skyfire.xyz and create a 'kya+pay' token - https://docs.skyfire.xyz/reference/create-token . Include the token in your request in the skyfire-pay-id header.";

/**
 * 402 Insufficient balance is returned by downstream (e.g. usage-track) when
 * charge fails. Use INSUFFICIENT_KYAPAY_TEXT for that response body.
 */
export const INSUFFICIENT_KYAPAY_TEXT =
  "The balance on the given KYAPay token is not enough. Please create and send a new 'kya+pay' token.";

export default async function verifyHeader(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!isBotRequest(req)) {
    next();
    return;
  }

  const token = req.header("skyfire-pay-id") ?? "";

  if (!token) {
    res.status(403).send(MISSING_KYAPAY_TEXT);
    return;
  }

  const vr = await verifyKyaPayToken(token);

  if (!vr.success) {
    res.status(401).send(INVALID_KYAPAY_TEXT);
    return;
  }

  req.decodedJWT = vr.payload as unknown as DecodedSkyfireJwt;
  req.skyfireToken = token;

  next();
}
