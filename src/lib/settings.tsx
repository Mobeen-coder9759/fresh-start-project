import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi, type ClinicSettingsDto } from "./api";
import { useAuth } from "./auth";
import type { ClinicSettings } from "./appointments";

// Shown only until the server answers; the real values are stored per clinic in the database.
const DEFAULT_SETTINGS: ClinicSettings = {
  appointmentValue: 180,
  hourlyCost: 22,
  minutesPerBooking: 6,
  timezone: "Asia/Karachi",
};

const fromDto = (d: ClinicSettingsDto): ClinicSettings => ({
  appointmentValue: d.appointment_value,
  hourlyCost: d.hourly_cost,
  minutesPerBooking: d.minutes_per_booking,
  timezone: d.timezone,
});
const toDto = (s: ClinicSettings): ClinicSettingsDto => ({
  appointment_value: s.appointmentValue,
  hourly_cost: s.hourlyCost,
  minutes_per_booking: s.minutesPerBooking,
  timezone: s.timezone,
});

type Ctx = {
  settings: ClinicSettings;
  loading: boolean;
  saving: boolean;
  /** Admin only. Resolves with the saved settings, rejects with an ApiError. */
  saveSettings: (s: ClinicSettings) => Promise<ClinicSettings>;
};

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = useMemo(() => ["settings", user?.clinic_id] as const, [user?.clinic_id]);

  const query = useQuery({
    queryKey: key,
    queryFn: async () => fromDto(await settingsApi.get()),
    enabled: !!user,
    staleTime: 60_000,
  });
  const mutation = useMutation({
    mutationFn: async (s: ClinicSettings) => fromDto(await settingsApi.update(toDto(s))),
    onSuccess: (saved) => queryClient.setQueryData(key, saved),
  });

  const value: Ctx = {
    settings: query.data ?? DEFAULT_SETTINGS,
    loading: query.isLoading,
    saving: mutation.isPending,
    saveSettings: (s) => mutation.mutateAsync(s),
  };
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useClinic() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useClinic must be used inside SettingsProvider");
  return ctx;
}
