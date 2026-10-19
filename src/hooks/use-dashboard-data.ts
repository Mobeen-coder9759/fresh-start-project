import { useMemo, useEffect, useState } from "react";
import { getMockAppointments, type Appointment } from "@/lib/mockData";
import { computeSavings, getStatus, normalizeReason } from "@/lib/appointments";
import { useClinic } from "@/lib/settings";

const DAY = 86400000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function useAppointments(): Appointment[] {
  return useMemo(() => getMockAppointments(), []);
}

/** Short fake loading delay so skeletons show on first render. */
export function useInitialLoad(ms = 450) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
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
    const cancelRate = newThisWeek.length ? (cancels / newThisWeek.length) * 100 : 0;
    const savings = computeSavings(newThisWeek.length, settings);
    return { todayCount, upcoming, newThisWeek: newThisWeek.length, cancels, reschedules, cancelRate, savings };
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
      if (i !== undefined) buckets[i].bookings++;
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
