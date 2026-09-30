import type { RankedRow } from "./analytics";
import type { Cart } from "./types";

/**
 * Emoji reaction analysis. Slack gives us shortcodes ("fire", "+1"), and many are
 * custom workspace emoji we can't render, so we show the unicode glyph when we
 * know it and fall back to the :shortcode: (e.g. ":lol-yellow:").
 */

const GLYPHS: Record<string, string> = {
  "+1": "👍", thumbsup: "👍", "-1": "👎", fire: "🔥", heart: "❤️", heart_on_fire: "❤️‍🔥", eyes: "👀", lock: "🔒",
  raised_hands: "🙌", pray: "🙏", clap: "👏", joy: "😂", rolling_on_the_floor_laughing: "🤣", drooling_face: "🤤",
  yum: "😋", cry: "😢", sob: "😭", disappointed: "😞", smiling_face_with_tear: "🥲", white_check_mark: "✅",
  x: "❌", goat: "🐐", rat: "🐀", crown: "👑", pinching_hand: "🤏", nail_care: "💅", leafy_green: "🥬",
  broken_heart: "💔", skull: "💀", "100": "💯", tada: "🎉", sushi: "🍣", pizza: "🍕", taco: "🌮", burrito: "🌯",
};

export function emojiLabel(name: string): string {
  const glyph = GLYPHS[name];
  return glyph ?? `:${name}:`;
}

/** Each emoji ranked by total uses. `carts` is how many carts it appeared on. */
export function emojiUsage(carts: Cart[]): RankedRow[] {
  const rows = new Map<string, RankedRow>();
  for (const c of carts) {
    for (const [name, n] of Object.entries(c.reactionBreakdown)) {
      const row = rows.get(name) ?? { name, carts: 0, reactions: 0 };
      row.carts += 1;
      row.reactions += n;
      rows.set(name, row);
    }
  }
  return [...rows.values()]
    .sort((a, b) => b.reactions - a.reactions || b.carts - a.carts || a.name.localeCompare(b.name))
    .map((r) => ({ ...r, name: emojiLabel(r.name) }));
}

/** Rank people or restaurants by reactions received rather than carts posted. */
export function rankByReactions(carts: Cart[], key: (c: Cart) => string): RankedRow[] {
  const rows = new Map<string, RankedRow>();
  for (const c of carts) {
    const name = key(c);
    const row = rows.get(name) ?? { name, carts: 0, reactions: 0 };
    row.carts += 1;
    row.reactions += c.reactions;
    rows.set(name, row);
  }
  return [...rows.values()]
    .filter((r) => r.reactions > 0)
    .sort((a, b) => b.reactions - a.reactions || a.carts - b.carts || a.name.localeCompare(b.name));
}

export interface EmojiSummary {
  totalReactions: number;
  distinctEmojis: number;
  cartsWithReactions: number;
  totalCarts: number;
  top?: { name: string; count: number };
}

export function emojiSummary(carts: Cart[]): EmojiSummary {
  const usage = emojiUsage(carts);
  return {
    totalReactions: carts.reduce((n, c) => n + c.reactions, 0),
    distinctEmojis: usage.length,
    cartsWithReactions: carts.filter((c) => c.reactions > 0).length,
    totalCarts: carts.length,
    top: usage[0] && { name: usage[0].name, count: usage[0].reactions },
  };
}

export interface SignatureEmoji {
  person: string;
  /** The emoji this person's carts received most, already labeled. */
  emoji: string;
  count: number;
  /** All reactions this person's carts received. */
  reactions: number;
  carts: number;
}

/** Each person's most-received emoji, for people whose carts got any reactions. */
export function signatureEmojis(carts: Cart[]): SignatureEmoji[] {
  const byPerson = new Map<string, { carts: number; reactions: number; emojis: Map<string, number> }>();
  for (const c of carts) {
    const p = byPerson.get(c.createdBy) ?? { carts: 0, reactions: 0, emojis: new Map() };
    p.carts += 1;
    p.reactions += c.reactions;
    for (const [name, n] of Object.entries(c.reactionBreakdown)) p.emojis.set(name, (p.emojis.get(name) ?? 0) + n);
    byPerson.set(c.createdBy, p);
  }
  const out: SignatureEmoji[] = [];
  for (const [person, p] of byPerson) {
    const [top] = [...p.emojis].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (top) out.push({ person, emoji: emojiLabel(top[0]), count: top[1], reactions: p.reactions, carts: p.carts });
  }
  return out.sort((a, b) => b.reactions - a.reactions || a.person.localeCompare(b.person));
}
