export type Stage = "Lead" | "Qualified" | "Proposal" | "Won";

export interface Deal {
  id: string;
  company: string;
  value: number; // in USD
  owner: string;
  stage: Stage;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  status: "active" | "review";
  avatar: string;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  tone: "signal" | "cool" | "muted";
}

export const stages: Stage[] = ["Lead", "Qualified", "Proposal", "Won"];

export const deals: Deal[] = [
  { id: "d1", company: "Northwind Traders", value: 80000, owner: "Priya Raman", stage: "Lead" },
  { id: "d2", company: "Cascade Freight", value: 45000, owner: "Dana Cole", stage: "Lead" },
  { id: "d3", company: "Halcyon Media", value: 120000, owner: "Marcus Bell", stage: "Qualified" },
  { id: "d4", company: "Meridian Health", value: 160000, owner: "Elena Foss", stage: "Proposal" },
  { id: "d5", company: "Atlas Robotics", value: 180000, owner: "J. Whitfield", stage: "Won" },
];

export const kpis = [
  { label: "Pipeline value", value: "$1.24M", delta: "▲ 8.4% vs Q2", tone: "signal" as const },
  { label: "Win rate", value: "34.2%", delta: "▲ 2.1 pts", tone: "signal" as const },
  { label: "Deals won", value: "18", delta: "this quarter", tone: "muted" as const },
  { label: "Avg cycle", value: "41d", delta: "▼ 6 days faster", tone: "signal" as const },
];

export const activity: ActivityItem[] = [
  { id: "a1", actor: "J. Whitfield", action: "moved Atlas Robotics to Won.", tone: "signal" },
  { id: "a2", actor: "Elena Foss", action: "opened the proposal draft.", tone: "cool" },
  { id: "a3", actor: "Dana Cole", action: "logged a discovery call.", tone: "muted" },
];

export function formatValue(v: number) {
  return v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`;
}
