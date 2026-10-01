import { cartsByRestaurant, isUnknownRestaurant } from "./analytics";
import { monthKey, monthRange, monthShort } from "./trends";
import type { Cart } from "./types";

/** Every known restaurant that has had a cart, most carts first. Unknown is left out. */
export function restaurantsIn(carts: Cart[]): { name: string; carts: number }[] {
  return cartsByRestaurant(carts).map((r) => ({ name: r.name, carts: r.carts }));
}

export interface RestaurantStats {
  carts: number;
  /** Distinct people who posted a cart for it. */
  people: number;
  reactions: number;
  replies: number;
  /** 1-based rank by carts among known restaurants in `carts`, ties share a rank. Undefined with no carts. */
  rank?: number;
  /** How many known restaurants had at least one cart in `carts`. */
  restaurants: number;
}

/** Stats for one restaurant, ranked against every known restaurant in the same set of carts. */
export function restaurantStats(carts: Cart[], name: string): RestaurantStats {
  const mine = carts.filter((c) => c.restaurant === name);
  const ranking = cartsByRestaurant(carts);
  const me = ranking.find((r) => r.name === name);
  return {
    carts: mine.length,
    people: new Set(mine.map((c) => c.createdBy)).size,
    reactions: mine.reduce((n, c) => n + c.reactions, 0),
    replies: mine.reduce((n, c) => n + (c.threadReplies ?? 0), 0),
    rank: me ? ranking.filter((r) => r.carts > me.carts).length + 1 : undefined,
    restaurants: ranking.length,
  };
}

export interface ActivityPoint {
  key: string;
  month: string;
  carts: number;
}

/** One restaurant's carts per month across the whole data range, including empty months. */
export function restaurantMonthlyActivity(allCarts: Cart[], name: string): ActivityPoint[] {
  const counts = new Map<string, number>();
  for (const c of allCarts) {
    if (c.restaurant !== name || isUnknownRestaurant(c)) continue;
    const k = monthKey(c.createdAt);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return monthRange(allCarts).map((key) => ({ key, month: monthShort(key), carts: counts.get(key) ?? 0 }));
}
