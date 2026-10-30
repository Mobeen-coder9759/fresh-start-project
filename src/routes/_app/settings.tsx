import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RequirePage } from "@/components/dental/common";
import { useClinic } from "@/lib/settings";
import type { Role } from "@/lib/mockData";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Dental Desk" },
      { name: "description", content: "Manage team members and clinic savings settings." },
      { property: "og:title", content: "Settings — Dental Desk" },
      { property: "og:description", content: "Manage team members and clinic savings settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequirePage page="settings">
      <SettingsPage />
    </RequirePage>
  ),
});

const ROLES: Role[] = ["admin", "staff", "hr"];
const ZONES = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Asia/Karachi", "Asia/Dubai", "Australia/Sydney"];

function SettingsPage() {
  const { users, setUsers, settings, setSettings } = useClinic();
  const [form, setForm] = useState({ name: "", username: "", role: "staff" as Role });

  const addUser = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.username.trim()) return;
    setUsers([...users, { id: Math.max(0, ...users.map((u) => u.id)) + 1, name: form.name.trim(), username: form.username.trim(), role: form.role, is_active: true, password_hash: "$2b$10$mockhashnew", created_at: new Date().toISOString() }]);
    setForm({ name: "", username: "", role: "staff" });
  };
  const patch = (id: number, p: Partial<(typeof users)[number]>) => setUsers(users.map((u) => (u.id === id ? { ...u, ...p } : u)));
  const num = (k: "appointmentValue" | "hourlyCost" | "minutesPerBooking") => ({
    value: settings[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, [k]: Math.max(0, Number(e.target.value) || 0) }),
  });

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <section className="dn-card p-5 xl:col-span-3">
        <h2 className="font-semibold">User management</h2>
        <ul className="mt-4 divide-y divide-dn-line">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-40 flex-1">
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-dn-ink-muted">@{u.username}</p>
              </div>
              <Select value={u.role} onValueChange={(v) => patch(u.id, { role: v as Role })}>
                <SelectTrigger className="dn-input h-9 w-28 capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-xs text-dn-ink-muted">
                <Switch checked={u.is_active} onCheckedChange={(c) => patch(u.id, { is_active: c })} className="data-[state=checked]:bg-dn-accent" />
                {u.is_active ? "Active" : "Inactive"}
              </label>
            </li>
          ))}
        </ul>
        <form onSubmit={addUser} className="mt-4 flex flex-wrap gap-3 border-t border-dn-line pt-4">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="dn-input h-10 flex-1 px-3 text-sm" />
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username" className="dn-input h-10 flex-1 px-3 text-sm" />
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
            <SelectTrigger className="dn-input h-10 w-28 capitalize"><SelectValue /></SelectTrigger>
            <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
          </Select>
          <button className="h-10 rounded-2xl bg-dn-accent px-4 text-sm font-medium text-dn-accent-foreground">Add user</button>
        </form>
      </section>

      <section className="dn-card p-5 xl:col-span-2">
        <h2 className="font-semibold">Clinic settings</h2>
        <div className="mt-4 space-y-4">
          <Field label="Average appointment value ($)"><input type="number" {...num("appointmentValue")} className="dn-input h-10 w-full px-3 text-sm" /></Field>
          <Field label="Receptionist hourly cost ($)"><input type="number" {...num("hourlyCost")} className="dn-input h-10 w-full px-3 text-sm" /></Field>
          <Field label="Minutes a person spends per booking"><input type="number" {...num("minutesPerBooking")} className="dn-input h-10 w-full px-3 text-sm" /></Field>
          <Field label="Clinic timezone">
            <Select value={settings.timezone} onValueChange={(v) => setSettings({ ...settings, timezone: v })}>
              <SelectTrigger className="dn-input h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="rounded-2xl bg-dn-bg/60 p-3 text-xs text-dn-ink-muted">
            <p><span className="font-semibold text-dn-ink">Time saved</span> = bookings × minutes per booking</p>
            <p className="mt-1"><span className="font-semibold text-dn-ink">Money saved</span> = time saved (hours) × hourly cost</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5 text-sm text-dn-ink-muted"><span>{label}</span>{children}</label>;
}
