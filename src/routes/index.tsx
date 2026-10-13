import { createFileRoute } from "@tanstack/react-router";
import { Search, Plus, LayoutGrid, Handshake, Users, TrendingUp, BarChart3 } from "lucide-react";

import { activity, deals, formatValue, kpis, stages, type Stage } from "@/lib/crm-data";
import avatarNora from "@/assets/avatar-nora.jpg";
import avatarPriya from "@/assets/avatar-priya.jpg";
import avatarMarcus from "@/assets/avatar-marcus.jpg";
import avatarElena from "@/assets/avatar-elena.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vellum — Sales CRM Dashboard" },
      { name: "description", content: "Track your sales pipeline, contacts, and revenue in one frosted-glass dashboard." },
      { property: "og:title", content: "Vellum — Sales CRM Dashboard" },
      { property: "og:description", content: "Track your sales pipeline, contacts, and revenue in one frosted-glass dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const navItems = [
  { label: "Pipeline", icon: LayoutGrid, active: true },
  { label: "Deals", icon: Handshake, active: false },
  { label: "Contacts", icon: Users, active: false },
  { label: "Forecast", icon: TrendingUp, active: false },
  { label: "Reports", icon: BarChart3, active: false },
];

const contacts = [
  { name: "Priya Raman", role: "Procurement · Northwind", status: "active", avatar: avatarPriya },
  { name: "Marcus Bell", role: "Marketing VP · Halcyon", status: "review", avatar: avatarMarcus },
  { name: "Elena Foss", role: "Ops Lead · Meridian", status: "active", avatar: avatarElena },
];

const stageTotals = stages.map((stage) => {
  const inStage = deals.filter((d) => d.stage === stage);
  return { stage, count: inStage.length, total: inStage.reduce((s, d) => s + d.value, 0) };
});

function stageLabelClass(stage: Stage) {
  return stage === "Won" ? "text-signal" : "text-cool";
}

function Index() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-canvas font-body text-ink antialiased">
      {/* ambient blobs */}
      <div className="pointer-events-none absolute -top-40 -left-24 h-[520px] w-[520px] rounded-full bg-cool/25 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-[460px] w-[460px] rounded-full bg-signal/20 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-[380px] w-[600px] rounded-full bg-card/50 blur-[120px]" />

      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="glass sticky top-0 z-20 hidden w-[236px] shrink-0 flex-col border-r border-line/10 p-5 lg:flex">
          <div className="flex items-center gap-2.5 px-1">
            <div className="grid size-9 place-items-center rounded-[11px] bg-ink font-display text-[15px] font-bold text-primary-foreground">
              V
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Vellum</span>
          </div>
          <nav className="mt-7 flex flex-col gap-1 text-sm">
            {navItems.map((item) => (
              <a
                key={item.label}
                href="#"
                onClick={(e) => e.preventDefault()}
                className={
                  item.active
                    ? "sheen flex items-center gap-3 rounded-[10px] bg-card/70 px-3 py-2 font-medium ring-1 ring-line/10"
                    : "flex items-center gap-3 rounded-[10px] px-3 py-2 text-muted-foreground transition-colors hover:text-ink"
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-auto rounded-[14px] bg-card/60 p-3 ring-1 ring-line/10">
            <div className="flex items-center gap-2.5">
              <img
                src={avatarNora}
                alt="Nora Vance"
                width={816}
                height={816}
                loading="lazy"
                className="size-9 rounded-full object-cover outline-1 -outline-offset-1 outline-line/10"
              />
              <div className="leading-tight">
                <p className="text-sm font-semibold">Nora Vance</p>
                <p className="font-mono text-[11px] text-muted-foreground">Revenue lead</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Top bar */}
          <header className="glass sticky top-0 z-10 flex items-center gap-4 border-b border-line/10 px-6 py-3.5">
            <div className="flex w-full max-w-md items-center gap-2.5 rounded-full bg-card/70 px-3.5 py-2 ring-1 ring-line/10">
              <Search className="size-4 text-muted-foreground" />
              <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                placeholder="Search deals, contacts, companies"
              />
              <span className="font-mono text-[10px] text-muted-foreground">⌘K</span>
            </div>
            <span className="ml-auto hidden font-mono text-[11px] text-muted-foreground sm:block">
              Q3 · 12 deals live
            </span>
            <button className="sheen lift rounded-full bg-ink px-4 py-2 text-sm font-medium text-primary-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Plus className="size-4" /> New deal
              </span>
            </button>
          </header>

          <main className="space-y-6 px-6 py-6">
            {/* KPI cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((kpi, i) => (
                <div
                  key={kpi.label}
                  className="glass lift animate-rise rounded-[18px] p-5 ring-1 ring-line/10"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {kpi.label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-bold tracking-tight">{kpi.value}</p>
                  <p
                    className={`mt-1 font-mono text-[11px] ${kpi.tone === "signal" ? "text-signal" : "text-muted-foreground"}`}
                  >
                    {kpi.delta}
                  </p>
                </div>
              ))}
            </section>

            {/* Pipeline kanban */}
            <section className="animate-rise" style={{ animationDelay: "240ms" }}>
              <h2 className="font-display text-xl font-bold tracking-tight">Pipeline</h2>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stageTotals.map(({ stage, count, total }) => (
                  <div key={stage} className="glass rounded-[18px] p-3 ring-1 ring-line/10">
                    <div className="flex items-center justify-between px-1 pb-2">
                      <span
                        className={`font-mono text-[11px] uppercase tracking-[0.14em] ${stageLabelClass(stage)}`}
                      >
                        {stage}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {count} · {formatValue(total)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {deals
                        .filter((d) => d.stage === stage)
                        .map((deal) => (
                          <div key={deal.id} className="lift rounded-[14px] bg-card/75 p-3 ring-1 ring-line/10">
                            <p className="text-sm font-semibold">{deal.company}</p>
                            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                              {formatValue(deal.value)} · {deal.owner}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Contacts + Activity */}
            <section
              className="grid animate-rise grid-cols-1 gap-4 lg:grid-cols-5"
              style={{ animationDelay: "300ms" }}
            >
              <div className="glass rounded-[18px] p-5 ring-1 ring-line/10 lg:col-span-3">
                <h2 className="font-display text-lg font-bold tracking-tight">Contacts</h2>
                <div className="mt-3 divide-y divide-line/10">
                  {contacts.map((c) => (
                    <div key={c.name} className="lift flex items-center gap-3 py-2.5">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        width={816}
                        height={816}
                        loading="lazy"
                        className="size-9 rounded-full object-cover outline-1 -outline-offset-1 outline-line/10"
                      />
                      <div className="leading-tight">
                        <p className="text-sm font-semibold">{c.name}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">{c.role}</p>
                      </div>
                      <span
                        className={`ml-auto font-mono text-[11px] ${c.status === "active" ? "text-signal" : "text-muted-foreground"}`}
                      >
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass rounded-[18px] p-5 ring-1 ring-line/10 lg:col-span-2">
                <h2 className="font-display text-lg font-bold tracking-tight">Activity</h2>
                <div className="mt-3 space-y-3">
                  {activity.map((a) => (
                    <div key={a.id} className="flex gap-2.5">
                      <span
                        className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                          a.tone === "signal" ? "bg-signal" : a.tone === "cool" ? "bg-cool" : "bg-muted-foreground"
                        }`}
                      />
                      <p className="text-sm text-pretty">
                        <span className="font-semibold">{a.actor}</span> {a.action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
