import type { Cart } from "./types";

export interface PodiumEntry {
  name: string;
  carts: number;
  reactions: number;
}

export interface MonthSummary {
  /** "2026-09" */
  key: string;
  /** "September 2026" */
  label: string;
  totalCarts: number;
  top3: PodiumEntry[];
  /** Most-carted restaurant that month, if any carts. */
  restaurant?: string;
}

export interface HallOfFame {
  mostWins?: { name: string; count: number };
  mostPodiums?: { name: string; count: number };
  currentWinner?: { name: string; carts: number; monthLabel: string };
}

/** Local-time calendar month key for an ISO timestamp, e.g. "2026-09". */
export function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function rank(carts: Cart[], key: (c: Cart) => string): PodiumEntry[] {
  const rows = new Map<string, PodiumEntry>();
  for (const c of carts) {
    const name = key(c);
    const row = rows.get(name) ?? { name, carts: 0, reactions: 0 };
    row.carts += 1;
    row.reactions += c.reactions;
    rows.set(name, row);
  }
  return [...rows.values()].sort((a, b) => b.carts - a.carts || b.reactions - a.reactions || a.name.localeCompare(b.name));
}

/**
 * The last `n` calendar months ending at the newest cart's month, newest first.
 * Each month carries its top 3 cart makers and the restaurant of the month.
 */
export function lastNMonths(carts: Cart[], n = 12): MonthSummary[] {
  if (carts.length === 0) return [];
  const newest = carts.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
  const end = new Date(newest.createdAt);
  let year = end.getFullYear();
  let month = end.getMonth();

  const byMonth = new Map<string, Cart[]>();
  for (const c of carts) {
    const k = monthKey(c.createdAt);
    const arr = byMonth.get(k);
    if (arr) arr.push(c);
    else byMonth.set(k, [c]);
  }

  const out: MonthSummary[] = [];
  for (let i = 0; i < n; i++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    const inMonth = byMonth.get(key) ?? [];
    out.push({
      key,
      label: monthLabel(year, month),
      totalCarts: inMonth.length,
      top3: rank(inMonth, (c) => c.createdBy).slice(0, 3),
      restaurant: rank(inMonth.filter((c) => c.restaurant && !/^unknown$/i.test(c.restaurant)), (c) => c.restaurant)[0]?.name,
    });
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }
  return out;
}

function topCount(counts: Map<string, number>): { name: string; count: number } | undefined {
  let best: { name: string; count: number } | undefined;
  for (const [name, count] of counts) {
    if (!best || count > best.count || (count === best.count && name < best.name)) best = { name, count };
  }
  return best;
}

export function hallOfFame(months: MonthSummary[]): HallOfFame {
  const wins = new Map<string, number>();
  const podiums = new Map<string, number>();
  for (const m of months) {
    m.top3.forEach((p, i) => {
      podiums.set(p.name, (podiums.get(p.name) ?? 0) + 1);
      if (i === 0) wins.set(p.name, (wins.get(p.name) ?? 0) + 1);
    });
  }
  const current = months[0];
  const winner = current?.top3[0];
  return {
    mostWins: topCount(wins),
    mostPodiums: topCount(podiums),
    currentWinner: winner ? { name: winner.name, carts: winner.carts, monthLabel: current.label } : undefined,
  };
}
