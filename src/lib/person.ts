import { cartsByCreator, isUnknownRestaurant } from "./analytics";
import { monthKey, monthRange, monthShort } from "./trends";
import type { Cart } from "./types";

/** Everyone who has posted a cart, most carts first. */
export function peopleIn(carts: Cart[]): { name: string; carts: number }[] {
  return cartsByCreator(carts).map((r) => ({ name: r.name, carts: r.carts }));
}

export interface PersonStats {
  carts: number;
  /** Distinct known restaurants. */
  restaurants: number;
  reactions: number;
  replies: number;
  /** 1-based rank by carts among everyone in `carts`, ties share a rank. Undefined with no carts. */
  rank?: number;
  /** How many people posted at least one cart in `carts`. */
  people: number;
}

/** Stats for one person, ranked against everyone in the same set of carts. */
export function personStats(carts: Cart[], name: string): PersonStats {
  const mine = carts.filter((c) => c.createdBy === name);
  const ranking = cartsByCreator(carts);
  const me = ranking.find((r) => r.name === name);
  return {
    carts: mine.length,
    restaurants: new Set(mine.filter((c) => !isUnknownRestaurant(c)).map((c) => c.restaurant)).size,
    reactions: mine.reduce((n, c) => n + c.reactions, 0),
    replies: mine.reduce((n, c) => n + (c.threadReplies ?? 0), 0),
    rank: me ? ranking.filter((r) => r.carts > me.carts).length + 1 : undefined,
    people: ranking.length,
  };
}

export interface ActivityPoint {
  key: string;
  month: string;
  carts: number;
}

/** One person's carts per month across the whole data range, including empty months. */
export function monthlyActivity(allCarts: Cart[], name: string): ActivityPoint[] {
  const counts = new Map<string, number>();
  for (const c of allCarts) {
    if (c.createdBy !== name) continue;
    const k = monthKey(c.createdAt);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return monthRange(allCarts).map((key) => ({ key, month: monthShort(key), carts: counts.get(key) ?? 0 }));
}
