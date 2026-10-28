// API base URL. Override with VITE_API_BASE_URL if the backend ever moves. (No trailing slash.)
const BASE = (
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ??
  "https://dental-dashboard-backend-95c6b9002d28.herokuapp.com"
).replace(/\/+$/, "");

// ---- Session storage ----
// Session-only by default (cleared when the tab closes). "Remember me" persists across restarts.
// Storage is only touched inside functions, so importing this module is safe during SSR.
const TOKEN_KEY = "fs_token";
const USER_KEY = "fs_user";

function read(key: string): string | null {
  for (const s of [sessionStorage, localStorage]) {
    try {
      const v = s.getItem(key);
      if (v) return v;
    } catch { /* storage unavailable (SSR / privacy mode) */ }
  }
  return null;
}

export const tokenStore = {
  get: () => read(TOKEN_KEY),
  set(token: string, remember = false) {
    tokenStore.clear();
    try { (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token); } catch { /* ignore */ }
  },
  clear() {
    for (const s of [sessionStorage, localStorage]) {
      try { s.removeItem(TOKEN_KEY); s.removeItem(USER_KEY); } catch { /* ignore */ }
    }
  },
};

export const userStore = {
  get(): User | null {
    try {
      const raw = read(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch { return null; }
  },
  set(u: User, remember = false) {
    try { (remember ? localStorage : sessionStorage).setItem(USER_KEY, JSON.stringify(u)); } catch { /* ignore */ }
  },
};

/** UI-only check so an expired token is treated as signed out on page load. The server still verifies everything. */
export function isTokenExpired(token: string): boolean {
  try {
    const part = token.split(".")[1] ?? "";
    const payload = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now();
  } catch { return true; }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: { field: string; message: string }[],
    public retryAfter?: number, // seconds, set on 429
  ) { super(message); }
}

async function request<T>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (opts.auth !== false && token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    const init: RequestInit = { method: opts.method ?? "GET", headers };
    if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
    res = await fetch(`${BASE}${path}`, init);
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && opts.auth !== false) {
      tokenStore.clear();
      window.dispatchEvent(new Event("auth:logout"));
    }
    throw new ApiError(
      res.status,
      data?.error ?? res.statusText,
      data?.details,
      Number(res.headers.get("Retry-After")) || undefined,
    );
  }
  return data as T;
}

const qs = (p: Record<string, string | number | undefined | null>) => {
  const q = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => v != null && v !== "" && q.set(k, String(v)));
  const s = q.toString();
  return s ? `?${s}` : "";
};

// ---- Types ----
export type User = { id: number; clinic_id: number; role: "admin" | "staff" | "hr"; username: string; name: string };
export type Appointment = {
  id: number; name: string; phone: string | null; email: string | null; dob: string | null;
  insurance: string | null; reason: string | null; booking_type: string | null;
  booking_time: string | null; old_time: string | null; cancel_time: string | null;
  created_at: string; updated_at: string; status: "scheduled" | "cancelled";
};
export type AppointmentInput = { name: string; booking_time: string } &
  Partial<Pick<Appointment, "phone" | "email" | "dob" | "insurance" | "reason" | "booking_type" | "old_time" | "cancel_time">>;
export type PatientRow = {
  name: string; phone: string | null; email: string | null; dob: string | null;
  insurance: string | null; total_appointments: number; last_appointment: string | null;
};
export type Analytics = {
  reasons: { reason: string; count: number }[];
  bookings: { date: string; count: number }[];
};

// ---- Auth ----
export const authApi = {
  async login(username: string, password: string, remember = false) {
    const r = await request<{ token: string; user: User }>("/auth/login", { method: "POST", body: { username, password }, auth: false });
    tokenStore.set(r.token, remember);
    userStore.set(r.user, remember);
    return r.user;
  },
  async register(p: { username: string; password: string; name: string; clinic_name: string; registration_key?: string }, remember = false) {
    const r = await request<{ token: string; user: User }>("/auth/register", { method: "POST", body: p, auth: false });
    tokenStore.set(r.token, remember);
    userStore.set(r.user, remember);
    return r.user;
  },
  addUser: (p: { username: string; password: string; name: string; role: User["role"] }) =>
    request<{ user: User }>("/auth/users", { method: "POST", body: p }),
  setUserActive: (id: number, is_active: boolean) =>
    request<{ user: User }>(`/auth/users/${id}`, { method: "PATCH", body: { is_active } }),
  logout() { tokenStore.clear(); window.dispatchEvent(new Event("auth:logout")); },
};

// ---- Appointments ----
export const appointmentsApi = {
  list: (f: { date?: string; reason?: string; search?: string; limit?: number; offset?: number } = {}) =>
    request<{ data: Appointment[] }>(`/appointments${qs(f)}`).then((r) => r.data),
  /** Fetches every appointment for the signed-in clinic, paging 1000 at a time (max 10 pages). */
  async listAll(): Promise<Appointment[]> {
    const PAGE = 1000;
    const out: Appointment[] = [];
    for (let offset = 0; offset < 10 * PAGE; offset += PAGE) {
      const page = await request<{ data: Appointment[] }>(`/appointments${qs({ limit: PAGE, offset })}`).then((r) => r.data);
      out.push(...page);
      if (page.length < PAGE) break;
    }
    return out;
  },
  create: (b: AppointmentInput) =>
    request<{ data: Appointment }>("/appointments", { method: "POST", body: b }).then((r) => r.data),
  update: (id: number, b: Partial<AppointmentInput>) =>
    request<{ data: Appointment }>(`/appointments/${id}`, { method: "PATCH", body: b }).then((r) => r.data),
  cancel: (id: number) =>
    request<{ data: Appointment }>(`/appointments/${id}`, { method: "PATCH", body: { cancel_time: new Date().toISOString() } }).then((r) => r.data),
  remove: (id: number) => request<{ ok: true }>(`/appointments/${id}`, { method: "DELETE" }),
};

// ---- Patients ----
export const patientsApi = {
  list: (f: { sort?: "asc" | "desc"; search?: string; limit?: number; offset?: number } = {}) =>
    request<{ data: PatientRow[] }>(`/patients${qs(f)}`).then((r) => r.data),
  update: (p: { name: string; phone: string | null; new_name?: string; new_phone?: string | null; email?: string | null; dob?: string | null; insurance?: string | null }) =>
    request<{ updated: number }>("/patients", { method: "PATCH", body: p }),
  remove: (name: string, phone: string | null) =>
    request<{ deleted: number }>(`/patients${qs({ name, phone })}`, { method: "DELETE" }),
};

// ---- Analytics ----
export const analyticsApi = {
  get: (days = 30) => request<Analytics>(`/analytics${qs({ days })}`),
};
