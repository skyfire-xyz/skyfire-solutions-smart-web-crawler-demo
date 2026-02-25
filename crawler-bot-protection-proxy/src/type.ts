import { Request } from "express";

export interface DecodedSkyfireJwt {
  ver: string;
  env: string;
  btg?: string;
  ssi: string;
  scopes: string[];
  bid: { email: string };
  aid: { creation_id: string, source_ips: string[] };
  rid: {};
  value: string;
  amount: string;
  cur: string;
  stp: string;
  sti: { type: string }
  spr: string;
  sps: string;
  mnr: number;
  iat: number;
  iss: string;
  jti: string;
  aud: string;
  sub: string;
  exp: number;
}
export interface BotRequest extends Request {
  isBot?: boolean;
  decodedJWT?: DecodedSkyfireJwt;
  skyfireToken?: string;
}
export interface VerifiedJWTRequest extends BotRequest {
  isBot: true;
  decodedJWT: DecodedSkyfireJwt;
  skyfireToken: string;
}

// Type guards
export function isBotRequest(req: Request): req is BotRequest {
  return (req as BotRequest).isBot === true;
}

export function hasVerifiedJwt(req: Request): req is VerifiedJWTRequest {
  const verifiedReq = req as VerifiedJWTRequest;
  return (
    verifiedReq.isBot === true &&
    !!verifiedReq.decodedJWT &&
    !!verifiedReq.skyfireToken
  );
}

export function isHumanRequest(req: Request): req is Request {
  return (req as BotRequest).isBot !== true;
}
