import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  analyticsApi,
  appointmentsApi,
  authApi,
  errorText,
  isTokenExpired,
  patientsApi,
  settingsApi,
  tokenStore,
  userStore,
  usersApi,
} from "@/lib/api";

const BASE = "https://dental-dashboard-backend-95c6b9002d28.herokuapp.com";
const user = { id: 1, clinic_id: 2, role: "admin", username: "admin.a", name: "Admin A" } as const;

function jwt(payload: object) {
  const enc = (o: object) =>
    btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${enc({ alg: "HS256" })}.${enc(payload)}.sig`;
}

function reply(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

let fetchMock: ReturnType<typeof vi.fn>;
const lastCall = () => {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return { url, init, headers: init.headers as Record<string, string> };
};

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("session storage", () => {
  it("keeps the session in sessionStorage unless 'remember me' is ticked", async () => {
    fetchMock.mockResolvedValueOnce(reply({ token: "t1", user }));
    await authApi.login("admin.a", "pw");
    expect(sessionStorage.getItem("fs_token")).toBe("t1");
    expect(localStorage.getItem("fs_token")).toBeNull();
    expect(userStore.get()).toEqual(user);

    fetchMock.mockResolvedValueOnce(reply({ token: "t2", user }));
    await authApi.login("admin.a", "pw", true);
    expect(localStorage.getItem("fs_token")).toBe("t2");
    expect(sessionStorage.getItem("fs_token")).toBeNull();
  });

  it("login sends credentials without a bearer token and as JSON", async () => {
    tokenStore.set("stale");
    fetchMock.mockResolvedValueOnce(reply({ token: "t", user }));
    await authApi.login("admin.a", "pw");
    const { url, init, headers } = lastCall();
    expect(url).toBe(`${BASE}/auth/login`);
    expect(init.method).toBe("POST");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["Authorization"]).toBeUndefined();
    expect(JSON.parse(init.body as string)).toEqual({ username: "admin.a", password: "pw" });
  });

  it("refresh() updates the stored user in the storage that already holds it", () => {
    tokenStore.set("t", true);
    userStore.set(user, true);
    userStore.refresh({ ...user, role: "staff" });
    expect(JSON.parse(localStorage.getItem("fs_user") ?? "{}").role).toBe("staff");
    expect(sessionStorage.getItem("fs_user")).toBeNull();
  });

  it("logout clears the token and tells the app", () => {
    tokenStore.set("t");
    const heard = vi.fn();
    window.addEventListener("auth:logout", heard);
    authApi.logout();
    window.removeEventListener("auth:logout", heard);
    expect(tokenStore.get()).toBeNull();
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it("detects expired and malformed tokens", () => {
    const soon = Math.floor(Date.now() / 1000) + 3600;
    expect(isTokenExpired(jwt({ exp: soon }))).toBe(false);
    expect(isTokenExpired(jwt({ exp: Math.floor(Date.now() / 1000) - 5 }))).toBe(true);
    expect(isTokenExpired(jwt({}))).toBe(true);
    expect(isTokenExpired("garbage")).toBe(true);
  });
});

describe("request handling", () => {
  it("sends the bearer token and no Content-Type on GET", async () => {
    tokenStore.set("abc");
    fetchMock.mockResolvedValueOnce(reply({ data: [] }));
    await appointmentsApi.list();
    const { url, headers, init } = lastCall();
    expect(url).toBe(`${BASE}/appointments`);
    expect(headers["Authorization"]).toBe("Bearer abc");
    expect(headers["Content-Type"]).toBeUndefined();
    expect(init.body).toBeUndefined();
  });

  it("on 401 clears the session and emits auth:logout", async () => {
    tokenStore.set("expired");
    const heard = vi.fn();
    window.addEventListener("auth:logout", heard);
    fetchMock.mockResolvedValueOnce(reply({ error: "Unauthorized" }, { status: 401 }));
    await expect(appointmentsApi.list()).rejects.toMatchObject({
      status: 401,
      message: "Unauthorized",
    });
    window.removeEventListener("auth:logout", heard);
    expect(tokenStore.get()).toBeNull();
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it("a wrong password (401 on login) does not log anyone out", async () => {
    tokenStore.set("still-valid");
    const heard = vi.fn();
    window.addEventListener("auth:logout", heard);
    fetchMock.mockResolvedValueOnce(
      reply({ error: "Invalid username or password" }, { status: 401 }),
    );
    await expect(authApi.login("a", "b")).rejects.toBeInstanceOf(ApiError);
    window.removeEventListener("auth:logout", heard);
    expect(tokenStore.get()).toBe("still-valid");
    expect(heard).not.toHaveBeenCalled();
  });

  it("surfaces validation details and Retry-After", async () => {
    fetchMock.mockResolvedValueOnce(
      reply(
        {
          error: "Validation failed",
          details: [{ field: "phone", message: "Invalid phone number" }],
        },
        { status: 400 },
      ),
    );
    const err = await appointmentsApi
      .create({ name: "x", booking_time: "2031-01-01T00:00:00Z" })
      .catch((e) => e);
    expect(err.details).toEqual([{ field: "phone", message: "Invalid phone number" }]);
    expect(errorText(err)).toBe("Invalid phone number");

    fetchMock.mockResolvedValueOnce(
      reply({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "42" } }),
    );
    const limited = await authApi.login("a", "b").catch((e) => e);
    expect(limited.retryAfter).toBe(42);
    expect(errorText(limited)).toBe("Too many requests. Try again in 42 seconds.");
  });

  it("turns a network failure into ApiError(0) with a friendly message", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const err = await analyticsApi.get().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
    expect(err.message).toMatch(/Can't reach the server/);
  });

  it("handles non-JSON error bodies", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("<html>Bad gateway</html>", { status: 502, statusText: "Bad Gateway" }),
    );
    await expect(appointmentsApi.list()).rejects.toMatchObject({
      status: 502,
      message: "Bad Gateway",
    });
    expect(errorText(new Error("boom"))).toBe("Something went wrong. Please try again.");
  });
});

describe("endpoints", () => {
  beforeEach(() => tokenStore.set("tok"));

  it("builds query strings and skips empty values", async () => {
    fetchMock.mockImplementation(() => Promise.resolve(reply({ data: [] })));
    await appointmentsApi.list({ date: "2031-01-02", search: "", reason: undefined, limit: 5 });
    expect(lastCall().url).toBe(`${BASE}/appointments?date=2031-01-02&limit=5`);
    await patientsApi.list({ sort: "desc", search: "o'brien" });
    expect(lastCall().url).toBe(`${BASE}/patients?sort=desc&search=o%27brien`);
    await patientsApi.remove("Ann Lee", null);
    expect(lastCall().url).toBe(`${BASE}/patients?name=Ann+Lee`);
    expect(lastCall().init.method).toBe("DELETE");
  });

  it("listAll pages 1000 at a time until a short page", async () => {
    const row = (id: number) => ({ id });
    fetchMock
      .mockResolvedValueOnce(reply({ data: Array.from({ length: 1000 }, (_, i) => row(i)) }))
      .mockResolvedValueOnce(reply({ data: [row(1000), row(1001)] }));
    const all = await appointmentsApi.listAll();
    expect(all).toHaveLength(1002);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]![0]).toBe(`${BASE}/appointments?limit=1000&offset=0`);
    expect(fetchMock.mock.calls[1]![0]).toBe(`${BASE}/appointments?limit=1000&offset=1000`);
  });

  it("appointment create / update / cancel / remove use the right verbs and bodies", async () => {
    fetchMock.mockImplementation(() => Promise.resolve(reply({ data: { id: 7 }, ok: true })));
    await appointmentsApi.create({ name: "A", booking_time: "2031-01-01T00:00:00Z" });
    expect(lastCall().init.method).toBe("POST");
    await appointmentsApi.update(7, { reason: "Crown" });
    expect(lastCall().url).toBe(`${BASE}/appointments/7`);
    expect(lastCall().init.method).toBe("PATCH");
    expect(JSON.parse(lastCall().init.body as string)).toEqual({ reason: "Crown" });
    await appointmentsApi.cancel(7);
    expect(Object.keys(JSON.parse(lastCall().init.body as string))).toEqual(["cancel_time"]);
    await appointmentsApi.remove(7);
    expect(lastCall().init.method).toBe("DELETE");
  });

  it("users and settings endpoints unwrap their payloads", async () => {
    fetchMock.mockResolvedValueOnce(
      reply({ data: [{ ...user, is_active: true, created_at: "x" }] }),
    );
    expect(await usersApi.list()).toHaveLength(1);
    expect(lastCall().url).toBe(`${BASE}/auth/users`);

    fetchMock.mockResolvedValueOnce(
      reply({ user: { ...user, is_active: false, created_at: "x" } }),
    );
    expect((await usersApi.update(3, { is_active: false })).is_active).toBe(false);
    expect(lastCall().url).toBe(`${BASE}/auth/users/3`);
    expect(lastCall().init.method).toBe("PATCH");

    fetchMock.mockResolvedValueOnce(
      reply({ user: { ...user, is_active: true, created_at: "x" } }, { status: 201 }),
    );
    await usersApi.create({
      username: "n.u",
      password: "long-password-1",
      name: "N",
      role: "staff",
    });
    expect(lastCall().init.method).toBe("POST");

    const dto = { appointment_value: 1, hourly_cost: 2, minutes_per_booking: 3, timezone: "UTC" };
    fetchMock.mockResolvedValueOnce(reply({ data: dto }));
    expect(await settingsApi.get()).toEqual(dto);
    fetchMock.mockResolvedValueOnce(reply({ data: dto }));
    expect(await settingsApi.update({ timezone: "UTC" })).toEqual(dto);
    expect(lastCall().init.method).toBe("PUT");

    fetchMock.mockResolvedValueOnce(reply({ user }));
    expect(await authApi.me()).toEqual(user);
  });
});
