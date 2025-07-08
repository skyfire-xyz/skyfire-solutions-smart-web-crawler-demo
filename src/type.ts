import { Request } from "express";

export interface DecodedSkyfireJwt {
  env: string;
  btg: string;
  ssi: string;
  value: string;
  amount: string;
  sps: string;
  spr: string;
  mnr: number;
  cur: string;
  iat: number;
  iss: string;
  jti: string;
  aud: string;
  sub: string;
  exp: number;
}

export interface BotProtectionRequest extends Request {
  isBot?: boolean;
  decodedJWT?: DecodedSkyfireJwt;
  skyfireToken?: string;
}

export interface SellerServiceInfo {
  id: string;
  active: boolean;
  approved: boolean;
  userAgentId: string;
  minimumTokenAmount: number;
  createdDate: string; // ISO date string
  updatedDate: string; // ISO date string
  name: string;
  description: string;
  tags: string[];
  price: number;
  priceSchema: string;
  type: string;
  apiSpec: any | null;
  url: string;
  identityVerification: {
    business: any[]; // You can replace 'any' with a more specific type if you know it
    individual: any[]; // You can replace 'any' with a more specific type if you know it
  };
}
