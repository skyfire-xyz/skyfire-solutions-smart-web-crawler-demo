import express from "express";
import identifyBot from "../middleware/identify-bot";
import verifyHeader from "../middleware/verify-header";
import usageTrack from "../middleware/usage-track";
import { connectRedis, disconnectRedis } from "../config/redis";

// Mock the external dependencies
jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

jest.mock("../utils/dd-agent", () => ({}));

describe("Bot Protection Integration Tests", () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    // Environment variables are loaded from .env.test via jest.setup.js

    // Connect to Redis for testing
    await connectRedis();
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Add middleware in the same order as the main app
    app.use(identifyBot);
    app.use(verifyHeader);
    app.use(usageTrack);

    // Add a test endpoint that will be reached if middleware passes
    app.get("/", (req, res) => {
      res.json({
        success: true,
        isBot: (req as any).isBot,
        hasToken: !!(req as any).skyfireToken,
      });
    });

    // Start server on a random port
    server = app.listen(0);
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  const makeRequest = async (headers: Record<string, string> = {}) => {
    const port = (server.address() as any).port;
    const url = `http://localhost:${port}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    let body;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      body = (await response.json()) as any;
    } else {
      // Handle non-JSON responses (like HTML error pages)
      const text = await response.text();
      body = text;
    }

    // Capture important headers
    const responseHeaders = {
      "X-Payment-Charged": response.headers.get("X-Payment-Charged"),
      "X-Payment-Session-Count": response.headers.get(
        "X-Payment-Session-Count"
      ),
      "X-Payment-Session-Accumulated-Amount": response.headers.get(
        "X-Payment-Session-Accumulated-Amount"
      ),
      "X-Payment-Session-Remaining-Balance": response.headers.get(
        "X-Payment-Session-Remaining-Balance"
      ),
      "X-Payment-Session-Batch-Threshold": response.headers.get(
        "X-Payment-Session-Batch-Threshold"
      ),
    };

    return { status: response.status, body, headers: responseHeaders };
  };

  describe("Token Creation and Validation", () => {
    test("should pass request without bot header", async () => {
      const response = await makeRequest({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should reject bot request without token", async () => {
      const response = await makeRequest({
        "x-isbot": "true",
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe(
        "Missing Skyfire token `skyfire-pay-id`"
      );
    });

    test("should reject bot request with invalid token", async () => {
      const response = await makeRequest({
        "x-isbot": "true",
        "skyfire-pay-id": "invalid.token.here",
      });

      expect(response.status).toBe(401);
      // The middleware should return JSON error for invalid tokens
      expect(response.body.error).toBe("Your JWT token is invalid");
    });
  });

  describe("End-to-End Bot Protection Flow", () => {
    test("should handle complete bot protection flow with valid token", async () => {
      // First, create a token
      const tokenResponse = await fetch(
        `${process.env.BACKEND_API_URL}/api/v1/tokens`,
        {
          method: "POST",
          headers: {
            "skyfire-api-key": process.env.SKYFIRE_API_KEY,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            type: "pay",
            buyerTag: "",
            tokenAmount: "0.01",
            sellerServiceId: process.env.OFFICIAL_SKYFIRE_EXPECTED_SSI,
            expiresAt: Math.floor(Date.now() / 1000) + 30, // 30 seconds from now
          }),
        }
      );

      expect(tokenResponse.status).toBe(200);
      const data = (await tokenResponse.json()) as any;
      const token = data.token;

      // Now test the bot protection with the created token
      const response = await makeRequest({
        "x-isbot": "true",
        "skyfire-pay-id": token,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.isBot).toBe(true);
      expect(response.body.hasToken).toBe(true);
    }, 15000);
  });

  describe("Batch Charging Behavior with Shared Session", () => {
    let sharedToken: string;

    beforeAll(async () => {
      // Create a shared token for all tests in this describe block
      const tokenResponse = await fetch(
        `${process.env.BACKEND_API_URL}/api/v1/tokens`,
        {
          method: "POST",
          headers: {
            "skyfire-api-key": process.env.SKYFIRE_API_KEY,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            type: "pay",
            buyerTag: "",
            tokenAmount: "0.01",
            sellerServiceId: process.env.OFFICIAL_SKYFIRE_EXPECTED_SSI,
            expiresAt: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
          }),
        }
      );

      expect(tokenResponse.status).toBe(200);
      const data = (await tokenResponse.json()) as any;
      sharedToken = data.token;
    });

    test("should get charged 0.01 for the first request", async () => {
      const response = await makeRequest({
        "x-isbot": "true",
        "skyfire-pay-id": sharedToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.isBot).toBe(true);
      expect(response.body.hasToken).toBe(true);
    });

    test("should make another 9 successful requests", async () => {
      const responses = [];

      // Make exactly 10 requests
      for (let i = 0; i < 9; i++) {
        const response = await makeRequest({
          "x-isbot": "true",
          "skyfire-pay-id": sharedToken,
        });

        responses.push({
          requestNumber: i + 1,
          status: response.status,
          body: response.body,
          headers: response.headers,
        });

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // All requests should succeed
      const successfulRequests = responses.filter((r) => r.status === 200);
      expect(successfulRequests.length).toBe(9);

      console.log(`✅ All ${successfulRequests.length} requests succeeded`);
    }, 30000);

    test("should next request fail with 402", async () => {
      const response = await makeRequest({
        "x-isbot": "true",
        "skyfire-pay-id": sharedToken,
      });
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify the batch threshold header
      expect(response.status).toBe(402);
      expect(response.body.error).toContain("Payment Required");
      expect(response.headers["X-Payment-Session-Remaining-Balance"]).toBe("0");
      expect(response.headers["X-Payment-Session-Accumulated-Amount"]).toBe(
        "0"
      );
    }, 30000);
  });
});
