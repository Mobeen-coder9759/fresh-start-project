import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Info } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RequirePage } from "@/components/dental/common";
import { useAppointments, useBookingsSeries, useInitialLoad, useKpis, useNextAppointments, useReasonBreakdown } from "@/hooks/use-dashboard-data";
import { fmtTime, fmtDate } from "@/lib/appointments";
import { useAuth } from "@/lib/auth";
import { useClinic } from "@/lib/settings";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Dental Desk" },
      { name: "description", content: "Today's appointments, bookings trend, and estimated savings for your dental clinic." },
      { property: "og:title", content: "Dashboard — Dental Desk" },
      { property: "og:description", content: "Today's appointments, bookings trend, and estimated savings for your dental clinic." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequirePage page="dashboard">
      <Dashboard />
    </RequirePage>
  ),
});

const PIE_COLORS = ["var(--dn-accent)", "var(--dn-chart-2)", "var(--dn-chart-3)", "var(--dn-chart-4)", "var(--dn-chart-5)", "var(--dn-chart-6)", "var(--dn-chart-7)"];

function Dashboard() {
  const { user } = useAuth();
  const list = useAppointments();
  const loading = useInitialLoad();
  const hrOnly = user?.role === "hr";
  return (
    <div className="space-y-6">
      <KpiCards loading={loading} />
      {!hrOnly && (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <BookingsChart loading={loading} />
            <ReasonsChart loading={loading} />
          </div>
          <Schedule loading={loading} list={list} />
        </>
      )}
    </div>
  );
}

function KpiCards({ loading }: { loading: boolean }) {
  const k = useKpis(useAppointments());
  const { settings } = useClinic();
  const money = k.savings.money.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const cards = [
    { label: "Today's appointments", value: String(k.todayCount), sub: "booked for today" },
    { label: "Upcoming", value: String(k.upcoming), sub: "next 7 days" },
    { label: "New bookings", value: String(k.newThisWeek), sub: "this week" },
    { label: "Cancellations + reschedules", value: `${k.cancels} + ${k.reschedules}`, sub: `${k.cancelRate.toFixed(1)}% cancel rate this week` },
  ];
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className="dn-card p-5">
          {loading ? <KpiSkeleton /> : (
            <>
              <p className="text-sm text-dn-ink-muted">{c.label}</p>
              <p className="mt-2 text-3xl font-semibold">{c.value}</p>
              <p className="mt-1 text-xs text-dn-ink-muted">{c.sub}</p>
            </>
          )}
        </div>
      ))}
      <div className="dn-card p-5">
        {loading ? <KpiSkeleton /> : (
          <>
            <p className="flex items-center gap-1.5 text-sm text-dn-ink-muted">
              Estimated savings
              <Tooltip>
                <TooltipTrigger aria-label="How this is calculated"><Info className="size-3.5" /></TooltipTrigger>
                <TooltipContent className="max-w-64">
                  Time saved = bookings this week × {settings.minutesPerBooking} min per booking. Money saved = time saved (hours) × ${settings.hourlyCost}/hr receptionist cost.
                </TooltipContent>
              </Tooltip>
            </p>
            <p className="mt-2 text-3xl font-semibold">{money}</p>
            <p className="mt-1 text-xs text-dn-ink-muted">Estimated · {k.savings.hours.toFixed(1)} hrs saved this week</p>
          </>
        )}
      </div>
    </section>
  );
}

function KpiSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-28 bg-dn-ink/10" />
      <Skeleton className="h-8 w-16 bg-dn-ink/10" />
      <Skeleton className="h-3 w-24 bg-dn-ink/10" />
    </div>
  );
}

function BookingsChart({ loading }: { loading: boolean }) {
  const [days, setDays] = useState(30);
  const data = useBookingsSeries(useAppointments(), days);
  return (
    <section className="dn-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Bookings over time</h2>
        <div className="flex rounded-2xl bg-dn-bg p-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-xl px-3 py-1 text-xs font-medium ${days === d ? "bg-dn-accent text-dn-accent-foreground" : "text-dn-ink-muted"}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-64">
        {loading ? <Skeleton className="h-full w-full bg-dn-ink/10" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="bk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--dn-accent)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--dn-accent)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--dn-line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--dn-ink-muted)" }} minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--dn-ink-muted)" }} />
              <RTooltip />
              <Area type="monotone" dataKey="bookings" stroke="var(--dn-accent)" strokeWidth={2} fill="url(#bk)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

function ReasonsChart({ loading }: { loading: boolean }) {
  const data = useReasonBreakdown(useAppointments());
  return (
    <section className="dn-card p-5">
      <h2 className="font-semibold">Appointment reasons</h2>
      <div className="mt-4 h-64">
        {loading ? <Skeleton className="h-full w-full bg-dn-ink/10" /> : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
                {data.map((d, i) => <Cell key={d.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <RTooltip />
              <Legend layout="vertical" align="right" verticalAlign="middle" formatter={(v) => <span className="text-xs capitalize text-dn-ink">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

function Schedule({ loading, list }: { loading: boolean; list: ReturnType<typeof useAppointments> }) {
  const next = useNextAppointments(list);
  return (
    <section className="dn-card p-5">
      <h2 className="font-semibold">Today's schedule</h2>
      <p className="text-xs text-dn-ink-muted">Next 5 upcoming appointments</p>
      <ol className="mt-4 space-y-0">
        {loading
          ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="mb-3 h-10 w-full bg-dn-ink/10" />)
          : next.map((a, i) => (
              <li key={a.id} className="relative flex gap-4 pb-5 pl-6 last:pb-0">
                <span className="absolute left-0 top-1.5 size-3 rounded-full bg-dn-accent ring-4 ring-dn-accent/20" />
                {i < next.length - 1 && <span className="absolute left-[5px] top-5 h-full w-px bg-dn-accent/30" />}
                <div className="w-28 shrink-0 text-sm font-semibold">
                  {fmtTime(a.booking_time)}
                  <span className="block text-xs font-normal text-dn-ink-muted">{fmtDate(a.booking_time)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs capitalize text-dn-ink-muted">{a.reason?.trim() || "No reason given"}</p>
                </div>
              </li>
            ))}
      </ol>
    </section>
  );
}
