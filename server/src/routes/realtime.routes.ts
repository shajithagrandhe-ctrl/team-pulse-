import { Router } from "express";
import type { Response } from "express";
import { extractToken, requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { subscribe } from "../realtime/events.js";
import { eventForRole } from "../realtime/audience.js";
import { assertActiveAccount } from "../services/session.service.js";
import { verifyAccessToken } from "../utils/tokens.js";

const router = Router();

router.get("/stream", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ ok: true, ts: new Date().toISOString() })}\n\n`);

  const token = extractToken(req) as string;
  const unsubscribe = subscribe(async (event) => {
    try {
      const user = await assertActiveAccount(verifyAccessToken(token));
      if (res.writableEnded) return;
      res.write(`event: ${event.type}\n`);
      res.write(`id: ${event.id}\n`);
      res.write(`data: ${JSON.stringify(eventForRole(event, user.role))}\n\n`);
    } catch {
      res.end();
    }
  });

  const expiry = setTimeout(() => res.end(), Math.min(2_147_483_647, Math.max(0, req.user!.exp! * 1000 - Date.now())));
  const heartbeat = setInterval(async () => {
    try {
      await assertActiveAccount(verifyAccessToken(token));
      if (!res.writableEnded) res.write(": ping\n\n");
    } catch {
      res.end();
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    clearTimeout(expiry);
    unsubscribe();
  });
});

export default router;
