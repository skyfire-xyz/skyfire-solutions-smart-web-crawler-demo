import { Request, Response, NextFunction } from "express";
import { BotProtectionRequest } from "../type";

export interface IdentifyBotRequest extends Request {
  isBot?: boolean;
}

export default function identifyBot(
  req: BotProtectionRequest,
  _res: Response,
  next: NextFunction
) {
  // Test logic: allow explicit override via header
  const testBotHeader = req.header("x-isbot");

  if (testBotHeader && testBotHeader.toLowerCase() === "true") {
    console.log("// Identify Bot Here");
    req.isBot = true;
    return next();
  }

  next();
}
