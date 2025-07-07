import { createProxyMiddleware } from "http-proxy-middleware";
import { Request, Response, NextFunction } from "express";
import { ClientRequest, IncomingMessage } from "http";
import { redis } from "../config/redis";

interface ProxyConfig {
  target: string;
  changeOrigin?: boolean;
  pathRewrite?: Record<string, string>;
  onProxyReq?: (proxyReq: ClientRequest, req: Request, res: Response) => void;
  onProxyRes?: (proxyRes: IncomingMessage, req: Request, res: Response) => void;
  onError?: (err: Error, req: Request, res: Response) => void;
}

export const createCachedProxyMiddleware = (config: ProxyConfig) => {
  const proxyMiddleware = createProxyMiddleware({
    target: config.target,
    changeOrigin: config.changeOrigin !== false,
    pathRewrite: config.pathRewrite || {},
    on: {
      proxyReq: (proxyReq: ClientRequest, req: IncomingMessage, _res): void => {
        console.log(
          `Proxying request: ${(req as any).method} ${(req as any).url} -> ${
            config.target
          }`
        );
        // Write logic here: e.g., modify proxy request headers if needed
        if (config.onProxyReq) {
          config.onProxyReq(
            proxyReq,
            req as any as Request,
            _res as any as Response
          );
        }
      },
      proxyRes: async (
        proxyRes: IncomingMessage,
        req: IncomingMessage,
        _res
      ): Promise<void> => {
        console.log(
          `Proxy response: ${proxyRes.statusCode} from ${(req as any).url}`
        );
        // Write logic here: e.g., inspect or modify proxy response if needed
        if (config.onProxyRes) {
          config.onProxyRes(
            proxyRes,
            req as any as Request,
            _res as any as Response
          );
        }
      },
      error: (err: Error, req: IncomingMessage, res): void => {
        console.error("Proxy error:", err);
        if (config.onError) {
          config.onError(err, req as any as Request, res as any as Response);
        } else {
          (res as any as Response)
            .status(500)
            .json({ error: "Proxy error", message: err.message });
        }
      },
    },
  });

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Simple logic: use IP address as user identifier
    const userKey = `user:${req.ip}:count`;
    let count = 0;
    try {
      count = await redis.incr(userKey);
      // Optionally, set an expiry so the count resets after a period (e.g., 1 hour)
      await redis.expire(userKey, 3600); // 1 hour
      console.log(`Request count for ${req.ip}: ${count}`);
    } catch (err) {
      console.error("Failed to increment request count in Redis:", err);
    }

    proxyMiddleware(req, res, next);
  };
};
