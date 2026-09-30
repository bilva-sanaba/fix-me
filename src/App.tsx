import { useEffect, useMemo, useState } from "react";
import sample from "./data/sample-carts.json";
import { StatTile } from "./components/StatTile";
import { RankedBarCard } from "./components/RankedBarCard";
import { TopCartsTable } from "./components/TopCartsTable";
import { UploadButton } from "./components/UploadButton";
import { cartsByCreator, cartsByDayOfWeek, cartsByRestaurant, latestMonth, summarize, topReactedCarts } from "./lib/analytics";
import type { Cart } from "./lib/types";

const SAMPLE = sample as unknown as Cart[];

type Theme = "dark" | "light";
const THEME_KEY = "dd-theme";

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* private mode etc. */
  }
  return "dark";
}

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export default function App() {
  const [carts, setCarts] = useState<Cart[]>(SAMPLE);
  const [source, setSource] = useState("sample data");
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const allTime = useMemo(() => summarize(carts), [carts]);
  const month = useMemo(() => latestMonth(carts), [carts]);
  const monthly = useMemo(() => summarize(month?.carts ?? []), [month]);
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
            {allTime.range && ` · ${fmtDay(allTime.range.from)} – ${fmtDay(allTime.range.to)}`}
          </div>
        </div>
        <div className="actions">
          <button
            className="btn icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          {source !== "sample data" && (
            <button className="btn secondary" onClick={() => { setCarts(SAMPLE); setSource("sample data"); setError(null); }}>
              Reset to sample
            </button>
          )}
          <UploadButton
            onLoaded={(c, label) => { setCarts(c); setSource(label); setError(null); }}
            onError={setError}
          />
        </div>
      </header>

      {error && <div className="error">Couldn't load that file: {error}</div>}

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

      <footer className="footer">
        Upload one or more JSON files from a Slack channel export (day files, optionally users.json). Parsing lives in src/lib/slack.ts.
      </footer>
    </div>
  );
}
