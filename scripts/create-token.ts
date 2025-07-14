#!/usr/bin/env tsx

import dotenv from "dotenv";
import readline from "readline";

// Load environment variables from .env.test
dotenv.config({ path: ".env.test" });

interface TokenParams {
  tokenAmount: string;
  buyerTag?: string;
  sellerServiceId?: string;
}

async function promptForParams(): Promise<TokenParams> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, resolve);
    });
  };

  try {
    console.log("🌐 Skyfire Token Creator");
    console.log("========================\n");

    const tokenAmount = await question("Enter token amount (e.g., 0.01): ");
    const buyerTag = await question(
      "Enter buyer tag (optional, press Enter to skip): "
    );
    const sellerServiceId = await question(
      `Enter seller service ID (optional, default: ${process.env.OFFICIAL_SKYFIRE_EXPECTED_SSI}): `
    );

    return {
      tokenAmount: tokenAmount.trim(),
      buyerTag: buyerTag.trim() || undefined,
      sellerServiceId:
        sellerServiceId.trim() || process.env.OFFICIAL_SKYFIRE_EXPECTED_SSI,
    };
  } finally {
    rl.close();
  }
}

async function createToken(params: TokenParams): Promise<void> {
  const apiKey = process.env.SKYFIRE_API_KEY;
  const backendUrl = process.env.BACKEND_API_URL;

  if (!apiKey) {
    console.error("❌ Error: SKYFIRE_API_KEY not found in .env.test");
    process.exit(1);
  }

  if (!backendUrl) {
    console.error("❌ Error: BACKEND_API_URL not found in .env.test");
    process.exit(1);
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60; // 5 minutes from now

  const requestBody = {
    type: "pay",
    buyerTag: params.buyerTag || "",
    tokenAmount: params.tokenAmount,
    sellerServiceId: params.sellerServiceId,
    expiresAt,
  };

  console.log("\n📤 Creating token...");
  console.log("Request body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(`${backendUrl}/api/v1/tokens`, {
      method: "POST",
      headers: {
        "skyfire-api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      console.error("Response:", errorText);
      process.exit(1);
    }

    const data = await response.json();

    console.log("\n✅ Token created successfully!");
    console.log("========================");
    console.log(`Token: ${data.token}`);
    console.log(`Expires: ${new Date(expiresAt * 1000).toISOString()}`);
    console.log(`Amount: ${params.tokenAmount}`);
    console.log(`Buyer Tag: ${params.buyerTag || "None"}`);
    console.log(`Seller Service ID: ${params.sellerServiceId}`);

    // Generate curl command
    const port = process.env.PORT || "4000";
    const curlCommand = `curl -IH "x-isbot: true" -H "skyfire-pay-id: ${data.token}" http://localhost:${port}/`;

    console.log("\n🔗 Test with curl:");
    console.log("========================");
    console.log(curlCommand);

    // Copy token to clipboard if available
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(data.token);
      console.log("\n📋 Token copied to clipboard!");
    }
  } catch (error) {
    console.error("❌ Error creating token:", error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  try {
    const params = await promptForParams();
    await createToken(params);
  } catch (error) {
    console.error("❌ Script error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
