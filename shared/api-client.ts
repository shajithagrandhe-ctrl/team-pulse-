import type { ApiResponse } from "./contracts.ts";

export class ApiError extends Error {
  readonly status: number;
  readonly kind: "http" | "network" | "timeout" | "cancelled" | "protocol";
  constructor(message: string, status = 0, kind: ApiError["kind"] = "http") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = kind;
  }
}

export const validateApiUrl = (value: string | undefined, development = false) => {
  if (!value) throw new Error("EXPO_PUBLIC_API_URL is required");
  const url = new URL(value);
  const hostname = url.hostname;
  const octets = hostname.split(".").map(Number);
  const ipv4 = octets.length === 4 && octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255);
  const privateHost = hostname === "localhost" || hostname === "127.0.0.1" || (ipv4 && (
    octets[0] === 10 || (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
  ));
  if (url.username || url.password || url.search || url.hash || hostname.endsWith(".invalid") ||
      (url.protocol !== "https:" && !(development && privateHost && url.protocol === "http:"))) {
    throw new Error("Configure a reachable HTTPS API URL (private HTTP is development-only)");
  }
  return url.toString().replace(/\/$/, "");
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  authenticated?: boolean;
};

type ClientOptions = {
  baseUrl: string;
  getToken: () => Promise<string | null>;
  onUnauthorized: () => Promise<void> | void;
  timeoutMs?: number;
  fetch?: typeof fetch;
};

export const createApiClient = (options: ClientOptions) => ({
  async request<T>(path: string, request: RequestOptions = {}): Promise<ApiResponse<T>> {
    // Only relative API paths may carry the token; callers cannot override the host.
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") ||
        path.split("/").some((part) => decodeURIComponent(part) === "..") || path.includes("?") || path.includes("#")) {
      throw new ApiError("Invalid API path", 0, "protocol");
    }
    const url = new URL(`${options.baseUrl}${path}`);
    for (const [key, value] of Object.entries(request.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const authenticated = request.authenticated !== false;
    const token = authenticated ? await options.getToken() : null;
    if (authenticated && !token) throw new ApiError("Please sign in again", 401);
    const controller = new AbortController();
    let timedOut = false;
    const cancel = () => controller.abort();
    request.signal?.addEventListener("abort", cancel, { once: true });
    if (request.signal?.aborted) controller.abort();
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, options.timeoutMs ?? 15_000);
    try {
      const multipart = typeof FormData !== "undefined" && request.body instanceof FormData;
      const response = await (options.fetch ?? fetch)(url.toString(), {
        method: request.method ?? "GET", signal: controller.signal, credentials: "omit",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(request.body !== undefined && !multipart ? { "Content-Type": "application/json" } : {})
        },
        ...(request.body !== undefined ? { body: multipart ? request.body as FormData : JSON.stringify(request.body) } : {})
      });
      // A late response from a previous account must not sign out the current account.
      if (response.status === 401 && token && token === await options.getToken()) await options.onUnauthorized();
      let envelope: unknown;
      try { envelope = await response.json(); }
      catch { throw new ApiError(response.ok ? "Unexpected server response" : "Request failed", response.status, "protocol"); }
      const record = typeof envelope === "object" && envelope !== null ? envelope as Record<string, unknown> : null;
      if (response.status === 403 && record?.message === "Employee account is frozen" && token && token === await options.getToken()) {
        await options.onUnauthorized();
      }
      if (!response.ok || record?.success === false) {
        const message = typeof record?.message === "string" && record.message.length <= 300 && response.status < 500
          ? record.message : "Request failed. Please try again.";
        throw new ApiError(message, response.status);
      }
      if (record?.success !== true) throw new ApiError("Unexpected server response", response.status, "protocol");
      if (record.pagination !== undefined) {
        const pagination = record.pagination as Record<string, unknown> | null;
        if (!pagination || ["total", "page", "pageSize", "pageCount"].some(key =>
          typeof pagination[key] !== "number" || !Number.isSafeInteger(pagination[key]) || Number(pagination[key]) < (key === "page" || key === "pageSize" ? 1 : 0))) {
          throw new ApiError("Unexpected pagination response", response.status, "protocol");
        }
      }
      return envelope as ApiResponse<T>;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (controller.signal.aborted) throw new ApiError(timedOut ? "Request timed out" : "Request cancelled", 0, timedOut ? "timeout" : "cancelled");
      throw new ApiError("Cannot reach the server. Check your connection.", 0, "network");
    } finally {
      clearTimeout(timer);
      request.signal?.removeEventListener("abort", cancel);
    }
  }
});
