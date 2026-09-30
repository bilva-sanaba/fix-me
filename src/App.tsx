import { useMemo, useState } from "react";
import cartsCsv from "../nyc_food_yum_doordash_carts.csv?raw";
import { StatTile } from "./components/StatTile";
import { RankedBarCard } from "./components/RankedBarCard";
import { TopCartsTable } from "./components/TopCartsTable";
import { UploadButton } from "./components/UploadButton";
import { parseCartsCsv } from "./lib/csv";
import { cartsByCreator, cartsByDayOfWeek, cartsByRestaurant, summarize, topReactedCarts } from "./lib/analytics";
import type { Cart } from "./lib/types";

const DEFAULT_CARTS = parseCartsCsv(cartsCsv);
const DEFAULT_SOURCE = "nyc_food_yum_doordash_carts.csv";

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export default function App() {
  const [carts, setCarts] = useState<Cart[]>(DEFAULT_CARTS);
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => summarize(carts), [carts]);
  const byCreator = useMemo(() => cartsByCreator(carts), [carts]);
  const byRestaurant = useMemo(() => cartsByRestaurant(carts), [carts]);
  const byDay = useMemo(() => cartsByDayOfWeek(carts), [carts]);
  const topCarts = useMemo(() => topReactedCarts(carts, 10), [carts]);

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>DoorDash Cart Analytics</h1>
          <div className="sub">
            Source: {source}
            {summary.range && ` · ${fmtDay(summary.range.from)} – ${fmtDay(summary.range.to)}`}
          </div>
        </div>
        <div className="actions">
          {source !== DEFAULT_SOURCE && (
            <button className="btn secondary" onClick={() => { setCarts(DEFAULT_CARTS); setSource(DEFAULT_SOURCE); setError(null); }}>
              Reset to default CSV
            </button>
          )}
          <UploadButton
            onLoaded={(c, label) => { setCarts(c); setSource(label); setError(null); }}
            onError={setError}
          />
        </div>
      </header>

      {error && <div className="error">Couldn't load that file: {error}</div>}

      <section className="tiles">
        <StatTile label="Carts" value={summary.totalCarts} />
        <StatTile label="Cart makers" value={summary.uniqueCreators} />
        <StatTile label="Restaurants" value={summary.uniqueRestaurants} />
        <StatTile
          label="Reactions"
          value={summary.totalReactions}
          hint={summary.totalCarts ? `${(summary.totalReactions / summary.totalCarts).toFixed(1)} per cart` : undefined}
        />
      </section>

      <section className="grid">
        <RankedBarCard title="Who makes the most carts" description="Carts posted per person" rows={byCreator} />
        <RankedBarCard title="Most-carted restaurants" description="Carts per restaurant" rows={byRestaurant} />
        <RankedBarCard title="Carts by day of week" description="When carts get posted" rows={byDay} layout="columns" />
        <TopCartsTable title="Most-reacted carts" description="Top 10 by total reactions" carts={topCarts} />
      </section>

      <footer className="footer">
        Loads nyc_food_yum_doordash_carts.csv by default. You can also upload a cart CSV, or JSON files from a Slack channel export (day files, optionally users.json). Parsing lives in src/lib/csv.ts and src/lib/slack.ts.
      </footer>
    </div>
  );
}
