import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/lib/auth";
import { SettingsProvider } from "@/lib/settings";
import { Route } from "@/routes/_app/settings";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  Navigate: () => null,
}));

const me = { id: 1, clinic_id: 1, role: "admin", username: "admin.a", name: "Admin A" };
type U = typeof me & { is_active: boolean; created_at: string };
let users: U[];
let settings: Record<string, unknown>;
let calls: { method: string; path: string; body: unknown }[];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function fakeServer(input: string, init: RequestInit = {}) {
  const path = input.replace(/^https?:\/\/[^/]+/, "");
  const method = init.method ?? "GET";
  const body = init.body ? JSON.parse(init.body as string) : undefined;
  calls.push({ method, path, body });
  if (path === "/auth/me") return json({ user: me });
  if (path === "/settings" && method === "GET") return json({ data: settings });
  if (path === "/settings" && method === "PUT") {
    settings = { ...settings, ...body };
    return json({ data: settings });
  }
  if (path === "/auth/users" && method === "GET") return json({ data: users });
  if (path === "/auth/users" && method === "POST") {
    const u = {
      id: 9,
      clinic_id: 1,
      role: body.role,
      username: body.username,
      name: body.name,
      is_active: true,
      created_at: "now",
    };
    users = [...users, u];
    return json({ user: u }, 201);
  }
  const patch = /^\/auth\/users\/(\d+)$/.exec(path);
  if (patch && method === "PATCH") {
    users = users.map((u) => (u.id === Number(patch[1]) ? { ...u, ...body } : u));
    return json({ user: users.find((u) => u.id === Number(patch[1])) });
  }
  return json({ error: "Not found" }, 404);
}

function token() {
  const enc = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "");
  return `${enc({ alg: "HS256" })}.${enc({ exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
}

function renderPage() {
  const Page = (Route as unknown as { component: () => ReactElement }).component;
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AuthProvider>
        <SettingsProvider>
          <Page />
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  calls = [];
  users = [
    { ...me, is_active: true, created_at: "2026-01-01" },
    {
      id: 2,
      clinic_id: 1,
      role: "staff",
      username: "staff.a",
      name: "Staff A",
      is_active: true,
      created_at: "2026-01-02",
    },
  ];
  settings = {
    appointment_value: 180,
    hourly_cost: 22,
    minutes_per_booking: 6,
    timezone: "Asia/Karachi",
  };
  sessionStorage.setItem("fs_token", token());
  sessionStorage.setItem("fs_user", JSON.stringify(me));
  vi.stubGlobal(
    "fetch",
    vi.fn((input: string, init?: RequestInit) => Promise.resolve(fakeServer(input, init))),
  );
});
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe("Settings page (real API, no mock data)", () => {
  it("lists the clinic's users from the server and protects the signed-in admin", async () => {
    renderPage();
    expect(await screen.findByText("Staff A")).toBeInTheDocument();
    expect(screen.getByText("(you)")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Admin A active" })).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Staff A active" })).toBeEnabled();
    expect(calls.some((c) => c.path === "/auth/users" && c.method === "GET")).toBe(true);
  });

  it("deactivates another user through PATCH /auth/users/:id", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("switch", { name: "Staff A active" }));
    await waitFor(() => expect(calls.find((c) => c.method === "PATCH")).toBeDefined());
    expect(calls.find((c) => c.method === "PATCH")).toMatchObject({
      path: "/auth/users/2",
      body: { is_active: false },
    });
    await waitFor(() =>
      expect(screen.getByRole("switch", { name: "Staff A active" })).toHaveAttribute(
        "aria-checked",
        "false",
      ),
    );
  });

  it("adds a user with a password and shows them in the list", async () => {
    renderPage();
    await screen.findByText("Staff A");
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "New Hire" } });
    fireEvent.change(screen.getByLabelText("New username"), { target: { value: "new.hire" } });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "long-password-123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add user" }));
    expect(await screen.findByText("New Hire")).toBeInTheDocument();
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({
      name: "New Hire",
      username: "new.hire",
      password: "long-password-123",
      role: "staff",
    });
    expect(screen.getByLabelText("New password")).toHaveValue("");
  });

  it("loads clinic settings from the server and saves changes with PUT /settings", async () => {
    renderPage();
    const hourly = await screen.findByLabelText("Receptionist hourly cost ($)");
    await waitFor(() => expect(hourly).toHaveValue(22));
    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();
    fireEvent.change(hourly, { target: { value: "35" } });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await waitFor(() => expect(calls.find((c) => c.method === "PUT")).toBeDefined());
    expect(calls.find((c) => c.method === "PUT")?.body).toEqual({
      appointment_value: 180,
      hourly_cost: 35,
      minutes_per_booking: 6,
      timezone: "Asia/Karachi",
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled(),
    );
    expect(within(document.body).getByLabelText("Receptionist hourly cost ($)")).toHaveValue(35);
  });
});
