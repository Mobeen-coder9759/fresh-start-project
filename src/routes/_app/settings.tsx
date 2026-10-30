import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, RequirePage } from "@/components/dental/common";
import { errorText, usersApi, type ManagedUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useClinic } from "@/lib/settings";
import type { ClinicSettings } from "@/lib/appointments";
import type { Role } from "@/lib/types";

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
const ZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Asia/Karachi",
  "Asia/Dubai",
  "Australia/Sydney",
];

function SettingsPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <UserManagement />
      <ClinicSettingsCard />
    </div>
  );
}

function UserManagement() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const key = ["users", me?.clinic_id] as const;
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "staff" as Role });

  const users = useQuery({ queryKey: key, queryFn: usersApi.list, enabled: !!me });
  const refresh = () => queryClient.invalidateQueries({ queryKey: key });

  const create = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      toast.success("User added");
      setForm({ name: "", username: "", password: "", role: "staff" });
      return refresh();
    },
    onError: (e) => toast.error(errorText(e)),
  });
  const update = useMutation({
    mutationFn: (v: { id: number; patch: { role?: Role; is_active?: boolean } }) =>
      usersApi.update(v.id, v.patch),
    onSuccess: refresh,
    onError: (e) => {
      toast.error(errorText(e));
      return refresh();
    },
  });

  const addUser = (e: FormEvent) => {
    e.preventDefault();
    if (create.isPending) return;
    create.mutate({
      name: form.name.trim(),
      username: form.username.trim(),
      password: form.password,
      role: form.role,
    });
  };

  const list: ManagedUser[] = users.data ?? [];
  return (
    <section className="dn-card p-5 xl:col-span-3">
      <h2 className="font-semibold">User management</h2>
      {users.isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full bg-dn-ink/10" />
          ))}
        </div>
      ) : users.isError ? (
        <EmptyState title="Couldn't load users" hint={errorText(users.error)} />
      ) : (
        <ul className="mt-4 divide-y divide-dn-line">
          {list.map((u) => {
            const isMe = u.id === me?.id;
            return (
              <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-40 flex-1">
                  <p className="text-sm font-medium">
                    {u.name}
                    {isMe && <span className="ml-2 text-xs text-dn-ink-muted">(you)</span>}
                  </p>
                  <p className="text-xs text-dn-ink-muted">@{u.username}</p>
                </div>
                <Select
                  value={u.role}
                  disabled={isMe || update.isPending}
                  onValueChange={(v) => update.mutate({ id: u.id, patch: { role: v as Role } })}
                >
                  <SelectTrigger
                    aria-label={`Role for ${u.name}`}
                    className="dn-input h-9 w-28 capitalize"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="capitalize">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-xs text-dn-ink-muted">
                  <Switch
                    aria-label={`${u.name} active`}
                    checked={u.is_active}
                    disabled={isMe || update.isPending}
                    onCheckedChange={(c) => update.mutate({ id: u.id, patch: { is_active: c } })}
                    className="data-[state=checked]:bg-dn-accent"
                  />
                  {u.is_active ? "Active" : "Inactive"}
                </label>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={addUser} className="mt-4 flex flex-wrap gap-3 border-t border-dn-line pt-4">
        <input
          required
          maxLength={100}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Full name"
          aria-label="Full name"
          className="dn-input h-10 min-w-40 flex-1 px-3 text-sm"
        />
        <input
          required
          minLength={3}
          maxLength={50}
          autoComplete="off"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="Username"
          aria-label="New username"
          className="dn-input h-10 min-w-40 flex-1 px-3 text-sm"
        />
        <input
          required
          type="password"
          minLength={10}
          maxLength={72}
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Password (10+ characters)"
          aria-label="New password"
          className="dn-input h-10 min-w-48 flex-1 px-3 text-sm"
        />
        <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
          <SelectTrigger aria-label="New user role" className="dn-input h-10 w-28 capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r} className="capitalize">
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          disabled={create.isPending}
          className="h-10 rounded-2xl bg-dn-accent px-4 text-sm font-medium text-dn-accent-foreground disabled:opacity-60"
        >
          {create.isPending ? "Adding…" : "Add user"}
        </button>
      </form>
    </section>
  );
}

function ClinicSettingsCard() {
  const { settings, loading, saving, saveSettings } = useClinic();
  const [draft, setDraft] = useState<ClinicSettings>(settings);
  const [touched, setTouched] = useState(false);

  // Follow the server until the admin starts editing.
  useEffect(() => {
    if (!touched) setDraft(settings);
  }, [settings, touched]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  const num = (k: "appointmentValue" | "hourlyCost" | "minutesPerBooking") => ({
    value: draft[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setTouched(true);
      setDraft({ ...draft, [k]: Math.max(0, Number(e.target.value) || 0) });
    },
  });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await saveSettings(draft);
      setTouched(false);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(errorText(err));
    }
  };

  return (
    <section className="dn-card p-5 xl:col-span-2">
      <h2 className="font-semibold">Clinic settings</h2>
      <form onSubmit={save} className="mt-4 space-y-4">
        <Field label="Average appointment value ($)">
          <input
            type="number"
            min={0}
            step="any"
            disabled={loading}
            {...num("appointmentValue")}
            className="dn-input h-10 w-full px-3 text-sm"
          />
        </Field>
        <Field label="Receptionist hourly cost ($)">
          <input
            type="number"
            min={0}
            step="any"
            disabled={loading}
            {...num("hourlyCost")}
            className="dn-input h-10 w-full px-3 text-sm"
          />
        </Field>
        <Field label="Minutes a person spends per booking">
          <input
            type="number"
            min={0}
            step="any"
            disabled={loading}
            {...num("minutesPerBooking")}
            className="dn-input h-10 w-full px-3 text-sm"
          />
        </Field>
        <Field label="Clinic timezone">
          <Select
            value={draft.timezone}
            disabled={loading}
            onValueChange={(v) => {
              setTouched(true);
              setDraft({ ...draft, timezone: v });
            }}
          >
            <SelectTrigger className="dn-input h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...new Set([draft.timezone, ...ZONES])].map((z) => (
                <SelectItem key={z} value={z}>
                  {z}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="rounded-2xl bg-dn-bg/60 p-3 text-xs text-dn-ink-muted">
          <p>
            <span className="font-semibold text-dn-ink">Time saved</span> = bookings × minutes per
            booking
          </p>
          <p className="mt-1">
            <span className="font-semibold text-dn-ink">Money saved</span> = time saved (hours) ×
            hourly cost
          </p>
        </div>
        <button
          disabled={!dirty || saving || loading}
          className="h-10 rounded-2xl bg-dn-accent px-4 text-sm font-medium text-dn-accent-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm text-dn-ink-muted">
      <span>{label}</span>
      {children}
    </label>
  );
}
