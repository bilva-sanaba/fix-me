import { useMemo } from "react";
import { MonthPicker, useMonthScope } from "../components/MonthPicker";
import { StatTile } from "../components/StatTile";
import { RankedBarCard } from "../components/RankedBarCard";
import { emojiLabel, emojiSummary, emojiUsage, rankByReactions, signatureEmojis } from "../lib/emoji";
import { controversySummary, isSplit, MIN_REPLIES, mostControversial, rankByReplies } from "../lib/controversy";
import { isUnknownRestaurant } from "../lib/analytics";
import type { Cart } from "../lib/types";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const fmtBreakdown = (b: Record<string, number>) =>
  Object.entries(b)
    .sort((a, z) => z[1] - a[1])
    .map(([name, n]) => `${emojiLabel(name)} ${n}`)
    .join("  ");

/** Which emojis people react to carts with, whose carts collect them, and which carts start arguments. */
export function ReactionsPage({ carts }: { carts: Cart[] }) {
  const scope = useMonthScope(carts);
  const { label, scoped, scopeNote } = scope;
  const summary = useMemo(() => emojiSummary(scoped), [scoped]);
  const usage = useMemo(() => emojiUsage(scoped), [scoped]);
  const byPerson = useMemo(() => rankByReactions(scoped, (c) => c.createdBy), [scoped]);
  const known = useMemo(() => scoped.filter((c) => !isUnknownRestaurant(c)), [scoped]);
  const byRestaurant = useMemo(() => rankByReactions(known, (c) => c.restaurant), [known]);
  const signatures = useMemo(() => signatureEmojis(scoped), [scoped]);
  const debate = useMemo(() => controversySummary(scoped), [scoped]);
  const controversial = useMemo(() => mostControversial(scoped, 10), [scoped]);
  const repliesByPerson = useMemo(() => rankByReplies(scoped, (c) => c.createdBy), [scoped]);
  const repliesByRestaurant = useMemo(() => rankByReplies(known, (c) => c.restaurant), [known]);
  const pct = summary.totalCarts ? Math.round((summary.cartsWithReactions / summary.totalCarts) * 100) : 0;

  return (
    <>
      <section>
        <div className="section-head">
          <h2>Emoji reactions</h2>
          <MonthPicker scope={scope} />
        </div>
        <div className="tiles">
          <StatTile label="Emoji reactions" value={summary.totalReactions} hint={summary.totalCarts ? `${(summary.totalReactions / summary.totalCarts).toFixed(1)} per cart` : undefined} accent="var(--amber)" />
          <StatTile label="Distinct emojis" value={summary.distinctEmojis} accent="var(--violet)" />
          <StatTile label="Carts with a reaction" value={`${pct}%`} hint={`${summary.cartsWithReactions} of ${summary.totalCarts} carts`} accent="var(--teal)" />
          <StatTile label="Most-used emoji" value={summary.top?.name ?? "–"} hint={summary.top ? `${summary.top.count} uses` : undefined} accent="var(--coral)" />
        </div>
      </section>

      <section className="grid">
        <RankedBarCard title="Most-used emojis" description={`Total uses per emoji, ${scopeNote} · table shows how many carts each appeared on`} rows={usage} metric="reactions" color="var(--amber)" />
        <RankedBarCard title="Whose carts get the most reactions" description={`Total emoji reactions on each person's carts, ${scopeNote}`} rows={byPerson} metric="reactions" color="var(--coral)" />
        <RankedBarCard title="Most-reacted restaurants" description={`Total emoji reactions on carts from each restaurant, ${scopeNote}`} rows={byRestaurant} metric="reactions" color="var(--violet)" />

        <div className="card" style={{ "--card-accent": "var(--teal)" } as React.CSSProperties}>
          <div className="card-head">
            <div>
              <h2>Signature emojis</h2>
              <div className="desc">The emoji each person's carts receive most, {scopeNote} · uses of it vs. total reactions</div>
            </div>
          </div>
          {signatures.length === 0 ? (
            <div className="empty">No reactions, {scopeNote}</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Emoji</th>
                  <th className="num">Uses</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {signatures.slice(0, 12).map((s) => (
                  <tr key={s.person}>
                    <td>{s.person}</td>
                    <td>{s.emoji}</td>
                    <td className="num">{s.count}</td>
                    <td className="num muted">{s.reactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="section-gap">
        <div className="section-head">
          <h2>Most discussed / controversial</h2>
          <span className="pill">{label}</span>
        </div>
        <div className="tiles">
          <StatTile label="Thread replies" value={debate.totalReplies} hint={summary.totalCarts ? `${(debate.totalReplies / summary.totalCarts).toFixed(1)} per cart` : undefined} accent="var(--coral)" />
          <StatTile label={`Carts with ${MIN_REPLIES}+ replies`} value={debate.discussedCarts} hint={summary.totalCarts ? `${Math.round((debate.discussedCarts / summary.totalCarts) * 100)}% of carts` : undefined} accent="var(--violet)" />
          <StatTile label="Split-opinion carts" value={debate.splitCarts} hint="Got both approving and disapproving emoji" accent="var(--amber)" />
          <StatTile label="Starts the most threads" value={repliesByPerson[0]?.name ?? "–"} hint={repliesByPerson[0] ? `${repliesByPerson[0].replies} replies on ${repliesByPerson[0].carts} carts` : undefined} accent="var(--teal)" />
        </div>
      </section>

      <section className="grid">
        <div className="card wide" style={{ "--card-accent": "var(--coral)" } as React.CSSProperties}>
          <div className="card-head">
            <div>
              <h2>Most controversial carts</h2>
              <div className="desc">
                Most thread replies per reaction, {scopeNote}, for carts with {MIN_REPLIES}+ replies. Lots of talk and few emoji usually means debate, though some replies are just "add me!"
              </div>
            </div>
          </div>
          {controversial.length === 0 ? (
            <div className="empty">No carts with {MIN_REPLIES}+ replies, {scopeNote}</div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Restaurant</th>
                    <th>Posted by</th>
                    <th>When</th>
                    <th className="num">Replies</th>
                    <th className="num">Reactions</th>
                    <th>Emoji</th>
                    <th>Thread</th>
                  </tr>
                </thead>
                <tbody>
                  {controversial.map((c, i) => (
                    <tr key={c.id}>
                      <td className="muted">{i + 1}</td>
                      <td>
                        {c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.restaurant}</a> : c.restaurant}
                        {isSplit(c) && <span className="tag" title="Got both approving and disapproving emoji">split</span>}
                      </td>
                      <td>{c.createdBy}</td>
                      <td className="muted">{fmtDate(c.createdAt)}</td>
                      <td className="num">{c.threadReplies ?? 0}</td>
                      <td className="num">{c.reactions}</td>
                      <td className="muted">{fmtBreakdown(c.reactionBreakdown) || "–"}</td>
                      <td>{c.slackLink ? <a href={c.slackLink} target="_blank" rel="noreferrer">Slack</a> : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <RankedBarCard title="Whose carts start the most threads" description={`Total thread replies on each person's carts, ${scopeNote}`} rows={repliesByPerson} metric="replies" color="var(--teal)" />
        <RankedBarCard title="Most-debated restaurants" description={`Total thread replies on carts from each restaurant, ${scopeNote}`} rows={repliesByRestaurant} metric="replies" color="var(--amber)" />
      </section>
    </>
  );
}
