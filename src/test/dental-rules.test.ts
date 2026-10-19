import { describe, expect, it } from "vitest";
import { canAccess, computeSavings, getStatus, groupPatients, maskValue } from "@/lib/appointments";
import type { Appointment } from "@/lib/mockData";

const now = new Date("2026-10-19T12:00:00Z");
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
