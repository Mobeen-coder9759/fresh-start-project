import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi, isTokenExpired, tokenStore, userStore, type User } from "./api";

export type SessionUser = User;

type AuthState = {
  user: SessionUser | null;
  ready: boolean;
  login: (username: string, password: string, remember?: boolean) => Promise<SessionUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = tokenStore.get();
    const stored = userStore.get();
    if (token && stored && !isTokenExpired(token)) setUser(stored);
    else tokenStore.clear();
    setReady(true);

    const onLogout = () => {
      queryClient.clear();
      setUser(null);
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [queryClient]);

  const login = async (username: string, password: string, remember = false) => {
    const u = await authApi.login(username, password, remember);
    queryClient.clear();
    setUser(u);
    return u;
  };
  const logout = () => authApi.logout();

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
