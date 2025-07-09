import { Request, Response, NextFunction } from "express";
import { BotRequest } from "../type";

export default function identifyBot(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  // Currently Identify Bot as a bot if the header is set to true
  const testBotHeader = req.header("x-isbot");

  if (testBotHeader && testBotHeader.toLowerCase() === "true") {
    (req as BotRequest).isBot = true;
    console.log("Bot identified");
    return next();
  }

  next();
}
