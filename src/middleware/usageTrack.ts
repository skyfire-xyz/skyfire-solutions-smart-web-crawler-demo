import { Request, Response, NextFunction } from "express";

export default async function usageTrack(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log("// Usage Track Here and charge when threshold is met");
  next();
}
