const BACKEND_API_URL = process.env.BACKEND_API_URL;
const SELLER_SKYFIRE_API_KEY = process.env.SELLER_SKYFIRE_API_KEY;

export async function chargeToken(
  skyfireToken: string,
  amountToCharge: number
): Promise<string> {
  console.log("skyfireToken", skyfireToken);

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

    return JSON.stringify(data);
  } catch (err: unknown) {
    console.error("Error while charging token: ", err);
    return `Error while charging token: ${
      err instanceof Error ? err.message : String(err)
    }`;
  }
}
