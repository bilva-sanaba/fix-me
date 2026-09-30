import { useMemo } from "react";
import { StatTile } from "../components/StatTile";
import { RankedBarCard } from "../components/RankedBarCard";
import { emojiSummary, emojiUsage, rankByReactions, signatureEmojis } from "../lib/emoji";
import type { Cart } from "../lib/types";

/** Which emojis people react to carts with, and whose carts collect them. */
export function EmojisPage({ carts }: { carts: Cart[] }) {
  const summary = useMemo(() => emojiSummary(carts), [carts]);
  const usage = useMemo(() => emojiUsage(carts), [carts]);
  const byPerson = useMemo(() => rankByReactions(carts, (c) => c.createdBy), [carts]);
  const byRestaurant = useMemo(() => rankByReactions(carts, (c) => c.restaurant), [carts]);
  const signatures = useMemo(() => signatureEmojis(carts), [carts]);
  const pct = summary.totalCarts ? Math.round((summary.cartsWithReactions / summary.totalCarts) * 100) : 0;

  return (
    <>
      <section>
        <div className="section-head">
          <h2>Emoji reactions</h2>
          <span className="pill">All time</span>
        </div>
        <div className="tiles">
          <StatTile label="Emoji reactions" value={summary.totalReactions} hint={summary.totalCarts ? `${(summary.totalReactions / summary.totalCarts).toFixed(1)} per cart` : undefined} accent="var(--amber)" />
          <StatTile label="Distinct emojis" value={summary.distinctEmojis} accent="var(--violet)" />
          <StatTile label="Carts with a reaction" value={`${pct}%`} hint={`${summary.cartsWithReactions} of ${summary.totalCarts} carts`} accent="var(--teal)" />
          <StatTile label="Most-used emoji" value={summary.top?.name ?? "–"} hint={summary.top ? `${summary.top.count} uses` : undefined} accent="var(--coral)" />
        </div>
      </section>

      <section className="grid">
        <RankedBarCard title="Most-used emojis" description="Total uses per emoji · table shows how many carts each appeared on" rows={usage} metric="reactions" color="var(--amber)" />
        <RankedBarCard title="Whose carts get the most reactions" description="Total emoji reactions on each person's carts" rows={byPerson} metric="reactions" color="var(--coral)" />
        <RankedBarCard title="Most-reacted restaurants" description="Total emoji reactions on carts from each restaurant" rows={byRestaurant} metric="reactions" color="var(--violet)" />

        <div className="card" style={{ "--card-accent": "var(--teal)" } as React.CSSProperties}>
          <div className="card-head">
            <div>
              <h2>Signature emojis</h2>
              <div className="desc">The emoji each person's carts receive most · uses of it vs. total reactions</div>
            </div>
          </div>
          {signatures.length === 0 ? (
            <div className="empty">No reactions yet</div>
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
    </>
  );
}
