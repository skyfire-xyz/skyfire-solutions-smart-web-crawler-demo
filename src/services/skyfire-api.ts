const BACKEND_API_URL = process.env.BACKEND_API_URL;
const SELLER_SKYFIRE_API_KEY = process.env.SELLER_SKYFIRE_API_KEY;

interface ChargeTokenResponse {
  amountCharged: string;
  remainingBalance: string;
}

export async function chargeToken(
  skyfireToken: string,
  amountToCharge: number
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

    const data = await response.json();

    console.log("Successfully charged token", data);

    return data as ChargeTokenResponse;
  } catch (err: unknown) {
    console.error("Error while charging token: ", err);
    throw err;
  }
}
