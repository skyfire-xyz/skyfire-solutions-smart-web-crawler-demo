import { Response, NextFunction } from "express";
import { SkyfireRequest } from "./verifyHeader";

const BACKEND_API_URL = process.env.BACKEND_API_URL;
const SELLER_SKYFIRE_API_KEY = process.env.SELLER_SKYFIRE_API_KEY;
const AMOUNT_TO_CHARGE = process.env.OFFICIAL_SKYFIRE_AMOUNT_TO_CHARGE;

export default async function usageTrack(
  req: SkyfireRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.isBot) {
    next();
    return;
  }

  const jwtPayload = req.jwtPayload;

  console.log("// Usage Track Here and charge when threshold is met");

  // Let's charge as test
  const chargeResult = await chargeToken(jwtPayload);
  console.log(chargeResult, "// Charge Result");

  next();
}

async function chargeToken(jwtPayload: string | undefined): Promise<string> {
  const skyfireToken = jwtPayload;

  try {
    const response = await fetch(`${BACKEND_API_URL}/api/v1/tokens/charge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "skyfire-api-key": SELLER_SKYFIRE_API_KEY,
      },
      body: JSON.stringify({
        token: skyfireToken,
        chargeAmount: AMOUNT_TO_CHARGE,
      }),
    });

    const data = await response.json();
    return JSON.stringify(data);
  } catch (err: unknown) {
    console.error("Error while charging token: ", err);
    return `Error while charging token: ${
      err instanceof Error ? err.message : String(err)
    }`;
  }
}
