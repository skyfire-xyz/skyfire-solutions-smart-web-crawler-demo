import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Environment variable schema
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(4000),

  // Redis configuration
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(6379),

  // Skyfire API configuration
  SKYFIRE_API_URL: z.string().default("https://app.skyfire.xyz"),
  SKYFIRE_SELLER_API_KEY: z
    .string()
    .min(1, "SKYFIRE_SELLER_API_KEY is required"),
  SELLER_SERVICE_ID: z.string().min(1, "SELLER_SERVICE_ID is required"),
  SELLER_SERVICE_AGENT_ID: z
    .string()
    .min(1, "SELLER_SERVICE_AGENT_ID is required"),

  // JWT configuration
  JWT_ISSUER: z.string().min(1, "JWT_ISSUER is required"),

  // Proxy configuration
  PROXY_TARGET: z
    .string()
    .url()
    .default("https://demo-real-estate-prv4.onrender.com/"),

  // Usage tracking configuration
  BATCH_AMOUNT_THRESHOLD: z
    .string()
    .transform((val) => parseFloat(val))
    .default(0.1),
  REDIS_SESSION_EXPIRY: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(300),
  OVERRIDE_MAXIMUM_REQUEST_COUNT: z.string().optional(),

  // Session monitoring
  EXPIRE_MONITOR_INTERVAL: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default(30000),

  // DataDog configuration
  DD_ENABLED: z
    .string()
    .transform((val) => val === "true")
    .default(false),
  DD_API_KEY: z.string().optional(),
  DD_ENV: z.string().default("dev"),
  DD_VERSION: z.string().optional(),
  DD_AGENT_HOST: z.string().optional(),
  DD_TRACE_AGENT_PORT: z
    .string()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .optional(),

  // Logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment validation failed:");
      error.issues.forEach((err) => {
        console.error(`  ${err.path.join(".")}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

// Lazy loading - parse env when first accessed
let _env: z.infer<typeof envSchema> | null = null;

export const getEnv = () => {
  if (!_env) {
    _env = parseEnv();
  }
  return _env;
};

// Export the validated environment configuration
export const env = getEnv();

// Function to refresh env (useful for tests)
export const refreshEnv = () => {
  _env = null;
  return getEnv();
};

// Export the schema for testing
export { envSchema };

// Type for the environment configuration
export type EnvConfig = z.infer<typeof envSchema>;
