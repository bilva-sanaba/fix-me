import { useMemo } from "react";
import { StatTile } from "../components/StatTile";
import { RankedBarCard } from "../components/RankedBarCard";
import { TopCartsTable } from "../components/TopCartsTable";
import { cartsByCreator, cartsByDayOfWeek, cartsByRestaurant, latestMonth, summarize, topReactedCarts } from "../lib/analytics";
import type { Cart } from "../lib/types";

export function OverviewPage({ carts }: { carts: Cart[] }) {
  const allTime = useMemo(() => summarize(carts), [carts]);
  const month = useMemo(() => latestMonth(carts), [carts]);
  const monthly = useMemo(() => summarize(month?.carts ?? []), [month]);
  const byCreator = useMemo(() => cartsByCreator(carts), [carts]);
  const byRestaurant = useMemo(() => cartsByRestaurant(carts), [carts]);
  const byDay = useMemo(() => cartsByDayOfWeek(carts), [carts]);
  const topCarts = useMemo(() => topReactedCarts(carts, 10), [carts]);

  return (
    <>
      <section>
        <div className="section-head">
          <h2>Latest month</h2>
          <span className="pill">{month?.label ?? "No data"}</span>
        </div>
        <div className="tiles">
          <StatTile label="Carts" value={monthly.totalCarts} hint={`All time: ${allTime.totalCarts.toLocaleString()}`} accent="var(--coral)" />
          <StatTile label="People who made a cart" value={monthly.uniqueCreators} hint={`All time: ${allTime.uniqueCreators.toLocaleString()}`} accent="var(--violet)" />
          <StatTile label="Unique restaurants" value={monthly.uniqueRestaurants} hint={`All time: ${allTime.uniqueRestaurants.toLocaleString()}`} accent="var(--teal)" />
          <StatTile
            label="Reactions"
            value={monthly.totalReactions}
            hint={monthly.totalCarts ? `${(monthly.totalReactions / monthly.totalCarts).toFixed(1)} per cart · all time: ${allTime.totalReactions.toLocaleString()}` : `All time: ${allTime.totalReactions.toLocaleString()}`}
            accent="var(--amber)"
          />
        </div>
      </section>

      <section className="grid">
        <RankedBarCard title="Who makes the most carts" description="Carts posted per person, all time" rows={byCreator} color="var(--coral)" />
        <RankedBarCard title="Most-carted restaurants" description="Carts per restaurant, all time" rows={byRestaurant} color="var(--violet)" />
        <RankedBarCard title="Carts by day of week" description="Total carts posted on each weekday" rows={byDay} layout="columns" color="var(--teal)" />
        <RankedBarCard title="Average carts per day of week" description="Carts per occurrence of each weekday in the date range" rows={byDay} metric="avgCarts" layout="columns" color="var(--amber)" />
        <TopCartsTable title="Most-reacted carts" description="Top 10 by total reactions" carts={topCarts} />
      </section>
    </>
  );
}
