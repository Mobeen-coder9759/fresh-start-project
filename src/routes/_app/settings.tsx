import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RequirePage } from "@/components/dental/common";
import { useClinic } from "@/lib/settings";
import { useAuth } from "@/lib/auth";
import { settingsApi, usersApi, errorText, type ManagedUser, type Role } from "@/lib/api";
import { Button } from "@/components/ui/button";

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
  const { user: currentUser } = useAuth();
  const { setSettings: setGlobalSettings } = useClinic();

  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [userError, setUserError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "staff" as Role });

  const [savedSettings, setSavedSettings] = useState({
    appointment_value: 180,
    hourly_cost: 22,
    minutes_per_booking: 6,
    timezone: "America/New_York",
  });
  const [localSettings, setLocalSettings] = useState({ ...savedSettings });
  const [saving, setSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    usersApi
      .list()
      .then(setUsersList)
      .catch((err) => setUserError(errorText(err)));

    settingsApi
      .get()
      .then((s) => {
        setSavedSettings(s);
        setLocalSettings(s);
        setGlobalSettings({
          appointmentValue: s.appointment_value,
          hourlyCost: s.hourly_cost,
          minutesPerBooking: s.minutes_per_booking,
          timezone: s.timezone,
        });
      })
      .catch((err) => setSettingsError(errorText(err)));
  }, [setGlobalSettings]);

  const isDirty = useMemo(() => {
    return (
      localSettings.appointment_value !== savedSettings.appointment_value ||
      localSettings.hourly_cost !== savedSettings.hourly_cost ||
      localSettings.minutes_per_booking !== savedSettings.minutes_per_booking ||
      localSettings.timezone !== savedSettings.timezone
    );
  }, [localSettings, savedSettings]);

  const addUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.username.trim() || !newUser.password) return;
    setUserError(null);
    try {
      const created = await usersApi.create({
        name: newUser.name.trim(),
        username: newUser.username.trim(),
        password: newUser.password,
        role: newUser.role,
      });
      setUsersList((prev) => [...prev, created]);
      setNewUser({ name: "", username: "", password: "", role: "staff" });
    } catch (err) {
      setUserError(errorText(err));
    }
  };

  const toggleActive = async (targetUser: ManagedUser) => {
    if (targetUser.id === currentUser?.id) return;
    setUserError(null);
    const nextActive = !targetUser.is_active;
    try {
      const updated = await usersApi.update(targetUser.id, { is_active: nextActive });
      setUsersList((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
    } catch (err) {
      setUserError(errorText(err));
    }
  };

  const changeRole = async (targetUser: ManagedUser, role: Role) => {
    if (targetUser.id === currentUser?.id) return;
    setUserError(null);
    try {
      const updated = await usersApi.update(targetUser.id, { role });
      setUsersList((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
    } catch (err) {
      setUserError(errorText(err));
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setSettingsError(null);
    try {
      const saved = await settingsApi.update(localSettings);
      setSavedSettings(saved);
      setLocalSettings(saved);
      setGlobalSettings({
        appointmentValue: saved.appointment_value,
        hourlyCost: saved.hourly_cost,
        minutesPerBooking: saved.minutes_per_booking,
        timezone: saved.timezone,
      });
    } catch (err) {
      setSettingsError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <section className="dn-card p-5 xl:col-span-3">
        <h2 className="font-semibold">User management</h2>
        {userError && <p className="mt-2 text-xs text-destructive">{userError}</p>}
        <ul className="mt-4 divide-y divide-dn-line">
          {usersList.map((u) => {
            const isMe = u.id === currentUser?.id;
            return (
              <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-40 flex-1">
                  <p className="text-sm font-medium">
                    {u.name} {isMe && <span className="text-xs text-dn-ink-muted">(you)</span>}
                  </p>
                  <p className="text-xs text-dn-ink-muted">@{u.username}</p>
                </div>
                <Select
                  value={u.role}
                  disabled={isMe}
                  onValueChange={(v) => changeRole(u, v as Role)}
                >
                  <SelectTrigger className="dn-input h-9 w-28 capitalize">
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
                    disabled={isMe}
                    onCheckedChange={() => toggleActive(u)}
                    className="data-[state=checked]:bg-dn-accent"
                  />
                  {u.is_active ? "Active" : "Inactive"}
                </label>
              </li>
            );
          })}
        </ul>

        <form onSubmit={addUser} className="mt-4 flex flex-wrap gap-3 border-t border-dn-line pt-4">
          <label className="flex flex-1 flex-col gap-1 text-xs text-dn-ink-muted">
            Full name
            <input
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              placeholder="Full name"
              className="dn-input h-10 px-3 text-sm text-dn-ink"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs text-dn-ink-muted">
            New username
            <input
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              placeholder="Username"
              className="dn-input h-10 px-3 text-sm text-dn-ink"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs text-dn-ink-muted">
            New password
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="Password"
              className="dn-input h-10 px-3 text-sm text-dn-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-dn-ink-muted">
            Role
            <Select
              value={newUser.role}
              onValueChange={(v) => setNewUser({ ...newUser, role: v as Role })}
            >
              <SelectTrigger className="dn-input h-10 w-28 capitalize">
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
          </label>
          <div className="flex items-end">
            <Button
              type="submit"
              className="h-10 rounded-2xl bg-dn-accent px-4 text-sm font-medium text-dn-accent-foreground"
            >
              Add user
            </Button>
          </div>
        </form>
      </section>

      <section className="dn-card p-5 xl:col-span-2">
        <h2 className="font-semibold">Clinic settings</h2>
        {settingsError && <p className="mt-2 text-xs text-destructive">{settingsError}</p>}
        <div className="mt-4 space-y-4">
          <Field label="Average appointment value ($)">
            <input
              type="number"
              value={localSettings.appointment_value}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  appointment_value: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="dn-input h-10 w-full px-3 text-sm text-dn-ink"
            />
          </Field>
          <Field label="Receptionist hourly cost ($)">
            <input
              type="number"
              value={localSettings.hourly_cost}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  hourly_cost: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="dn-input h-10 w-full px-3 text-sm text-dn-ink"
            />
          </Field>
          <Field label="Minutes a person spends per booking">
            <input
              type="number"
              value={localSettings.minutes_per_booking}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  minutes_per_booking: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="dn-input h-10 w-full px-3 text-sm text-dn-ink"
            />
          </Field>
          <Field label="Clinic timezone">
            <Select
              value={localSettings.timezone}
              onValueChange={(v) => setLocalSettings({ ...localSettings, timezone: v })}
            >
              <SelectTrigger className="dn-input h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ZONES.map((z) => (
                  <SelectItem key={z} value={z}>
                    {z}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Button
            onClick={saveSettings}
            disabled={!isDirty || saving}
            className="w-full rounded-2xl bg-dn-accent text-sm font-medium text-dn-accent-foreground disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
          <div className="rounded-2xl bg-dn-bg/60 p-3 text-xs text-dn-ink-muted">
            <p>
              <span className="font-semibold text-dn-ink">Time saved</span> = bookings × minutes per booking
            </p>
            <p className="mt-1">
              <span className="font-semibold text-dn-ink">Money saved</span> = time saved (hours) × hourly cost
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm text-dn-ink-muted">
      <span>{label}</span>
      {children}
    </label>
  );
}

