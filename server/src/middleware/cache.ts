import type { Request, Response, NextFunction } from "express";
import { LRUCache } from "lru-cache";

const cacheStore = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 30
});

export const cacheResponse = (ttlSeconds = 30) => (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as { sub?: string; role?: string; email?: string } | undefined;
  const userKey = user ? `${user.sub ?? "anon"}:${user.role ?? "role"}:${user.email ?? "email"}` : "anonymous";
  const key = `${req.method}:${req.originalUrl}:${userKey}`;

  if (req.method !== "GET") {
    return next();
  }

  const cached = cacheStore.get(key);
  if (cached) {
    return res.json(cached);
  }

  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    cacheStore.set(key, body, { ttl: ttlSeconds * 1000 });
    return originalJson(body);
  };

  return next();
};
