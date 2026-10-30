import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { mockUsers, type AppUser, type Role } from "./mockData";

type AuthState = {
  user: AppUser | null;
  ready: boolean;
  login: (role?: Role) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);
const KEY = "dental-demo-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const stored = JSON.parse(raw) as { id?: number };
        const current = mockUsers.find((m) => m.id === stored.id && m.is_active);
        if (current) {
          setUser(current);
          sessionStorage.setItem(KEY, JSON.stringify(current));
        }
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const login = (role: Role = "admin") => {
    const u = mockUsers.find((m) => m.role === role && m.is_active);
    if (!u) return;
    sessionStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
  };
  const logout = () => {
    sessionStorage.removeItem(KEY);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
