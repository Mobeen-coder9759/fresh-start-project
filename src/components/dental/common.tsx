import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { canAccess, type Page, type Status } from "@/lib/appointments";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const STATUS_CLS: Record<Status, string> = {
  Upcoming: "bg-dn-accent text-dn-accent-foreground",
  Rescheduled: "bg-dn-resched/15 text-dn-resched ring-1 ring-dn-resched/40",
  Cancelled: "bg-dn-cancel/15 text-dn-cancel ring-1 ring-dn-cancel/40",
  Completed: "bg-dn-done/15 text-dn-done ring-1 ring-dn-done/40",
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_CLS[status])}>{status}</span>;
}

export function RequirePage({ page, children }: { page: Page; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;
  if (!canAccess(user.role, page)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="py-14 text-center">
      <p className="font-semibold text-dn-ink">{title}</p>
      {hint && <p className="mt-1 text-sm text-dn-ink-muted">{hint}</p>}
    </div>
  );
}

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 border-b border-dn-line py-2.5 text-sm">
      <span className="text-dn-ink-muted">{label}</span>
      <span className="break-words text-dn-ink">{value}</span>
    </div>
  );
}
