import { createContext, useContext, useState, type ReactNode } from "react";
import type { ClinicSettings } from "./appointments";
import { mockUsers, type AppUser } from "./mockData";

type Ctx = {
  settings: ClinicSettings;
  setSettings: (s: ClinicSettings) => void;
  users: AppUser[];
  setUsers: (u: AppUser[]) => void;
};

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ClinicSettings>({
    appointmentValue: 180,
    hourlyCost: 22,
    minutesPerBooking: 6,
    timezone: "America/New_York",
  });
  const [users, setUsers] = useState<AppUser[]>(() => mockUsers.map((u) => ({ ...u })));
  return <SettingsContext.Provider value={{ settings, setSettings, users, setUsers }}>{children}</SettingsContext.Provider>;
}

export function useClinic() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useClinic must be used inside SettingsProvider");
  return ctx;
}
