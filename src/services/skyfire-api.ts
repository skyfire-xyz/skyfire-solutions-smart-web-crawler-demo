import { SellerServiceInfo } from "../type";

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

export async function getSellerServiceInfo(
  sellerId: string
): Promise<SellerServiceInfo> {
  //   try {
  //     const response = await fetch(
  //       `${BACKEND_API_URL}/api/v1/sellers/${sellerId}`,
  //       {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //           "skyfire-api-key": SELLER_SKYFIRE_API_KEY,
  //         },
  //       }
  //     );
  //     const data = await response.json();
  //     return JSON.stringify(data);
  //   } catch (err: unknown) {
  //     console.error("Error while getting seller service info: ", err);
  //     return `Error while getting seller service info: ${
  //       err instanceof Error ? err.message : String(err)
  //     }`;
  //   }

  // TODO: Implement this
  // Cache the seller service info in Redis

  return {
    id: "ed9eae44-77ed-47bb-8f36-8fcaf363d3cf",
    active: true,
    approved: true,
    userAgentId: "5be86e6c-3ce7-46ad-9810-9269149251ff",
    minimumTokenAmount: 0.01,
    createdDate: "2025-07-07T17:42:31.895Z",
    updatedDate: "2025-07-07T17:42:31.895Z",
    name: "Real Estate Website",
    description: "",
    tags: [],
    price: 0.001,
    priceSchema: "PAY_PER_USE",
    type: "WEB_PAGE",
    apiSpec: null,
    url: "to-be-determined.com",
    identityVerification: {
      business: [],
      individual: [],
    },
  };
}
