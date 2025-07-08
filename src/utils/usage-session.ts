import { redis } from "../config/redis";

export async function updateUsageSession(
  redisKey: string,
  perRequestAmount: number,
  sessionDuration: number
) {
  const multi = redis.multi();
  multi.hincrby(redisKey, "count", 1);
  multi.hincrbyfloat(redisKey, "accumulated", perRequestAmount);
  multi.hset(redisKey, "lastRequest", Date.now());
  multi.expire(redisKey, sessionDuration);
  const execResult = await multi.exec();

  let count: number | undefined = undefined;
  let accumulated: number | undefined = undefined;
  if (execResult && Array.isArray(execResult)) {
    const countRes = execResult[0];
    const accumulatedRes = execResult[1];
    if (Array.isArray(countRes) && typeof countRes[1] === "number") {
      count = countRes[1];
    }
    if (
      Array.isArray(accumulatedRes) &&
      typeof accumulatedRes[1] === "number"
    ) {
      accumulated = accumulatedRes[1];
    }
  }
  return { count, accumulated };
}
