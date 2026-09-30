import type { RankedRow } from "./analytics";
import type { Cart } from "./types";

/**
 * "Controversial" carts: lots of thread replies relative to reactions. A cart
 * everyone likes collects emoji; a cart people argue about collects replies.
 * Replies can also just be "add me!", so the UI calls this "most discussed".
 */

/** Carts need at least this many replies to count, so one stray reply doesn't top the list. */
export const MIN_REPLIES = 3;

/**
 * Clear disapproval. Sad faces (cry, sob, crying-pepe) are left out on purpose:
 * in this channel they usually mean "I missed the cart", not "I hate this".
 */
const DISAPPROVAL = new Set([
  "x", "-1", "thumbsdown", "heavy_multiplication_x", "no_entry_sign", "rat", "cockroach", "middle_finger",
  "broken_heart", "disappointed", "man-facepalming", "facepalm", "troll", "shaking-fist", "frog-fight",
  "gremlin-ohno", "noooo", "confused-2", "face_vomiting", "nauseated_face", "unamused", "rolling_eyes",
]);

const APPROVAL = new Set([
  "raised_hands", "fire", "fire_on_fire", "heart", "+1", "thumbsup", "plus_one", "crown", "heart_hands",
  "heart_on_fire", "sparkling_heart", "heart_eyes", "goat", "clap", "100", "yum", "drooling_face", "lfg",
  "chefs-kiss", "fieri_chefkiss", "white_check_mark", "yesgreen", "blob-heart", "meow_heart", "perfect",
]);

/** Replies per reaction, smoothed so a cart with zero reactions still ranks by replies. */
export function controversyScore(c: Cart): number {
  return (c.threadReplies ?? 0) / (c.reactions + 1);
}

/** The cart got both approving and disapproving emoji. */
export function isSplit(c: Cart): boolean {
  const names = Object.keys(c.reactionBreakdown);
  return names.some((n) => APPROVAL.has(n)) && names.some((n) => DISAPPROVAL.has(n));
}

export function mostControversial(carts: Cart[], limit = 10): Cart[] {
  return carts
    .filter((c) => (c.threadReplies ?? 0) >= MIN_REPLIES)
    .sort((a, b) => controversyScore(b) - controversyScore(a) || (b.threadReplies ?? 0) - (a.threadReplies ?? 0) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

/** Total thread replies per person or restaurant. `reactions` stays reactions so the table can compare. */
export function rankByReplies(carts: Cart[], key: (c: Cart) => string): RankedRow[] {
  const rows = new Map<string, RankedRow>();
  for (const c of carts) {
    const name = key(c);
    const row = rows.get(name) ?? { name, carts: 0, reactions: 0, replies: 0 };
    row.carts += 1;
    row.reactions += c.reactions;
    row.replies = (row.replies ?? 0) + (c.threadReplies ?? 0);
    rows.set(name, row);
  }
  return [...rows.values()]
    .filter((r) => (r.replies ?? 0) > 0)
    .sort((a, b) => (b.replies ?? 0) - (a.replies ?? 0) || a.carts - b.carts || a.name.localeCompare(b.name));
}

export interface ControversySummary {
  totalReplies: number;
  /** Carts with at least MIN_REPLIES replies. */
  discussedCarts: number;
  splitCarts: number;
}

export function controversySummary(carts: Cart[]): ControversySummary {
  return {
    totalReplies: carts.reduce((n, c) => n + (c.threadReplies ?? 0), 0),
    discussedCarts: carts.filter((c) => (c.threadReplies ?? 0) >= MIN_REPLIES).length,
    splitCarts: carts.filter(isSplit).length,
  };
}
