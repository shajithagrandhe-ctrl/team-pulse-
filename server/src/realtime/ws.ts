import type { IncomingMessage, Server as HttpServer } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import { parse as parseCookie } from "cookie";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { subscribe } from "./events.js";
import { eventForRole } from "./audience.js";
import { assertActiveAccount } from "../services/session.service.js";

const getTokenFromRequest = (req: IncomingMessage) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  const cookies = parseCookie(cookieHeader);
  return cookies[env.accessTokenCookieName];
};

const markAlive = (socket: WebSocket & { isAlive?: boolean }) => {
  socket.isAlive = true;
};

export const attachWebSocketServer = (server: HttpServer) => {
  const wss = new WebSocketServer({ server, path: "/api/ws" });

  const interval = setInterval(() => {
    wss.clients.forEach((socket: any) => {
      const ws = socket as any;
      if (ws.isAlive === false) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  wss.on("connection", async (socket: any, req: IncomingMessage) => {
    const token = getTokenFromRequest(req);
    if (!token) {
      socket.close(1008, "Unauthorized");
      return;
    }

    let expiryAt: number;
    try {
      expiryAt = (await assertActiveAccount(verifyAccessToken(token))).exp! * 1000;
    } catch (err) {
      logger.warn({ err }, "WebSocket auth failed");
      socket.close(1008, "Unauthorized");
      return;
    }

    const ws = socket as any;
    if (ws.readyState !== ws.OPEN) return;
    ws.isAlive = true;
    ws.on("pong", () => markAlive(ws));

    ws.send(JSON.stringify({ type: "connected", ts: new Date().toISOString() }));

    const expiry = setTimeout(() => ws.close(1008, "Session expired"), Math.min(2_147_483_647, Math.max(0, expiryAt - Date.now())));
    const accountCheck = setInterval(async () => {
      try {
        await assertActiveAccount(verifyAccessToken(token));
      } catch {
        ws.close(1008, "Session expired");
      }
    }, 25000);
    const unsubscribe = subscribe(async (event) => {
      try {
        const user = await assertActiveAccount(verifyAccessToken(token));
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(eventForRole(event, user.role)));
      } catch {
        ws.close(1008, "Session expired");
      }
    });

    ws.on("close", () => {
      clearTimeout(expiry);
      clearInterval(accountCheck);
      unsubscribe();
    });
  });

  return wss;
};
