import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, tokenStore, userStore, isTokenExpired, type User } from "./api";
import { mockUsers, type Role } from "./mockData";

type AuthState = {
  user: User | null;
  ready: boolean;
  login: (usernameOrRole?: string, password?: string, remember?: boolean) => Promise<User | void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);
const DEMO_KEY = "dental-demo-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = tokenStore.get();
    const stored = userStore.get();

    if (token && !isTokenExpired(token) && stored) {
      setUser(stored);
      authApi.me().then((fresh) => {
        setUser(fresh);
        userStore.refresh(fresh);
      }).catch(() => {
        /* token rejected or expired on server; handled by auth:logout */
      });
    } else {
      // Check legacy/demo session fallback
      try {
        const raw = sessionStorage.getItem(DEMO_KEY);
        if (raw) {
          const s = JSON.parse(raw) as { id?: number };
          const m = mockUsers.find((u) => u.id === s.id && u.is_active);
          if (m) {
            setUser({ id: m.id, clinic_id: 1, role: m.role, username: m.username, name: m.name });
          }
        }
      } catch {
        /* ignore */
      }
    }
    setReady(true);

    const onLogout = () => {
      sessionStorage.removeItem(DEMO_KEY);
      setUser(null);
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  const login = async (usernameOrRole: string = "admin", password?: string, remember = false): Promise<User | void> => {
    // If password provided, perform real API login against the backend
    if (password) {
      const u = await authApi.login(usernameOrRole, password, remember);
      setUser(u);
      return u;
    }

    // Role switcher / demo fallback
    const m = mockUsers.find((u) => u.role === (usernameOrRole as Role) && u.is_active);
    if (!m) return;
    const demoUser: User = { id: m.id, clinic_id: 1, role: m.role, username: m.username, name: m.name };
    sessionStorage.setItem(DEMO_KEY, JSON.stringify(m));
    userStore.set(demoUser, remember);
    setUser(demoUser);
    return demoUser;
  };

  const logout = () => {
    sessionStorage.removeItem(DEMO_KEY);
    authApi.logout();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

