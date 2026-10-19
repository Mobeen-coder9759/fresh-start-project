import type { Appointment, Role } from "./mockData";

export type Status = "Cancelled" | "Rescheduled" | "Completed" | "Upcoming";
export type Page = "dashboard" | "appointments" | "patients" | "settings";

export function getStatus(a: Appointment, now: Date = new Date()): Status {
  if (a.cancel_time) return "Cancelled";
  if (a.booking_type?.toLowerCase() === "rescheduled") return "Rescheduled";
  if (a.booking_time && new Date(a.booking_time) < now) return "Completed";
  return "Upcoming";
}

/** Keeps only the last 4 characters: "Delta 4471-1234" -> "***-**-1234". */
export function maskValue(v: string | null): string {
  if (!v) return "—";
  const digits = v.replace(/[^0-9A-Za-z]/g, "");
  return `***-**-${digits.slice(-4)}`;
}

export function normalizeReason(r: string | null): string {
  return (r ?? "").trim().toLowerCase() || "unspecified";
}

const ACCESS: Record<Role, Page[]> = {
  admin: ["dashboard", "appointments", "patients", "settings"],
  staff: ["dashboard", "appointments", "patients"],
  hr: ["dashboard"],
};
export function canAccess(role: Role, page: Page) {
  return ACCESS[role].includes(page);
}

export type ClinicSettings = {
  appointmentValue: number;
  hourlyCost: number;
  minutesPerBooking: number;
  timezone: string;
};

export function computeSavings(bookings: number, s: Pick<ClinicSettings, "minutesPerBooking" | "hourlyCost">) {
  const minutes = bookings * s.minutesPerBooking;
  const hours = minutes / 60;
  return { minutes, hours, money: hours * s.hourlyCost };
}

export type Patient = {
  key: string;
  name: string;
  phone: string | null;
  email: string | null;
  dob: string | null;
  visits: number;
  lastVisit: string | null;
  nextAppointment: string | null;
  history: Appointment[];
};

export function patientKey(a: Appointment) {
  const id = a.dob ?? a.phone ?? a.email ?? "";
  return `${a.name.trim().toLowerCase()}|${id}`;
}

export function groupPatients(list: Appointment[], now: Date = new Date()): Patient[] {
  const map = new Map<string, Patient>();
  for (const a of list) {
    const key = patientKey(a);
    let p = map.get(key);
    if (!p) {
      p = { key, name: a.name, phone: a.phone, email: a.email, dob: a.dob, visits: 0, lastVisit: null, nextAppointment: null, history: [] };
      map.set(key, p);
    }
    p.phone ??= a.phone;
    p.email ??= a.email;
    p.history.push(a);
    if (!a.booking_time || a.cancel_time) continue;
    const t = new Date(a.booking_time);
    if (t < now) {
      p.visits++;
      if (!p.lastVisit || t > new Date(p.lastVisit)) p.lastVisit = a.booking_time;
    } else if (!p.nextAppointment || t < new Date(p.nextAppointment)) {
      p.nextAppointment = a.booking_time;
    }
  }
  const out = [...map.values()];
  out.forEach((p) => p.history.sort((x, y) => (y.booking_time ?? "").localeCompare(x.booking_time ?? "")));
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
export const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "—";
