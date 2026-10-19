export type Role = "admin" | "staff" | "hr";

export type AppUser = {
  id: number;
  username: string;
  password_hash: string; // mock this
  name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
};

export type Appointment = {
  id: number;
  calendar_event_id: string;
  timestamp: string;
  name: string;
  email: string | null;
  dob: string | null;
  insurance: string | null;
  reason: string | null;
  booking_type: string | null;
  old_time: string | null;
  booking_time: string | null;
  cancel_time: string | null;
  created_at: string;
  updated_at: string;
  phone: string | null;
};

export const mockUsers: AppUser[] = [
  { id: 1, username: "dr.khan", password_hash: "$2b$10$mockhashadmin", name: "Dr. Ayesha Khan", role: "admin", is_active: true, created_at: "2025-01-04T09:00:00Z" },
  { id: 2, username: "sara.front", password_hash: "$2b$10$mockhashstaff1", name: "Sara Malik", role: "staff", is_active: true, created_at: "2025-02-11T09:00:00Z" },
  { id: 3, username: "omar.desk", password_hash: "$2b$10$mockhashstaff2", name: "Omar Siddiqui", role: "staff", is_active: true, created_at: "2025-03-02T09:00:00Z" },
  { id: 4, username: "hina.hr", password_hash: "$2b$10$mockhashhr", name: "Hina Raza", role: "hr", is_active: true, created_at: "2025-03-20T09:00:00Z" },
  { id: 5, username: "bilal.temp", password_hash: "$2b$10$mockhashstaff3", name: "Bilal Ahmed", role: "staff", is_active: false, created_at: "2025-05-14T09:00:00Z" },
  { id: 6, username: "dr.lee", password_hash: "$2b$10$mockhashadmin2", name: "Dr. Jonathan Lee", role: "admin", is_active: true, created_at: "2025-06-01T09:00:00Z" },
];

const PATIENTS = [
  ["Emma Johnson", "1988-04-12"], ["Liam Smith", "1975-09-30"], ["Olivia Brown", "1992-01-22"],
  ["Noah Davis", "2001-07-08"], ["Ava Wilson", "1969-11-15"], ["Lucas Martinez", "1983-03-03"],
  ["Mia Anderson", "1995-12-19"], ["Ethan Thomas", "1979-06-27"], ["Sophia Taylor", "2004-02-14"],
  ["James Moore", "1990-10-05"], ["Isabella Jackson", "1986-08-21"], ["Benjamin White", "1972-05-11"],
  ["Charlotte Harris", "1998-09-09"], ["Henry Clark", "1965-04-01"], ["Amelia Lewis", "1993-07-17"],
  ["Alexander Young", "1981-12-02"], ["Harper King", "2000-03-28"], ["Daniel Wright", "1977-01-13"],
  ["Evelyn Scott", "1989-06-06"], ["Michael Green", "1970-10-24"], ["Abigail Baker", "1996-05-30"],
  ["Sebastian Hall", "1984-11-08"], ["Emily Allen", "1991-02-25"], ["Jack Nelson", "1968-08-16"],
] as const;
const REASONS = ["Cleaning", "cleaning ", "Checkup", "Toothache", "Root canal", "Whitening", "Filling", "Crown", "Braces consult", "Extraction", "Gum bleeding", "Implant consult"];
const INSURERS = ["Delta Dental 4471-2280-1234", "Cigna DPPO 9910-3385-5521", "MetLife 2231-8840-7765", "Aetna 6612-0093-4410", null];
const TYPES = ["new", "new", "new", "rescheduled", "follow-up"];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Builds deterministic appointments around `now` (-90..+14 days). Call lazily, never at module scope. */
export function buildMockAppointments(now: Date, count = 160): Appointment[] {
  const r = rng(42);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(r() * arr.length)];
  const out: Appointment[] = [];
  for (let i = 0; i < count; i++) {
    const [name, dob] = pick(PATIENTS);
    const dayOffset = Math.floor(r() * 105) - 90;
    const t = new Date(now);
    t.setDate(t.getDate() + dayOffset);
    t.setHours(9 + Math.floor(r() * 8), r() < 0.5 ? 0 : 30, 0, 0);
    const created = new Date(t);
    created.setDate(created.getDate() - (1 + Math.floor(r() * 14)));
    const type = pick(TYPES);
    const cancelled = r() < 0.1;
    const old = type === "rescheduled" ? new Date(t.getTime() - 2 * 86400000).toISOString() : null;
    const slug = name.toLowerCase().replace(/\s+/g, ".");
    out.push({
      id: i + 1,
      calendar_event_id: `evt_${(100000 + i * 37).toString(36)}`,
      timestamp: created.toISOString(),
      name,
      email: r() < 0.85 ? `${slug}@example.com` : null,
      dob,
      insurance: pick(INSURERS),
      reason: r() < 0.95 ? pick(REASONS) : null,
      booking_type: type,
      old_time: old,
      booking_time: t.toISOString(),
      cancel_time: cancelled ? new Date(created.getTime() + 86400000).toISOString() : null,
      created_at: created.toISOString(),
      updated_at: created.toISOString(),
      phone: `+1 555 ${String(100 + PATIENTS.findIndex((p) => p[0] === name)).padStart(3, "0")} ${String(1000 + i).slice(-4)}`,
    });
  }
  return out;
}

let cache: { day: string; data: Appointment[] } | null = null;
export function getMockAppointments(): Appointment[] {
  const now = new Date();
  const day = now.toDateString();
  if (!cache || cache.day !== day) cache = { day, data: buildMockAppointments(now) };
  return cache.data;
}
