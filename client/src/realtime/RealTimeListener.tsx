import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type RealtimeTransport = "sse" | "ws";
export type RealtimeStatus = "connected" | "connecting" | "reconnecting" | "offline" | "disconnected";

export interface RealtimeEvent {
  type: string;
  payload?: any;
  createdAt?: string;
}

interface RealtimeState {
  status: RealtimeStatus;
  transport: RealtimeTransport;
  lastEventAt?: string;
  lastEvent?: RealtimeEvent;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const TRANSPORT = (import.meta.env.VITE_REALTIME_TRANSPORT || "sse") as RealtimeTransport;
const STREAM_URL = `${API_BASE_URL}/stream`;
const WS_URL = `${API_BASE_URL.replace(/^http/, "ws")}/ws`;

const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

const eventTypes = [
  "lead.created",
  "lead.updated",
  "lead.deleted",
  "customer.created",
  "customer.updated",
  "customer.deleted",
  "plot.updated",
  "favorite.created",
  "favorite.deleted",
  "inquiry.created",
  "user.registered",
  "tracking.updated"
];

const RealtimeContext = createContext<RealtimeState>({
  status: "disconnected",
  transport: TRANSPORT
});

export const useRealtimeStatus = () => useContext(RealtimeContext);

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<RealtimeStatus>("disconnected");
  const [lastEventAt, setLastEventAt] = useState<string | undefined>(undefined);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | undefined>(undefined);
  const connectionRef = useRef<EventSource | WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const retryRef = useRef(0);
  const connectRef = useRef<() => void>(() => {});

  const closeConnection = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const invalidateForEvent = useCallback(
    (type: string) => {
      if (type.startsWith("lead.")) {
        queryClient.invalidateQueries({ queryKey: ["leads"] });
        queryClient.invalidateQueries({ queryKey: ["plots"] });
        queryClient.invalidateQueries({ queryKey: ["venture"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        return;
      }

      if (type.startsWith("customer.")) {
        queryClient.invalidateQueries({ queryKey: ["customer-records"] });
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["tracking-customers"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        return;
      }

      if (type.startsWith("plot.")) {
        queryClient.invalidateQueries({ queryKey: ["plots"] });
        queryClient.invalidateQueries({ queryKey: ["venture"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        return;
      }

      if (type.startsWith("favorite.")) {
        queryClient.invalidateQueries({ queryKey: ["favorites"] });
        return;
      }

      if (type.startsWith("inquiry.")) {
        queryClient.invalidateQueries({ queryKey: ["inquiries"] });
        return;
      }

      if (type.startsWith("user.")) {
        queryClient.invalidateQueries({ queryKey: ["employees"] });
        queryClient.invalidateQueries({ queryKey: ["admins"] });
        queryClient.invalidateQueries({ queryKey: ["users"] });
        return;
      }

      if (type.startsWith("tracking.")) {
        queryClient.invalidateQueries({ queryKey: ["tracking"] });
      }
    },
    [queryClient]
  );

  const handleEvent = useCallback(
    (event?: RealtimeEvent) => {
      if (!event?.type) return;
      if (event.type === "connected") {
        setStatus("connected");
        retryRef.current = 0;
        return;
      }

      setLastEvent(event);
      setLastEventAt(event.createdAt || new Date().toISOString());
      invalidateForEvent(event.type);

      if (user?.role === "ADMIN") {
        if (event.type === "inquiry.created") {
          const name = event.payload?.inquiry?.customerName || "customer";
          toast(`New inquiry from ${name}`);
        }
        if (event.type === "favorite.created") {
          toast("A plot was favorited");
        }
        if (event.type === "favorite.deleted") {
          toast("A plot was unfavorited");
        }
        if (event.type === "user.registered") {
          const email = event.payload?.user?.email || "a new user";
          toast(`New user registered: ${email}`);
        }
      }
    },
    [invalidateForEvent, user?.role]
  );

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) return;
    const attempt = retryRef.current + 1;
    retryRef.current = attempt;
    const delay = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS);
    reconnectTimerRef.current = window.setTimeout(() => {
      reconnectTimerRef.current = null;
      connectRef.current();
    }, delay);
  }, []);

  const connectSse = useCallback(() => {
    if (!navigator.onLine || connectionRef.current) return;

    setStatus(retryRef.current > 0 ? "reconnecting" : "connecting");

    const source = new EventSource(STREAM_URL, { withCredentials: true });
    connectionRef.current = source;

    source.addEventListener("connected", () => {
      handleEvent({ type: "connected" });
    });

    const handleStreamEvent = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        const type = payload?.type || event.type;
        handleEvent({ ...payload, type });
      } catch {
        // ignore malformed messages
      }
    };

    eventTypes.forEach((type) => {
      source.addEventListener(type, handleStreamEvent);
    });

    source.onerror = () => {
      closeConnection();
      setStatus(navigator.onLine ? "reconnecting" : "offline");
      scheduleReconnect();
    };
  }, [closeConnection, handleEvent, scheduleReconnect]);

  const connectWs = useCallback(() => {
    if (!navigator.onLine || connectionRef.current) return;

    setStatus(retryRef.current > 0 ? "reconnecting" : "connecting");

    const socket = new WebSocket(WS_URL);
    connectionRef.current = socket;

    socket.onopen = () => {
      handleEvent({ type: "connected" });
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        handleEvent(payload);
      } catch {
        // ignore malformed messages
      }
    };

    socket.onerror = () => {
      socket.close();
    };

    socket.onclose = () => {
      closeConnection();
      setStatus(navigator.onLine ? "reconnecting" : "offline");
      scheduleReconnect();
    };
  }, [closeConnection, handleEvent, scheduleReconnect]);

  const connect = useCallback(() => {
    if (loading || !user) {
      closeConnection();
      setStatus("disconnected");
      return;
    }

    if (!navigator.onLine) {
      closeConnection();
      setStatus("offline");
      return;
    }

    if (TRANSPORT === "ws") {
      connectWs();
      return;
    }

    connectSse();
  }, [closeConnection, connectSse, connectWs, loading, user]);

  connectRef.current = connect;

  useEffect(() => {
    connect();
    return () => closeConnection();
  }, [connect, closeConnection]);

  useEffect(() => {
    const handleOnline = () => {
      retryRef.current = 0;
      connect();
    };
    const handleOffline = () => {
      closeConnection();
      setStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [closeConnection, connect]);

  const value = useMemo<RealtimeState>(() => ({
    status,
    transport: TRANSPORT,
    lastEventAt,
    lastEvent
  }), [lastEvent, lastEventAt, status]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};

export default RealtimeProvider;
