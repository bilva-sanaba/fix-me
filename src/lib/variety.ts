import { isUnknownRestaurant } from "./analytics";
import type { Cart } from "./types";

/**
 * Restaurant variety per person: explorers who spread carts across many places
 * vs. regulars who keep ordering from the same spot. Unknown restaurants are
 * left out. Restaurant names are used as-is, so name variants of one place
 * ("35 West" / "Sushi 35 West") count as different restaurants.
 */

/** Minimum known-restaurant carts to be ranked, so 3 carts at 3 places doesn't top the list. */
export const MIN_CARTS_ALL_TIME = 15;
export const MIN_CARTS_MONTH = 3;

export interface PersonVariety {
  name: string;
  /** Carts with a known restaurant. */
  carts: number;
  /** Distinct restaurants ordered from. */
  restaurants: number;
  /**
   * Effective number of restaurants (exp of Shannon entropy): how many places
   * they'd be rotating between if they split carts evenly. 10 carts at 10
   * places = 10; 9 at one place and 1 elsewhere ≈ 1.4.
   */
  regularSpots: number;
  topRestaurant: string;
  topCount: number;
  /** topCount / carts, 0-1. */
  topShare: number;
}

export function personVariety(carts: Cart[], minCarts: number): PersonVariety[] {
  const byPerson = new Map<string, Map<string, number>>();
  for (const c of carts) {
    if (isUnknownRestaurant(c)) continue;
    const spots = byPerson.get(c.createdBy) ?? new Map<string, number>();
    spots.set(c.restaurant, (spots.get(c.restaurant) ?? 0) + 1);
    byPerson.set(c.createdBy, spots);
  }

  const rows: PersonVariety[] = [];
  for (const [name, spots] of byPerson) {
    const counts = [...spots.values()];
    const n = counts.reduce((a, b) => a + b, 0);
    if (n < minCarts) continue;
    const entropy = -counts.reduce((h, k) => h + (k / n) * Math.log(k / n), 0);
    const [topRestaurant, topCount] = [...spots].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    rows.push({ name, carts: n, restaurants: spots.size, regularSpots: Math.exp(entropy), topRestaurant, topCount, topShare: topCount / n });
  }
  return rows.sort((a, b) => b.regularSpots - a.regularSpots || b.carts - a.carts || a.name.localeCompare(b.name));
}

/** Most loyal first: highest share of carts from one restaurant. People with no repeat restaurant aren't regulars, so they're left out. */
export function byLoyalty(rows: PersonVariety[]): PersonVariety[] {
  return rows.filter((r) => r.topCount > 1).sort((a, b) => b.topShare - a.topShare || b.topCount - a.topCount || a.name.localeCompare(b.name));
}

export function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
