import type { Cart } from "./types";

export interface RankedRow {
  name: string;
  carts: number;
  reactions: number;
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

/** Which restaurants get the most carts. */
export function cartsByRestaurant(carts: Cart[]): RankedRow[] {
  return rankBy(carts, (c) => c.restaurant);
}

/** Which carts get the most reactions. */
export function topReactedCarts(carts: Cart[], limit = 10): Cart[] {
  return [...carts].sort((a, b) => b.reactions - a.reactions || b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Carts and reactions per weekday, Monday first, in the viewer's local time zone. */
export function cartsByDayOfWeek(carts: Cart[]): RankedRow[] {
  const rows: RankedRow[] = DAYS.map((name) => ({ name, carts: 0, reactions: 0 }));
  for (const c of carts) {
    const jsDay = new Date(c.createdAt).getDay(); // 0 = Sun
    const row = rows[(jsDay + 6) % 7];
    row.carts += 1;
    row.reactions += c.reactions;
  }
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
