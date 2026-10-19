import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, RequirePage, StatusBadge } from "@/components/dental/common";
import { useAppointments, useInitialLoad } from "@/hooks/use-dashboard-data";
import { usePatients } from "@/hooks/use-appointment-filters";
import { fmtDate, fmtDateTime, getStatus, type Patient } from "@/lib/appointments";

export const Route = createFileRoute("/_app/patients")({
  head: () => ({
    meta: [
      { title: "Patients — Dental Desk" },
      { name: "description", content: "Every patient, their visit count, and next appointment." },
      { property: "og:title", content: "Patients — Dental Desk" },
      { property: "og:description", content: "Every patient, their visit count, and next appointment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequirePage page="patients">
      <Patients />
    </RequirePage>
  ),
});

function Patients() {
  const loading = useInitialLoad();
  const p = usePatients(useAppointments());
  const [sel, setSel] = useState<Patient | null>(null);
  const now = new Date();
  return (
    <div className="space-y-5">
      <div className="dn-card flex flex-wrap items-center gap-3 p-4">
        <label className="dn-input flex h-10 min-w-56 flex-1 items-center gap-2 px-3">
          <Search className="size-4" />
          <input value={p.search} onChange={(e) => p.setSearch(e.target.value)} placeholder="Search patients" className="w-full bg-transparent text-sm outline-none placeholder:text-dn-field-text" />
        </label>
        <button onClick={() => p.setDesc(!p.desc)} className="h-10 rounded-2xl bg-dn-accent px-4 text-sm font-medium text-dn-accent-foreground">
          {p.desc ? "Z–A" : "A–Z"}
        </button>
      </div>
      <div className="dn-card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-dn-line text-left text-xs uppercase tracking-wide text-dn-ink-muted">
              {["Name", "Phone", "Email", "Total visits", "Last visit", "Next appointment"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }, (_, i) => <tr key={i}><td colSpan={6} className="px-4 py-2"><Skeleton className="h-6 w-full bg-dn-ink/10" /></td></tr>)
              : p.rows.map((r) => (
                  <tr key={r.key} onClick={() => setSel(r)} className="cursor-pointer border-b border-dn-line/60 hover:bg-dn-accent/10">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="whitespace-nowrap px-4 py-3">{r.phone ?? "—"}</td>
                    <td className="px-4 py-3">{r.email ?? "—"}</td>
                    <td className="px-4 py-3">{r.visits}</td>
                    <td className="px-4 py-3">{fmtDate(r.lastVisit)}</td>
                    <td className="px-4 py-3">{fmtDateTime(r.nextAppointment)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && p.rows.length === 0 && <EmptyState title="No patients found" hint="Try a different name, phone or email." />}
      </div>
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="overflow-y-auto bg-dn-card text-dn-ink">
          {sel && (
            <>
              <SheetHeader>
                <SheetTitle className="text-dn-ink">{sel.name}</SheetTitle>
                <SheetDescription>{sel.history.length} appointments · {sel.phone ?? sel.email ?? ""}</SheetDescription>
              </SheetHeader>
              <ul className="space-y-2 px-4 pb-6">
                {sel.history.map((a) => (
                  <li key={a.id} className="rounded-2xl bg-dn-bg/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{fmtDateTime(a.booking_time)}</span>
                      <StatusBadge status={getStatus(a, now)} />
                    </div>
                    <p className="mt-1 text-xs capitalize text-dn-ink-muted">{a.reason?.trim() || "No reason"} · {a.booking_type ?? "—"}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
