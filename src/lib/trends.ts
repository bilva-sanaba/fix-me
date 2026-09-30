import type { Cart } from "./types";

/** "2026-09" for an ISO timestamp, in the viewer's local time zone. */
export function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "September 2026" for a "2026-09" key. */
export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** "Sep '26" for a "2026-09" key. */
export function monthShort(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

/** The month key one before the given one. */
export function prevMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

/** Sorted list of every month key between the first and last cart, inclusive. */
export function monthRange(carts: Cart[]): string[] {
  if (carts.length === 0) return [];
  const keys = carts.map((c) => monthKey(c.createdAt)).sort();
  const out: string[] = [];
  let k = keys[0];
  const last = keys[keys.length - 1];
  while (k <= last) {
    out.push(k);
    const [y, m] = k.split("-").map(Number);
    k = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  }
  return out;
}

/** name -> monthKey -> cart count */
export function cartsPerMonthBy(carts: Cart[], keyFn: (c: Cart) => string): Map<string, Map<string, number>> {
  const out = new Map<string, Map<string, number>>();
  for (const c of carts) {
    const name = keyFn(c);
    const mk = monthKey(c.createdAt);
    const byMonth = out.get(name) ?? new Map<string, number>();
    byMonth.set(mk, (byMonth.get(mk) ?? 0) + 1);
    out.set(name, byMonth);
  }
  return out;
}

export interface Mover {
  name: string;
  prev: number;
  latest: number;
  delta: number;
}

export interface MoversResult {
  latestKey: string;
  prevKey: string;
  latestLabel: string;
  prevLabel: string;
  /** Sorted by delta descending (biggest riser first, biggest faller last). */
  movers: Mover[];
}

/** Compare each entity's carts in the newest cart's month vs the month before. */
export function movers(carts: Cart[], keyFn: (c: Cart) => string): MoversResult | undefined {
  if (carts.length === 0) return undefined;
  const latestKey = carts.map((c) => monthKey(c.createdAt)).sort().at(-1)!;
  const prevKey = prevMonthKey(latestKey);
  const perMonth = cartsPerMonthBy(carts, keyFn);
  const rows: Mover[] = [];
  for (const [name, byMonth] of perMonth) {
    const prev = byMonth.get(prevKey) ?? 0;
    const latest = byMonth.get(latestKey) ?? 0;
    if (prev === 0 && latest === 0) continue; // not active in either month
    rows.push({ name, prev, latest, delta: latest - prev });
  }
  rows.sort((a, b) => b.delta - a.delta || b.latest - a.latest || a.name.localeCompare(b.name));
  return { latestKey, prevKey, latestLabel: monthLabel(latestKey), prevLabel: monthLabel(prevKey), movers: rows };
}

/** Top N movers by absolute delta, keeping the original order (risers first). */
export function topMovers(rows: Mover[], n: number): Mover[] {
  return [...rows].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || b.latest - a.latest).slice(0, n);
}

export interface MonthSeriesPoint {
  month: string; // short label
  key: string;
  [name: string]: number | string;
}

/** One row per month with a column per named series; missing months are 0. */
export function monthSeries(carts: Cart[], keyFn: (c: Cart) => string, names: string[]): MonthSeriesPoint[] {
  const perMonth = cartsPerMonthBy(carts, keyFn);
  return monthRange(carts).map((key) => {
    const row: MonthSeriesPoint = { month: monthShort(key), key };
    for (const n of names) row[n] = perMonth.get(n)?.get(key) ?? 0;
    return row;
  });
}
