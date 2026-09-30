import { useMemo, useState } from "react";
import { StatTile } from "../components/StatTile";
import { RankedBarCard } from "../components/RankedBarCard";
import { TopCartsTable } from "../components/TopCartsTable";
import {
  cartsByCreator,
  cartsByDayOfWeek,
  cartsByRestaurant,
  cartsInMonth,
  monthsIn,
  summarize,
  topCombo,
  topReactedCarts,
} from "../lib/analytics";
import type { Cart } from "../lib/types";

const ALL = "all";

export function OverviewPage({ carts }: { carts: Cart[] }) {
  const months = useMemo(() => monthsIn(carts), [carts]);
  const [selected, setSelected] = useState<string>(() => months[0]?.key ?? ALL);

  const isAll = selected === ALL;
  const label = isAll ? "All time" : months.find((m) => m.key === selected)?.label ?? selected;
  const scoped = useMemo(() => (isAll ? carts : cartsInMonth(carts, selected)), [carts, selected, isAll]);

  const allTime = useMemo(() => summarize(carts), [carts]);
  const stats = useMemo(() => summarize(scoped), [scoped]);
  const byCreator = useMemo(() => cartsByCreator(scoped), [scoped]);
  const byRestaurant = useMemo(() => cartsByRestaurant(scoped), [scoped]);
  const byDay = useMemo(() => cartsByDayOfWeek(scoped), [scoped]);
  const topCarts = useMemo(() => topReactedCarts(scoped, 10), [scoped]);
  const combo = useMemo(() => topCombo(scoped), [scoped]);

  const allTimeHint = (n: number) => (isAll ? undefined : `All time: ${n.toLocaleString()}`);
  const scopeNote = isAll ? "all time" : label;

  return (
    <>
      <section>
        <div className="section-head">
          <h2>Showing</h2>
          <select className="select" value={selected} onChange={(e) => setSelected(e.target.value)} aria-label="Month">
            {months.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
            <option value={ALL}>All time</option>
          </select>
          {!isAll && months[0]?.key !== selected && (
            <button className="btn secondary small" onClick={() => setSelected(months[0].key)}>Latest month</button>
          )}
        </div>
        <div className="tiles">
          <StatTile label="Carts" value={stats.totalCarts} hint={allTimeHint(allTime.totalCarts)} accent="var(--coral)" />
          <StatTile label="People who made a cart" value={stats.uniqueCreators} hint={allTimeHint(allTime.uniqueCreators)} accent="var(--violet)" />
          <StatTile label="Unique restaurants" value={stats.uniqueRestaurants} hint={allTimeHint(allTime.uniqueRestaurants)} accent="var(--teal)" />
          <StatTile
            label="Reactions"
            value={stats.totalReactions}
            hint={[stats.totalCarts ? `${(stats.totalReactions / stats.totalCarts).toFixed(1)} per cart` : null, isAll ? null : `all time: ${allTime.totalReactions.toLocaleString()}`].filter(Boolean).join(" · ") || undefined}
            accent="var(--amber)"
          />
          <StatTile
            label="Top person + restaurant combo"
            value={combo ? `${combo.createdBy} · ${combo.restaurant}` : "–"}
            hint={combo ? `${combo.carts} carts · ${Math.round((100 * combo.carts) / combo.personTotal)}% of ${combo.createdBy}'s ${combo.personTotal} known-restaurant carts` : undefined}
            accent="var(--violet)"
            compact
          />
        </div>
      </section>

      <section className="grid">
        <RankedBarCard title="Who makes the most carts" description={`Carts posted per person, ${scopeNote}`} rows={byCreator} color="var(--coral)" />
        <RankedBarCard title="Most-carted restaurants" description={`Carts per restaurant, ${scopeNote} · unknown restaurants hidden`} rows={byRestaurant} color="var(--violet)" />
        <RankedBarCard title="Carts by day of week" description={`Total carts posted on each weekday, ${scopeNote}`} rows={byDay} layout="columns" color="var(--teal)" />
        <RankedBarCard title="Average carts per day of week" description={`Carts per occurrence of each weekday, ${scopeNote}`} rows={byDay} metric="avgCarts" layout="columns" color="var(--amber)" />
        <TopCartsTable title="Most-reacted carts" description={`Top 10 by total reactions, ${scopeNote}`} carts={topCarts} />
      </section>
    </>
  );
}
