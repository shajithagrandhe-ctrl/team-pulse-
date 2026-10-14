import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authApi, type User } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, adminCode?: string) => Promise<User>;
  register: (payload: {
    email: string;
    password: string;
    displayName: string;
    fullName: string;
    role: "EMPLOYEE";
    department?: string;
    position?: string;
    employeeId?: string;
    phoneNumber?: string;
    address?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  clearSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LOCAL_STORAGE_KEY = "estatehub_user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    try {
      return cached ? (JSON.parse(cached) as User) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncUser = async () => {
      try {
        const response = await authApi.me();
        setUser(response.data.user);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(response.data.user));
      } catch {
        await queryClient.cancelQueries();
        queryClient.clear();
        setUser(null);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, [queryClient]);

  const login = async (email: string, password: string, adminCode?: string) => {
    const response = await authApi.login(email, password, adminCode);
    await queryClient.cancelQueries();
    queryClient.clear();
    setUser(response.data.user);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(response.data.user));
    return response.data.user;
  };

  const register = async (payload: AuthContextValue["register"] extends (arg: infer P) => Promise<User> ? P : never) => {
    const response = await authApi.register(payload);
    return response.data.user;
  };

  const clearSession = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const logout = async () => {
    await authApi.logout();
    await clearSession();
  };

  const value = useMemo(() => ({ user, loading, login, register, logout, clearSession }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
