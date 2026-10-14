import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "../auth/AuthProvider";
import { sessionStorage } from "../lib/session-storage";

const message = z.object({ type: z.string().min(1) });
export function Realtime() {
  const { user, api } = useAuth();
  const cache = useQueryClient();
  useEffect(() => {
    if (!user || !api) return;
    let closed = false;
    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let delay = 1000;
    const stop = () => { clearTimeout(retry); const previous = socket; socket = null; previous?.close(); };
    const refresh = () => { void cache.invalidateQueries({ queryKey: ["business", user.id] }); };
    const connect = async () => {
      if (closed || (AppState.currentState && AppState.currentState !== "active")) return;
      // Browser WebSocket cannot send bearer headers; QA web uses scoped polling.
      if (Platform.OS === "web") { refresh(); retry = setTimeout(() => { void connect(); }, 30_000); return; }
      const token = await sessionStorage.read().catch(() => null);
      if (!token || closed) return;
      const base = process.env.EXPO_PUBLIC_API_URL;
      if (!base) return;
      const NativeSocket = WebSocket as unknown as new (url: string, protocols: string[], options: { headers: Record<string, string> }) => WebSocket;
      socket = new NativeSocket(`${base.replace(/^http/, "ws").replace(/\/$/, "")}/ws`, [],
        { headers: { Authorization: `Bearer ${token}` } });
      const connection = socket;
      connection.onopen = () => { delay = 1000; refresh(); };
      connection.onmessage = event => {
        try { const parsed = message.safeParse(JSON.parse(String(event.data))); if (parsed.success && parsed.data.type !== "connected") refresh(); }
        catch { /* Ignore malformed event frames; all data comes from scoped queries. */ }
      };
      connection.onerror = () => { connection.close(); };
      connection.onclose = event => {
        if (socket !== connection || closed || AppState.currentState !== "active") return;
        socket = null;
        if (event.code === 1008) {
          // Let the validated API account check decide whether to clear a session.
          void api.request("/auth/me").catch(() => undefined);
        }
        retry = setTimeout(() => { void connect(); }, delay);
        delay = Math.min(30_000, delay * 2);
      };
    };
    void connect();
    const subscription = AppState.addEventListener("change", state => {
      stop(); if (state === "active") { refresh(); void connect(); }
    });
    return () => { closed = true; stop(); subscription.remove(); };
  }, [user, api, cache]);
  return null;
}
