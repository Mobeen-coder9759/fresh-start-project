import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, LayoutDashboard, LogOut, Menu, Settings, Users, X } from "lucide-react";
import { Toaster } from "sonner";
import { useAuth } from "@/lib/auth";
import { canAccess, type Page } from "@/lib/appointments";
import { SettingsProvider } from "@/lib/settings";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

const NAV: { to: "/dashboard" | "/appointments" | "/patients" | "/settings"; label: string; page: Page; icon: typeof Users }[] = [
  { to: "/dashboard", label: "Dashboard", page: "dashboard", icon: LayoutDashboard },
  { to: "/appointments", label: "Appointments", page: "appointments", icon: CalendarDays },
  { to: "/patients", label: "Patients", page: "patients", icon: Users },
  { to: "/settings", label: "Settings", page: "settings", icon: Settings },
];

function AppLayout() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/", replace: true });
  }, [ready, user, navigate]);
  useEffect(() => setOpen(false), [pathname]);

  if (!user) return <div className="min-h-dvh bg-dn-bg" />;

  const items = NAV.filter((n) => canAccess(user.role, n.page));
  const title = NAV.find((n) => pathname.startsWith(n.to))?.label ?? "Dashboard";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const onLogout = () => {
    logout();
    navigate({ to: "/", replace: true });
  };

  return (
    <SettingsProvider>
      <TooltipProvider>
        <Toaster richColors position="top-right" />
        <div className="flex min-h-dvh bg-dn-bg font-body text-dn-ink">
          {open && <button aria-label="Close menu" className="fixed inset-0 z-30 bg-dn-ink/30 lg:hidden" onClick={() => setOpen(false)} />}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-dn-card p-5 shadow-lg transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 lg:shadow-none",
              open ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold tracking-tight">Dental Desk</span>
              <button className="lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)}><X className="size-5" /></button>
            </div>
            <nav className="mt-8 flex flex-col gap-1">
              {items.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-dn-ink-muted transition-colors hover:text-dn-ink"
                  activeProps={{ className: "!bg-dn-accent !text-dn-accent-foreground shadow-md shadow-dn-accent/30" }}
                >
                  <n.icon className="size-4" /> {n.label}
                </Link>
              ))}
            </nav>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center gap-3 border-b border-dn-line px-4 py-4 sm:px-8">
              <button className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="size-5" /></button>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold">{title}</h1>
                <p className="text-xs text-dn-ink-muted">{today}</p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-2xl px-2 py-1.5 text-left hover:bg-dn-card">
                    <span className="grid size-9 place-items-center rounded-full bg-dn-accent text-sm font-semibold text-dn-accent-foreground">
                      {user.name.replace("Dr. ", "").charAt(0)}
                    </span>
                    <span className="hidden leading-tight sm:block">
                      <span className="block text-sm font-semibold">{user.name}</span>
                      <span className="block text-xs capitalize text-dn-ink-muted">{user.role}</span>
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onSelect={onLogout}>Log out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button onClick={onLogout} className="flex items-center gap-1.5 rounded-2xl bg-dn-accent px-3.5 py-2 text-sm font-medium text-dn-accent-foreground hover:opacity-90">
                  <LogOut className="size-4" /> <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </header>
            <main className="flex-1 px-4 py-6 sm:px-8">
              <Outlet />
            </main>
          </div>
        </div>
      </TooltipProvider>
    </SettingsProvider>
  );
}
