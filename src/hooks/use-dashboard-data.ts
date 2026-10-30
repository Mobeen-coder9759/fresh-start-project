import { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Appointment } from "@/lib/types";
import { ApiError, appointmentsApi, type Appointment as ApiAppointment } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { computeSavings, getStatus, normalizeReason } from "@/lib/appointments";
import { useClinic } from "@/lib/settings";

const DAY = 86400000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const EMPTY: Appointment[] = [];

export function toUiAppointment(a: ApiAppointment): Appointment {
  return {
    id: a.id, name: a.name, phone: a.phone, email: a.email, insurance: a.insurance, reason: a.reason,
    booking_type: a.booking_type, old_time: a.old_time, booking_time: a.booking_time, cancel_time: a.cancel_time,
    created_at: a.created_at, updated_at: a.updated_at, dob: a.dob ? a.dob.slice(0, 10) : null,
  };
}

function useAppointmentsQuery() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["appointments", user?.clinic_id, user?.id],
    queryFn: async () => (await appointmentsApi.listAll()).map(toUiAppointment),
    enabled: !!user,
    staleTime: 30_000,
    retry: (count, err) => {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) return false;
      return count < 2;
    },
  });
}

export function useAppointments(): Appointment[] {
  const q = useAppointmentsQuery();
  useEffect(() => {
    if (q.isError && !(q.error instanceof ApiError && q.error.status === 401)) {
      toast.error(q.error.message, { id: "appointments-error" });
    }
  }, [q.isError, q.error]);
  return q.data ?? EMPTY;
}

/** Real loading state of the appointments query. The parameter is ignored (kept for old call sites). */
export function useInitialLoad(_ms?: number): boolean {
  return useAppointmentsQuery().isLoading;
}

export function useKpis(list: Appointment[]) {
  const { settings } = useClinic();
  return useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = new Date(today.getTime() + DAY);
    const in7 = new Date(now.getTime() + 7 * DAY);
    const weekAgo = new Date(now.getTime() - 7 * DAY);
    const live = list.filter((a) => !a.cancel_time && a.booking_time);
    const todayCount = live.filter((a) => { const t = new Date(a.booking_time!); return t >= today && t < tomorrow; }).length;
    const upcoming = live.filter((a) => { const t = new Date(a.booking_time!); return t >= now && t <= in7; }).length;
    const newThisWeek = list.filter((a) => new Date(a.created_at) >= weekAgo);
    const cancels = list.filter((a) => a.cancel_time && new Date(a.cancel_time) >= weekAgo).length;
    const reschedules = list.filter((a) => a.booking_type === "rescheduled" && new Date(a.updated_at) >= weekAgo).length;
    const inNext7 = (a: Appointment) => { if (!a.booking_time) return false; const t = new Date(a.booking_time); return t >= today && t <= in7; };
    const changesNext7 = list.filter((a) => inNext7(a) && (a.cancel_time || a.booking_type?.toLowerCase() === "rescheduled"));
    const cancelsNext7 = changesNext7.filter((a) => a.cancel_time).length;
    const reschedulesNext7 = changesNext7.length - cancelsNext7;
    const cancelRate = newThisWeek.length ? (cancels / newThisWeek.length) * 100 : 0;
    const savings = computeSavings(newThisWeek.length, settings);
    return { cancelsNext7, reschedulesNext7, todayCount, upcoming, newThisWeek: newThisWeek.length, cancels, reschedules, cancelRate, savings };
  }, [list, settings]);
}

export function useBookingsSeries(list: Appointment[], days: number) {
  return useMemo(() => {
    const today = startOfDay(new Date());
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date(today.getTime() - (days - 1 - i) * DAY);
      return { key: d.toDateString(), label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), bookings: 0 };
    });
    const idx = new Map(buckets.map((b, i) => [b.key, i]));
    for (const a of list) {
      if (!a.booking_time) continue;
      const i = idx.get(startOfDay(new Date(a.booking_time)).toDateString());
      if (i !== undefined) buckets[i]!.bookings++;
    }
    return buckets;
  }, [list, days]);
}

export function useReasonBreakdown(list: Appointment[]) {
  return useMemo(() => {
    const counts = new Map<string, number>();
    list.forEach((a) => { const r = normalizeReason(a.reason); counts.set(r, (counts.get(r) ?? 0) + 1); });
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 6).map(([name, value]) => ({ name, value }));
    const other = sorted.slice(6).reduce((s, [, v]) => s + v, 0);
    return other ? [...top, { name: "other", value: other }] : top;
  }, [list]);
}

export function useNextAppointments(list: Appointment[], n = 5) {
  return useMemo(() => {
    const now = new Date();
    return list
      .filter((a) => getStatus(a, now) === "Upcoming" || (a.booking_type === "rescheduled" && !a.cancel_time && a.booking_time && new Date(a.booking_time) >= now))
      .sort((a, b) => (a.booking_time ?? "").localeCompare(b.booking_time ?? ""))
      .slice(0, n);
  }, [list, n]);
}
