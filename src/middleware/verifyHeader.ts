import { Request, Response, NextFunction } from "express";

export async function verifyHeader(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log("// Verify Header Here");
  next();
}
