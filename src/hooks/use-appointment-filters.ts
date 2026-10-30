import { useMemo, useState } from "react";
import type { Appointment } from "@/lib/types";
import { getStatus, groupPatients, normalizeReason, sortByBookingTime } from "@/lib/appointments";

export const PAGE_SIZE = 20;

export type FilterState = { from: string; to: string; reason: string; type: string; status: string; search: string; sort: "time" | "name" };

export function useAppointmentFilters(list: Appointment[], preset: Partial<FilterState> = {}) {
  const initial: FilterState = { from: "", to: "", reason: "all", type: "all", status: "all", search: "", sort: "time" };
  const [f, setF] = useState<FilterState>({ ...initial, ...preset });
  const [page, setPage] = useState(1);

  const reasons = useMemo(() => [...new Set(list.map((a) => normalizeReason(a.reason)))].sort(), [list]);
  const types = useMemo(() => [...new Set(list.map((a) => a.booking_type ?? "unspecified"))].sort(), [list]);

  const filtered = useMemo(() => {
    const q = f.search.trim().toLowerCase();
    const from = f.from ? new Date(f.from + "T00:00:00") : null;
    const to = f.to ? new Date(f.to + "T23:59:59") : null;
    const out = list.filter((a) => {
      const t = a.booking_time ? new Date(a.booking_time) : null;
      if (from && (!t || t < from)) return false;
      if (to && (!t || t > to)) return false;
      if (f.reason !== "all" && normalizeReason(a.reason) !== f.reason) return false;
      if (f.type !== "all" && (a.booking_type ?? "unspecified") !== f.type) return false;
      if (f.status !== "all") {
        const st = getStatus(a).toLowerCase();
        if (f.status === "cancelled + rescheduled" ? st !== "cancelled" && st !== "rescheduled" : st !== f.status) return false;
      }
      if (q && !a.name.toLowerCase().includes(q)) return false;
      return true;
    });
    return f.sort === "name" ? [...out].sort((a, b) => a.name.localeCompare(b.name)) : sortByBookingTime(out, "asc");
  }, [list, f]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const update = (patch: Partial<FilterState>) => { setF((p) => ({ ...p, ...patch })); setPage(1); };
  const clear = () => { setF(initial); setPage(1); };
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);

  return { f, update, clear, dirty, reasons, types, rows, total: filtered.length, page: current, pages, setPage };
}

export function usePatients(list: Appointment[]) {
  const [search, setSearch] = useState("");
  const [desc, setDesc] = useState(false);
  const all = useMemo(() => groupPatients(list), [list]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const r = all.filter((p) => !q || p.name.toLowerCase().includes(q) || (p.email ?? "").includes(q) || (p.phone ?? "").includes(q));
    return desc ? [...r].reverse() : r;
  }, [all, search, desc]);
  return { rows, search, setSearch, desc, setDesc };
}
