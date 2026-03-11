import { createRemoteJWKSet, jwtVerify } from "jose";
import type { JWTPayload, JWSHeaderParameters } from "jose";
import validator from "validator";

const SKYFIRE_API_URL =
  process.env.SKYFIRE_API_URL || "https://api.skyfire.xyz";
const JWKS_URL = `${SKYFIRE_API_URL}/.well-known/jwks.json`;
const JWT_ISSUER = process.env.JWT_ISSUER || "https://app.skyfire.xyz";
const JWT_AUDIENCE = process.env.SELLER_SERVICE_AGENT_ID!;
const JWT_SPS = process.env.SELLER_SERVICE_SPS!;
const JWT_SPR = process.env.SELLER_SERVICE_SPR!;
const ALGORITHMS = ["ES256"];

export type VerifySuccess = { success: true; payload: JWTPayload };
export type VerifyError = { success: false; error: string; message: string };
export type VerifyResult = VerifySuccess | VerifyError;

export async function verifyKyaPayToken(token: string): Promise<VerifyResult> {
  let payload: JWTPayload;
  let protectedHeader: JWSHeaderParameters;

  try {
    const { payload: pl, protectedHeader: hdr } = await jwtVerify(
      token,
      createRemoteJWKSet(new URL(JWKS_URL)),
      {
        algorithms: ALGORITHMS as unknown as string[],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      }
    );
    payload = pl;
    protectedHeader = hdr;
  } catch (err: unknown) {
    console.error("JWT verification failed:", err);
    return {
      success: false,
      error: "invalid_token",
      message: "JWT verification failed: invalid token.",
    };
  }

  // Check typ header
  const typ = protectedHeader?.typ;
  if (typ !== "kya+pay+jwt") {
    console.error("Invalid typ:", typ);
    return {
      success: false,
      error: "invalid_typ",
      message: "typ should be kya+pay+jwt",
    };
  }

  // Validate email
  const email = (payload as Record<string, unknown>)?.hid as { email?: string } | undefined;
  const emailStr = email?.email;
  if (typeof emailStr !== "string" || !validator.isEmail(emailStr)) {
    console.error("Invalid email format");
    return {
      success: false,
      error: "invalid_email",
      message: "Invalid email format.",
    };
  }

  // Validate env
  if ((payload as Record<string, unknown>).env !== "production") {
    console.error("Invalid environment:", (payload as Record<string, unknown>).env);
    return {
      success: false,
      error: "invalid_env",
      message: "Token is not from production environment.",
    };
  }

  const now = Math.floor(Date.now() / 1000);

  // Validate iat
  const iat = payload.iat;
  if (typeof iat !== "number" || iat > now) {
    console.error("Invalid iat:", iat);
    return {
      success: false,
      error: "invalid_iat",
      message: "Issued-at time is in the future or missing.",
    };
  }

  // Validate exp
  const exp = payload.exp;
  if (typeof exp !== "number" || exp <= now) {
    console.error("Token has expired:", exp);
    return {
      success: false,
      error: "token_expired",
      message: "Token has expired.",
    };
  }

  // Validate jti is a UUID
  if (!validator.isUUID(payload.jti as string)) {
    console.error("Invalid jti:", payload.jti);
    return {
      success: false,
      error: "invalid_jti",
      message: "Invalid jti: not a valid UUID.",
    };
  }

  // Validate sub is a UUID
  if (!validator.isUUID(payload.sub as string)) {
    console.error("Invalid sub:", payload.sub);
    return {
      success: false,
      error: "invalid_sub",
      message: "Invalid sub: not a valid UUID.",
    };
  }

  // Pay-related fields
  const value = payload.value as string;
  if (isNaN(validator.toInt(value)) || parseInt(value, 10) <= 0) {
    return {
      success: false,
      error: "invalid_value",
      message: "Token value must be a positive integer.",
    };
  }

  const amount = payload.amount as string;
  if (isNaN(validator.toFloat(amount)) || parseFloat(amount) <= 0) {
    return {
      success: false,
      error: "invalid_amount",
      message: "Token amount must be a positive number.",
    };
  }

  const cur = payload.cur as string;
  if (cur !== "USD") {
    console.error("Invalid cur:", cur);
    return {
      success: false,
      error: "invalid_cur",
      message: "Currency should be USD.",
    };
  }

  if ((payload as Record<string, unknown>).sps !== JWT_SPS) {
    console.error("Invalid Price Model:", (payload as Record<string, unknown>).sps);
    return {
      success: false,
      error: "invalid_sps",
      message: "Price Model does not match seller service.",
    };
  }

  if ((payload as Record<string, unknown>).spr !== JWT_SPR) {
    console.error("Invalid Price:", (payload as Record<string, unknown>).spr);
    return {
      success: false,
      error: "invalid_spr",
      message: "Price does not match seller service.",
    };
  }

  return { success: true, payload };
}
