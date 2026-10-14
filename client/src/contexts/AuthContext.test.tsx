import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./AuthContext";
import { authApi, type User } from "@/services/api";

vi.mock("@/services/api", () => ({ authApi: { me: vi.fn(), login: vi.fn(), logout: vi.fn() } }));
const employee: User = { id: "fixture", email: "fixture@example.test", role: "EMPLOYEE", displayName: "Fixture", fullName: "Fixture" };

const Probe = () => {
  const auth = useAuth();
  return <>
    <span>{auth.loading ? "Loading" : auth.user?.role ?? "Signed out"}</span>
    <button onClick={() => void auth.login("fixture@example.test", "fixture-password")}>Login</button>
    <button onClick={() => void auth.logout()}>Logout</button>
    <button onClick={() => void auth.clearSession()}>Clear Revoked Session</button>
  </>;
};

const mount = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}><AuthProvider><Probe /></AuthProvider></QueryClientProvider>);
  return queryClient;
};

beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
  vi.mocked(authApi.me).mockResolvedValue({ success: true, data: { user: employee }, message: "OK" });
  vi.mocked(authApi.logout).mockResolvedValue({ success: true, data: null, message: "OK" });
});
afterEach(cleanup);

describe("session query isolation", () => {
  it("clears a password-revoked session without requiring another network request", async () => {
    const queryClient = mount();
    await screen.findByText("EMPLOYEE");
    queryClient.setQueryData(["private"], "previous-data");
    fireEvent.click(screen.getByRole("button", { name: "Clear Revoked Session" }));
    await screen.findByText("Signed out");
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(localStorage.getItem("estatehub_user")).toBeNull();
    expect(authApi.logout).not.toHaveBeenCalled();
  });
  it("clears previous-user query data when logging into another account", async () => {
    const queryClient = mount();
    await screen.findByText("EMPLOYEE");
    queryClient.setQueryData(["customer-records"], [{ id: "previous-owner" }]);
    vi.mocked(authApi.login).mockResolvedValue({ success: true, data: { user: { ...employee, role: "CUSTOMER" } }, message: "OK" });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    await screen.findByText("CUSTOMER");
    expect(queryClient.getQueryData(["customer-records"])).toBeUndefined();
  });

  it("clears queries and cached identity on logout", async () => {
    const queryClient = mount();
    await screen.findByText("EMPLOYEE");
    queryClient.setQueryData(["leads"], [{ id: "private" }]);
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    await screen.findByText("Signed out");
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(localStorage.getItem("estatehub_user")).toBeNull();
  });

  it("recovers from malformed cached identity and an expired session", async () => {
    localStorage.setItem("estatehub_user", "invalid-json");
    vi.mocked(authApi.me).mockRejectedValue(new Error("Session expired"));
    mount();
    await waitFor(() => expect(screen.getByText("Signed out")).toBeInTheDocument());
    expect(localStorage.getItem("estatehub_user")).toBeNull();
  });
});
