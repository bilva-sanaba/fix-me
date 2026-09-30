import type { Cart } from "./types";

/**
 * Adapter from the cart CSV (nyc_food_yum_doordash_carts.csv) to our Cart shape.
 *
 * Expected header:
 *   date,time,ordered_by,restaurant,cart_url,reactions_total,reaction_breakdown,thread_replies,slack_link
 *
 * `reaction_breakdown` is space-separated `emoji:count` pairs, e.g. "fire:3 crown:1".
 * The exact post time comes from the Slack permalink (p1759248159455949 → ts
 * 1759248159.455949); if that's missing we fall back to date + "HH:MM PT".
 */

/** Minimal RFC 4180 parser: quoted fields, escaped quotes, CRLF or LF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

function slackTs(link: string): string | undefined {
  const m = link.match(/\/p(\d{10})(\d{6})/);
  return m ? `${m[1]}.${m[2]}` : undefined;
}

/** "2025-09-30" + "09:02 PT" → ISO. Approximates PT as PDT/PST by month. */
function ptToIso(date: string, time: string): string {
  const [h = "0", min = "0"] = time.replace(/\s*PT$/i, "").split(":");
  const month = Number(date.slice(5, 7));
  const offset = month >= 4 && month <= 10 ? "-07:00" : "-08:00";
  return new Date(`${date}T${h.padStart(2, "0")}:${min.padStart(2, "0")}:00${offset}`).toISOString();
}

function parseBreakdown(s: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const pair of s.trim().split(/\s+/).filter(Boolean)) {
    const i = pair.lastIndexOf(":");
    const n = Number(pair.slice(i + 1));
    if (i > 0 && Number.isFinite(n)) out[pair.slice(0, i)] = (out[pair.slice(0, i)] ?? 0) + n;
  }
  return out;
}

const REQUIRED = ["date", "ordered_by", "restaurant"] as const;

export function parseCartsCsv(text: string): Cart[] {
  const [header, ...rows] = parseCsv(text.replace(/^﻿/, ""));
  if (!header) throw new Error("CSV is empty");
  const col = Object.fromEntries(header.map((h, i) => [h.trim().toLowerCase(), i]));
  const missing = REQUIRED.filter((k) => col[k] === undefined);
  if (missing.length) throw new Error(`CSV is missing column(s): ${missing.join(", ")}`);

  const get = (r: string[], k: string) => (col[k] === undefined ? "" : (r[col[k]] ?? "").trim());

  return rows.map((r, i) => {
    const link = get(r, "slack_link");
    const ts = slackTs(link);
    const breakdown = parseBreakdown(get(r, "reaction_breakdown"));
    const total = Number(get(r, "reactions_total"));
    return {
      id: ts ?? `row-${i}`,
      createdBy: get(r, "ordered_by") || "Unknown",
      createdAt: ts ? new Date(Number(ts) * 1000).toISOString() : ptToIso(get(r, "date"), get(r, "time")),
      restaurant: get(r, "restaurant") || "Unknown",
      reactions: Number.isFinite(total) && get(r, "reactions_total") !== ""
        ? total
        : Object.values(breakdown).reduce((a, b) => a + b, 0),
      reactionBreakdown: breakdown,
      url: get(r, "cart_url") || undefined,
    };
  });
}
