import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ClinicSettings } from "./appointments";
import { mockUsers, type AppUser } from "./mockData";
import { settingsApi, tokenStore } from "./api";

type Ctx = {
  settings: ClinicSettings;
  setSettings: (s: ClinicSettings) => void;
  users: AppUser[];
  setUsers: (u: AppUser[]) => void;
};

const SettingsContext = createContext<Ctx | null>(null);

const DEFAULT_SETTINGS: ClinicSettings = {
  appointmentValue: 180,
  hourlyCost: 22,
  minutesPerBooking: 6,
  timezone: "America/New_York",
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ClinicSettings>(DEFAULT_SETTINGS);
  const [users, setUsers] = useState<AppUser[]>(() => mockUsers.map((u) => ({ ...u })));

  useEffect(() => {
    if (!tokenStore.get()) return;
    settingsApi
      .get()
      .then((data) => {
        setSettings({
          appointmentValue: data.appointment_value,
          hourlyCost: data.hourly_cost,
          minutesPerBooking: data.minutes_per_booking,
          timezone: data.timezone,
        });
      })
      .catch(() => {
        /* fallback to defaults */
      });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, users, setUsers }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useClinic() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useClinic must be used inside SettingsProvider");
  return ctx;
}

