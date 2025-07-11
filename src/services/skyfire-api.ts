import logger from "../utils/logger";

const BACKEND_API_URL = process.env.BACKEND_API_URL;
const SELLER_SKYFIRE_API_KEY = process.env.SELLER_SKYFIRE_API_KEY;

interface ChargeTokenResponse {
  amountCharged: string;
  remainingBalance: string;
}

interface ChargeTokenError {
  code: string;
  message: string;
}

export async function chargeToken(
  skyfireToken: string,
  amountToCharge: number,
  sessionId?: string
): Promise<ChargeTokenResponse> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/v1/tokens/charge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "skyfire-api-key": SELLER_SKYFIRE_API_KEY,
      },
      body: JSON.stringify({
        token: skyfireToken,
        chargeAmount: `${amountToCharge}`,
      }),
    });

    const data = (await response.json()) as ChargeTokenError;

    if (data.code === "PAYMENT_ERROR") {
      throw new Error(`Payment Error: ${data.code} ${data.message}`);
    }

    if (sessionId) {
      logger.info({
        event: "token_charged",
        sessionId,
        amount: amountToCharge,
        msg: "💸 Successfully charged token",
        data,
      });
    } else {
      logger.info({
        event: "token_charged",
        msg: "💸 Successfully charged token",
        data,
      });
    }

    return data as unknown as ChargeTokenResponse;
  } catch (err: unknown) {
    if (sessionId) {
      logger.warn({
        event: "token_charge_failed",
        sessionId,
        error: err,
        msg: "💸 Error charging token",
      });
    } else {
      logger.warn({
        event: "token_charge_failed",
        error: err,
        msg: "💸 Error charging token",
      });
    }
    throw err;
  }
}
