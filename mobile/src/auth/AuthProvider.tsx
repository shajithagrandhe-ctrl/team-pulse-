import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { createApiClient, ApiError, validateApiUrl } from "../../../shared/api-client";
import { USER_ROLES, type User } from "../../../shared/contracts";
import { sessionStorage } from "../lib/session-storage";

const userSchema = z.object({ id: z.string(), email: z.string().email(), displayName: z.string(), fullName: z.string(), role: z.enum(USER_ROLES) }).passthrough();
const loginSchema = z.object({ user: userSchema, token: z.string().min(1) });
type Credentials = { email: string; password: string; adminCode?: string; expectedRole?: User["role"] };
type Auth = {
  user: User | null; loading: boolean; error: string | null; api: ReturnType<typeof createApiClient> | null;
  login: (credentials: Credentials) => Promise<User>;
  logout: () => Promise<void>; restore: () => Promise<void>; clear: () => Promise<void>;
};
const Context = createContext<Auth | null>(null);
export const readableError = (error: unknown) => error instanceof ApiError || error instanceof Error
  ? error.message
  : "Unable to complete the request. Please try again.";

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [tokens] = useState(() => {
    let value: string | null = null;
    return { read: async () => value, get: () => value, set: (next: string | null) => { value = next; } };
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const configuration = useMemo(() => {
    try { return { url: validateApiUrl(process.env.EXPO_PUBLIC_API_URL, __DEV__ || process.env.EXPO_PUBLIC_BUILD_CHANNEL === "local-preview"), error: null }; }
    catch { return { url: null, error: "API connection is not configured correctly" }; }
  }, []);
  const clear = useCallback(async () => {
    tokens.set(null); setUser(null);
    await queryClient.cancelQueries(); queryClient.clear(); await sessionStorage.clear();
  }, [queryClient, tokens]);
  const api = useMemo(() => configuration.url ? createApiClient({
    baseUrl: configuration.url, getToken: tokens.read, onUnauthorized: clear
  }) : null, [configuration.url, clear, tokens]);
  const hydrate = useCallback(async (stored: string | null) => {
    try {
      setLoading(true); setError(null);
      if (!api) { setError(configuration.error); return; }
      tokens.set(stored);
      if (!stored) { setUser(null); return; }
      const response = await api.request<{ user: User }>("/auth/me");
      if (tokens.get() === stored) setUser(userSchema.parse(response.data.user));
    } catch (failure) {
      if (failure instanceof ApiError && [401, 403].includes(failure.status)) {
        try { await clear(); } catch (storageFailure) { setError(readableError(storageFailure)); }
      }
      else setError(readableError(failure));
    } finally { setLoading(false); }
  }, [api, clear, configuration.error, tokens]);
  const restore = useCallback(async () => {
    try { await hydrate(await sessionStorage.read()); }
    catch (failure) { setError(readableError(failure)); setLoading(false); }
  }, [hydrate]);
  useEffect(() => {
    let active = true;
    sessionStorage.read().then((stored) => { if (active) void hydrate(stored); }).catch((failure: unknown) => {
      if (active) { setError(readableError(failure)); setLoading(false); }
    });
    return () => { active = false; };
  }, [hydrate]);
  const login = useCallback(async (credentials: Credentials) => {
    if (!api) throw new Error("API configuration unavailable");
    const { expectedRole, ...body } = credentials;
    const response = await api.request<{ user: User; token: string }>("/auth/native/login", { method: "POST", authenticated: false, body });
    const session = loginSchema.parse(response.data);
    if (expectedRole && session.user.role !== expectedRole) {
      throw new Error(`This account belongs to the ${session.user.role.toLowerCase()} portal. Select the matching role and try again.`);
    }
    await queryClient.cancelQueries(); queryClient.clear(); await sessionStorage.write(session.token);
    tokens.set(session.token); setUser(session.user); setError(null);
    return session.user;
  }, [api, queryClient, tokens]);
  const logout = useCallback(async () => {
    if (tokens.get() && api) {
      try { await api.request("/auth/logout", { method: "POST" }); }
      catch { /* Local logout must remain available when the API is offline. */ }
    }
    await clear(); setError(null);
  }, [api, clear, tokens]);
  return <Context.Provider value={{ user, loading, error, api, login, logout, restore, clear }}>{children}</Context.Provider>;
}
export const useAuth = () => {
  const context = useContext(Context);
  if (!context) throw new Error("AuthProvider is required");
  return context;
};
