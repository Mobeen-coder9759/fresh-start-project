import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailRow, EmptyState, RequirePage, StatusBadge } from "@/components/dental/common";
import { useAppointments, useInitialLoad } from "@/hooks/use-dashboard-data";
import { useAppointmentFilters } from "@/hooks/use-appointment-filters";
import { fmtDate, fmtDateTime, getStatus, maskValue } from "@/lib/appointments";
import type { Appointment } from "@/lib/types";

export const Route = createFileRoute("/_app/appointments")({
  head: () => ({
    meta: [
      { title: "Appointments — Dental Desk" },
      { name: "description", content: "Search, filter and review every clinic appointment." },
      { property: "og:title", content: "Appointments — Dental Desk" },
      { property: "og:description", content: "Search, filter and review every clinic appointment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { from?: string | undefined; to?: string | undefined; status?: string | undefined } => ({
    from: typeof s["from"] === "string" ? s["from"] : undefined,
    to: typeof s["to"] === "string" ? s["to"] : undefined,
    status: typeof s["status"] === "string" ? s["status"] : undefined,
  }),
  component: () => (
    <RequirePage page="appointments">
      <Appointments />
    </RequirePage>
  ),
});

function Appointments() {
  const list = useAppointments();
  const loading = useInitialLoad();
  const search = Route.useSearch();
  const t = useAppointmentFilters(list, Object.fromEntries(Object.entries(search).filter(([, v]) => v)));
  const [selected, setSelected] = useState<Appointment | null>(null);
  const now = new Date();

  return (
    <div className="space-y-5">
      <div className="dn-card flex flex-wrap items-end gap-3 p-4">
        <label className="flex flex-col gap-1 text-xs text-dn-ink-muted">From
          <input type="date" value={t.f.from} onChange={(e) => t.update({ from: e.target.value })} className="dn-input h-10 px-3 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-dn-ink-muted">To
          <input type="date" value={t.f.to} onChange={(e) => t.update({ to: e.target.value })} className="dn-input h-10 px-3 text-sm" />
        </label>
        <FilterSelect label="Reason" value={t.f.reason} onChange={(v) => t.update({ reason: v })} options={t.reasons} />
        <FilterSelect label="Booking type" value={t.f.type} onChange={(v) => t.update({ type: v })} options={t.types} />
        <FilterSelect label="Status" value={t.f.status} onChange={(v) => t.update({ status: v })} options={STATUSES} />
        <label className="dn-input flex h-10 min-w-48 flex-1 items-center gap-2 px-3">
          <Search className="size-4" />
          <input value={t.f.search} onChange={(e) => t.update({ search: e.target.value })} placeholder="Search patient" className="w-full bg-transparent text-sm outline-none placeholder:text-dn-field-text" />
        </label>
        <div className="flex rounded-2xl bg-dn-bg p-1">
          {(["time", "name"] as const).map((s) => (
            <button key={s} onClick={() => t.update({ sort: s })} className={`rounded-xl px-3 py-1.5 text-xs font-medium capitalize ${t.f.sort === s ? "bg-dn-accent text-dn-accent-foreground" : "text-dn-ink-muted"}`}>
              {s}
            </button>
          ))}
        </div>
        <button disabled={!t.dirty} onClick={t.clear} className="h-10 rounded-2xl px-3 text-sm font-medium text-dn-accent disabled:opacity-40">Clear filters</button>
      </div>

      <div className="dn-card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-dn-line text-left text-xs uppercase tracking-wide text-dn-ink-muted">
              {["Time", "Patient name", "Reason", "Insurance", "Booking type", "Status"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }, (_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-2"><Skeleton className="h-6 w-full bg-dn-ink/10" /></td></tr>
                ))
              : t.rows.map((a) => (
                  <tr key={a.id} onClick={() => setSelected(a)} className="cursor-pointer border-b border-dn-line/60 hover:bg-dn-accent/10">
                    <td className="whitespace-nowrap px-4 py-3">{fmtDateTime(a.booking_time)}</td>
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3 capitalize">{a.reason?.trim() || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{maskValue(a.insurance)}</td>
                    <td className="px-4 py-3 capitalize">{a.booking_type ?? "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={getStatus(a, now)} /></td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && t.total === 0 && <EmptyState title="No appointments match" hint="Try changing or clearing the filters." />}
      </div>

      {t.total > 0 && (
        <div className="flex items-center justify-between text-sm text-dn-ink-muted">
          <span>{t.total} appointments · page {t.page} of {t.pages}</span>
          <div className="flex gap-2">
            <button disabled={t.page === 1} onClick={() => t.setPage(t.page - 1)} className="rounded-2xl bg-dn-card px-4 py-2 font-medium text-dn-ink disabled:opacity-40">Previous</button>
            <button disabled={t.page === t.pages} onClick={() => t.setPage(t.page + 1)} className="rounded-2xl bg-dn-accent px-4 py-2 font-medium text-dn-accent-foreground disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="overflow-y-auto bg-dn-card text-dn-ink">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-dn-ink">{selected.name}</SheetTitle>
                <SheetDescription><StatusBadge status={getStatus(selected, now)} /></SheetDescription>
              </SheetHeader>
              <div className="px-4">
                <DetailRow label="Phone" value={selected.phone ?? "—"} />
                <DetailRow label="Email" value={selected.email ?? "—"} />
                <DetailRow label="Date of birth" value={fmtDate(selected.dob)} />
                <DetailRow label="Insurance" value={selected.insurance ?? "—"} />
                <DetailRow label="Reason" value={selected.reason?.trim() || "—"} />
                <DetailRow label="Booking type" value={selected.booking_type ?? "—"} />
                <DetailRow label="Booking time" value={fmtDateTime(selected.booking_time)} />
                <DetailRow label="Old time" value={fmtDateTime(selected.old_time)} />
                <DetailRow label="Cancel time" value={fmtDateTime(selected.cancel_time)} />
                <DetailRow label="Created" value={fmtDateTime(selected.created_at)} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

const STATUSES = ["upcoming", "completed", "cancelled", "rescheduled", "cancelled + rescheduled"];

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-dn-ink-muted">{label}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="dn-input h-10 w-44 capitalize"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </label>
  );
}
