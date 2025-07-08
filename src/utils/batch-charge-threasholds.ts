// src/usage/batchChargeThresholds.ts

/**
 * Should trigger a batch charge based on request count.
 */
export function shouldBatchChargeByCount(
  count: number,
  batchSize: number
): boolean {
  return (
    typeof count === "number" &&
    typeof batchSize === "number" &&
    count > 0 &&
    count % batchSize === 0
  );
}

/**
 * Should trigger a batch charge based on accumulated amount.
 */
export function shouldBatchChargeByAmount(
  accumulated: number,
  minCharge: number
): boolean {
  return (
    typeof accumulated === "number" &&
    typeof minCharge === "number" &&
    accumulated >= minCharge
  );
}

/**
 * (Optional) Should trigger a batch charge based on inactivity.
 */
export function shouldBatchChargeByInactivity(
  lastRequest: number,
  sessionDurationMs: number
): boolean {
  return (
    typeof lastRequest === "number" &&
    Date.now() - lastRequest > sessionDurationMs
  );
}
