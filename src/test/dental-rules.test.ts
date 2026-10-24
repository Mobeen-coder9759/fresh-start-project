import { describe, expect, it } from "vitest";
import { canAccess, computeSavings, getStatus, groupPatients, maskValue, sortByBookingTime } from "@/lib/appointments";
import type { Appointment } from "@/lib/mockData";
import { PATIENTS, buildMockAppointments } from "@/lib/mockData";
import { BOOKING_RANGES } from "@/lib/booking-ranges";

const now = new Date("2026-10-19T12:00:00Z");

describe("dashboard configuration", () => {
  it("offers only 7 and 30 day booking ranges", () => {
    expect([...BOOKING_RANGES]).toEqual([7, 30]);
    expect(BOOKING_RANGES.some((days: number) => days === 90)).toBe(false);
  });
  it("keeps South Asian-style sample names within 10–15%", () => {
    const names = new Set(["Ayesha Khan", "Rohan Patel", "Priya Sharma", "Omar Ahmed", "Zara Malik", "Arjun Mehta"]);
    const share = PATIENTS.filter(([name]) => names.has(name)).length / PATIENTS.length;
    expect(share).toBeGreaterThanOrEqual(0.10);
    expect(share).toBeLessThanOrEqual(0.15);
  });
  it("reserves 10% for the combined Irish and Asian sample names", () => {
    const names = new Set(["Aoife Murphy", "Cian O'Brien", "Mei Chen", "Daniel Kim"]);
    expect(PATIENTS.filter(([name]) => names.has(name)).length / PATIENTS.length).toBe(0.10);
  });
  it("generates appointments using the updated patient catalog", () => {
    const names = new Set<string>(PATIENTS.map(([name]) => name));
    const list = buildMockAppointments(now);
    expect(list).toHaveLength(160);
    expect(list.every((appointment) => names.has(appointment.name))).toBe(true);
    expect(list.some((appointment) => appointment.name === "Lucas Thompson")).toBe(true);
  });
});
const base: Appointment = {
  id: 1, calendar_event_id: "e", timestamp: "", name: "Emma Johnson", email: null, dob: "1988-04-12", insurance: null,
  reason: "Cleaning", booking_type: "new", old_time: null, booking_time: "2026-10-20T10:00:00Z", cancel_time: null,
  created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z", phone: null,
};

describe("status", () => {
  it("cancelled wins over everything", () => expect(getStatus({ ...base, cancel_time: "x", booking_type: "rescheduled" }, now)).toBe("Cancelled"));
  it("rescheduled booking type", () => expect(getStatus({ ...base, booking_type: "rescheduled" }, now)).toBe("Rescheduled"));
  it("past booking is completed", () => expect(getStatus({ ...base, booking_time: "2026-10-18T10:00:00Z" }, now)).toBe("Completed"));
  it("future booking is upcoming", () => expect(getStatus(base, now)).toBe("Upcoming"));
});

describe("masking", () => {
  it("shows only last 4", () => expect(maskValue("Delta Dental 4471-2280-1234")).toBe("***-**-1234"));
});

describe("roles", () => {
  it("staff cannot open settings", () => expect(canAccess("staff", "settings")).toBe(false));
  it("hr cannot open appointments or patients", () => {
    expect(canAccess("hr", "appointments")).toBe(false);
    expect(canAccess("hr", "patients")).toBe(false);
  });
  it("admin can open settings", () => expect(canAccess("admin", "settings")).toBe(true));
});

describe("savings", () => {
  it("30 bookings × 6 min at $20/hr = 3h, $60", () => {
    expect(computeSavings(30, { minutesPerBooking: 6, hourlyCost: 20 })).toEqual({ minutes: 180, hours: 3, money: 60 });
  });
});

describe("patients", () => {
  it("groups by name + dob and counts past visits", () => {
    const list = [base, { ...base, id: 2, booking_time: "2026-10-01T10:00:00Z" }, { ...base, id: 3, dob: "1990-01-01" }];
    const p = groupPatients(list, now);
    expect(p).toHaveLength(2);
    expect(p.find((x) => x.dob === "1988-04-12")?.visits).toBe(1);
  });
});

describe("appointment sorting", () => {
  it("lists the earliest appointment first, ordered by date then time", () => {
    const list = [
      { ...base, id: 1, booking_time: "2026-10-21T09:00:00Z" },
      { ...base, id: 2, booking_time: "2026-10-19T17:30:00Z" },
      { ...base, id: 3, booking_time: "2026-10-19T08:15:00Z" },
    ];
    expect(sortByBookingTime(list).map((a) => a.id)).toEqual([3, 2, 1]);
  });
  it("keeps appointments without a time at the end", () => {
    const list = [
      { ...base, id: 1, booking_time: null },
      { ...base, id: 2, booking_time: "2026-10-19T08:15:00Z" },
    ];
    expect(sortByBookingTime(list).map((a) => a.id)).toEqual([2, 1]);
  });
});
