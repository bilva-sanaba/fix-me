import type { Cart } from "./types";

export interface RankedRow {
  name: string;
  carts: number;
  reactions: number;
  /** Weekday rows only: how many of that weekday fall inside the data's date range. */
  occurrences?: number;
  /** Weekday rows only: carts / occurrences. */
  avgCarts?: number;
  /** Thread replies, when the ranking is about discussion. */
  replies?: number;
}

export interface Summary {
  totalCarts: number;
  uniqueCreators: number;
  uniqueRestaurants: number;
  totalReactions: number;
  /** Earliest and latest cart dates, ISO. Undefined when there are no carts. */
  range?: { from: string; to: string };
}

export function summarize(carts: Cart[]): Summary {
  const sorted = [...carts].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return {
    totalCarts: carts.length,
    uniqueCreators: new Set(carts.map((c) => c.createdBy)).size,
    uniqueRestaurants: new Set(carts.map((c) => c.restaurant)).size,
    totalReactions: carts.reduce((n, c) => n + c.reactions, 0),
    range: sorted.length ? { from: sorted[0].createdAt, to: sorted[sorted.length - 1].createdAt } : undefined,
  };
}

export interface MonthSlice {
  /** e.g. "September 2026" */
  label: string;
  carts: Cart[];
}

/** The carts from the calendar month of the most recent cart (viewer's local time). */
export function latestMonth(carts: Cart[]): MonthSlice | undefined {
  if (carts.length === 0) return undefined;
  const newest = carts.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
  const d = new Date(newest.createdAt);
  const year = d.getFullYear();
  const month = d.getMonth();
  const inMonth = carts.filter((c) => {
    const x = new Date(c.createdAt);
    return x.getFullYear() === year && x.getMonth() === month;
  });
  return { label: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }), carts: inMonth };
}

function rankBy(carts: Cart[], key: (c: Cart) => string): RankedRow[] {
  const rows = new Map<string, RankedRow>();
  for (const c of carts) {
    const name = key(c);
    const row = rows.get(name) ?? { name, carts: 0, reactions: 0 };
    row.carts += 1;
    row.reactions += c.reactions;
    rows.set(name, row);
  }
  return [...rows.values()].sort((a, b) => b.carts - a.carts || b.reactions - a.reactions || a.name.localeCompare(b.name));
}

/** Who makes the most carts. */
export function cartsByCreator(carts: Cart[]): RankedRow[] {
  return rankBy(carts, (c) => c.createdBy);
}

/** Which restaurants get the most carts. Unknown restaurants are left out; they would dwarf everything. */
export function cartsByRestaurant(carts: Cart[]): RankedRow[] {
  return rankBy(carts.filter((c) => !isUnknownRestaurant(c)), (c) => c.restaurant);
}

/** Which carts get the most reactions. */
export function topReactedCarts(carts: Cart[], limit = 10): Cart[] {
  return [...carts].sort((a, b) => b.reactions - a.reactions || b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7; // Monday = 0

/**
 * Carts and reactions per weekday, Monday first, in the viewer's local time zone.
 * Also computes the average carts per weekday: total carts on that weekday divided by
 * how many times that weekday occurs between the first and last cart (inclusive).
 */
export function cartsByDayOfWeek(carts: Cart[]): RankedRow[] {
  const rows: RankedRow[] = DAYS.map((name) => ({ name, carts: 0, reactions: 0, occurrences: 0, avgCarts: 0 }));
  if (carts.length === 0) return rows;

  let first = Infinity;
  let last = -Infinity;
  for (const c of carts) {
    const d = new Date(c.createdAt);
    first = Math.min(first, d.getTime());
    last = Math.max(last, d.getTime());
    const row = rows[weekdayIndex(d)];
    row.carts += 1;
    row.reactions += c.reactions;
  }

  const cursor = new Date(first);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(last);
  end.setHours(0, 0, 0, 0);
  for (; cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    rows[weekdayIndex(cursor)].occurrences! += 1;
  }
  for (const r of rows) r.avgCarts = r.occurrences ? r.carts / r.occurrences : 0;
  return rows;
}

/** Carts per hour of day (0-23), local time. Handy for "when do people order". */
export function cartsByHour(carts: Cart[]): RankedRow[] {
  const rows: RankedRow[] = Array.from({ length: 24 }, (_, h) => ({ name: `${h}:00`, carts: 0, reactions: 0 }));
  for (const c of carts) {
    const row = rows[new Date(c.createdAt).getHours()];
    row.carts += 1;
    row.reactions += c.reactions;
  }
  return rows;
}

export interface Combo {
  createdBy: string;
  restaurant: string;
  /** Carts this person made from this restaurant. */
  carts: number;
  /** All carts this person made, for "X% of their carts". */
  personTotal: number;
}

/** The person + restaurant pair with the most carts. Tells us who always orders from the same place. */
export function topCombo(carts: Cart[]): Combo | undefined {
  const pairs = new Map<string, Combo>();
  const perPerson = new Map<string, number>();
  for (const c of carts) {
    // A missing restaurant isn't a combo; skip so "Someone · Unknown" can't win.
    if (!c.restaurant || /^unknown$/i.test(c.restaurant.trim())) continue;
    perPerson.set(c.createdBy, (perPerson.get(c.createdBy) ?? 0) + 1);
    const key = `${c.createdBy}\u0000${c.restaurant}`;
    const row = pairs.get(key) ?? { createdBy: c.createdBy, restaurant: c.restaurant, carts: 0, personTotal: 0 };
    row.carts += 1;
    pairs.set(key, row);
  }
  let best: Combo | undefined;
  for (const row of pairs.values()) {
    row.personTotal = perPerson.get(row.createdBy) ?? row.carts;
    if (!best || row.carts > best.carts || (row.carts === best.carts && row.carts / row.personTotal > best.carts / best.personTotal)) best = row;
  }
  return best;
}

/** True for carts whose restaurant we couldn't identify. */
export const isUnknownRestaurant = (c: Cart) => !c.restaurant || /^unknown$/i.test(c.restaurant.trim());

export interface MonthOption {
  /** "2026-09" */
  key: string;
  /** "September 2026" */
  label: string;
}

const monthKeyOf = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/** Every calendar month present in the data, newest first (viewer's local time). */
export function monthsIn(carts: Cart[]): MonthOption[] {
  const keys = new Set(carts.map((c) => monthKeyOf(c.createdAt)));
  return [...keys]
    .sort()
    .reverse()
    .map((key) => {
      const [y, m] = key.split("-").map(Number);
      return { key, label: new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" }) };
    });
}

export function cartsInMonth(carts: Cart[], key: string): Cart[] {
  return carts.filter((c) => monthKeyOf(c.createdAt) === key);
}
