import type { Cart } from "./types";

/**
 * Adapter from a Slack channel export to our normalized Cart shape.
 *
 * A standard Slack export is a folder per channel containing one JSON file per
 * day (an array of messages), plus a top-level users.json. This module accepts
 * any of:
 *   - an array of Slack messages (one day file, or several concatenated)
 *   - an object with a `messages` array
 *   - an array of already-normalized Cart objects (round-trips our own format)
 *
 * TODO(griffin): adjust `isCartMessage` / `extractRestaurant` once we see the
 * real export. The heuristics below are guesses at how DoorDash links unfurl.
 */

export interface SlackReaction {
  name: string;
  count: number;
  users?: string[];
}

export interface SlackAttachment {
  title?: string;
  title_link?: string;
  original_url?: string;
  service_name?: string;
  text?: string;
}

/** Subset of a Slack export message that we care about. */
export interface SlackMessage {
  type?: string;
  subtype?: string;
  user?: string;
  user_profile?: { real_name?: string; display_name?: string; name?: string };
  text?: string;
  ts: string;
  reactions?: SlackReaction[];
  attachments?: SlackAttachment[];
}

/** Subset of an entry in a Slack export's users.json. */
export interface SlackUser {
  id: string;
  name?: string;
  real_name?: string;
  profile?: { display_name?: string; real_name?: string };
}

const CART_LINK = /https?:\/\/(?:www\.)?(?:doordash\.com|drd\.sh)\/[^\s>|]+/i;

/** Is this message a cart post (as opposed to chatter, joins, bot noise)? */
export function isCartMessage(m: SlackMessage): boolean {
  if (m.type && m.type !== "message") return false;
  if (m.subtype && m.subtype !== "thread_broadcast") return false;
  return CART_LINK.test(messageHaystack(m));
}

export function extractCartUrl(m: SlackMessage): string | undefined {
  return messageHaystack(m).match(CART_LINK)?.[0];
}

/** Best-effort restaurant name. Tune this against the real export. */
export function extractRestaurant(m: SlackMessage): string {
  // 1. An unfurled DoorDash link usually puts the store name in the attachment title.
  for (const a of m.attachments ?? []) {
    if (a.title) return cleanTitle(a.title);
  }
  // 2. Common phrasing in the message itself: "group order from Sweetgreen".
  const text = m.text ?? "";
  const phrased = text.match(/(?:order|cart)\s+(?:from|at|for)\s+([^:!\n<]+)/i);
  if (phrased) return phrased[1].trim();
  return "Unknown";
}

function cleanTitle(title: string): string {
  return title
    .replace(/^group\s+order\s*[-–|·:]\s*/i, "")
    .replace(/\s*[-–|·]\s*doordash.*$/i, "")
    .trim();
}

function messageHaystack(m: SlackMessage): string {
  const attachmentLinks = (m.attachments ?? []).map(
    (a) => `${a.title_link ?? ""} ${a.original_url ?? ""}`,
  );
  return [m.text ?? "", ...attachmentLinks].join(" ");
}

export function resolveUserName(m: SlackMessage, users: Map<string, SlackUser>): string {
  const inline = m.user_profile;
  if (inline?.display_name) return inline.display_name;
  if (inline?.real_name) return inline.real_name;
  const u = m.user ? users.get(m.user) : undefined;
  return u?.profile?.display_name || u?.profile?.real_name || u?.real_name || u?.name || m.user || "Unknown";
}

export function slackMessageToCart(m: SlackMessage, users: Map<string, SlackUser>): Cart {
  const breakdown: Record<string, number> = {};
  for (const r of m.reactions ?? []) breakdown[r.name] = (breakdown[r.name] ?? 0) + r.count;
  return {
    id: m.ts,
    createdBy: resolveUserName(m, users),
    createdAt: new Date(parseFloat(m.ts) * 1000).toISOString(),
    restaurant: extractRestaurant(m),
    reactions: Object.values(breakdown).reduce((a, b) => a + b, 0),
    reactionBreakdown: breakdown,
    url: extractCartUrl(m),
    text: m.text,
  };
}

export function slackMessagesToCarts(messages: SlackMessage[], users: SlackUser[] = []): Cart[] {
  const userMap = new Map(users.map((u) => [u.id, u]));
  return messages.filter(isCartMessage).map((m) => slackMessageToCart(m, userMap));
}

// ---- Upload handling -------------------------------------------------------

function isCartArray(v: unknown): v is Cart[] {
  return Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && v[0] !== null && "restaurant" in v[0] && "createdAt" in v[0];
}

function isSlackUserArray(v: unknown): v is SlackUser[] {
  return Array.isArray(v) && v.length > 0 && typeof v[0] === "object" && v[0] !== null && "id" in v[0] && "profile" in v[0];
}

function isSlackMessageArray(v: unknown): v is SlackMessage[] {
  return Array.isArray(v) && (v.length === 0 || (typeof v[0] === "object" && v[0] !== null && "ts" in v[0]));
}

/**
 * Parse one or more uploaded JSON documents into carts. Pass everything the
 * user selected; users.json (if present) is used to resolve names.
 */
export function parseUploads(docs: unknown[]): Cart[] {
  const carts: Cart[] = [];
  const messages: SlackMessage[] = [];
  let users: SlackUser[] = [];

  for (const doc of docs) {
    const body = (doc && typeof doc === "object" && "messages" in doc ? (doc as { messages: unknown }).messages : doc);
    if (isCartArray(body)) carts.push(...body);
    else if (isSlackUserArray(body)) users = body;
    else if (isSlackMessageArray(body)) messages.push(...body);
    else throw new Error("Unrecognized JSON shape. Expected a Slack export (array of messages) or an array of carts.");
  }

  carts.push(...slackMessagesToCarts(messages, users));
  // Dedupe by id in case the same day file was uploaded twice.
  const seen = new Set<string>();
  return carts.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
}
