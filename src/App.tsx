import { useEffect, useMemo, useState } from "react";
import cartsCsv from "../nyc_food_yum_doordash_carts_12mo.csv?raw";
import { OverviewPage } from "./pages/Overview";
import { TrendsPage } from "./pages/Trends";
import { MonthlyPage } from "./pages/Monthly";
import { ReactionsPage } from "./pages/Reactions";
import { VarietyPage } from "./pages/Variety";
import { PeoplePage } from "./pages/People";
import { parseCartsCsv } from "./lib/csv";
import { summarize } from "./lib/analytics";
import type { Cart } from "./lib/types";

const DEFAULT_CARTS = parseCartsCsv(cartsCsv);
const DEFAULT_SOURCE = "nyc_food_yum_doordash_carts_12mo.csv";

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

/** Hash-based routes so the app stays a single static page. */
const ROUTES = [
  { id: "overview", label: "Overview", Page: OverviewPage },
  { id: "trends", label: "Trends", Page: TrendsPage },
  { id: "monthly", label: "Monthly winners", Page: MonthlyPage },
  { id: "reactions", label: "Reactions", Page: ReactionsPage },
  { id: "variety", label: "Variety", Page: VarietyPage },
  { id: "people", label: "People", Page: PeoplePage },
] as const;
type RouteId = (typeof ROUTES)[number]["id"];

function routeFromHash(): RouteId {
  // Pages may carry their own state after a "?", e.g. #/people?name=Sam
  let id = location.hash.replace(/^#\/?/, "").split("?")[0];
  if (id === "emojis") id = "reactions"; // old link from before the tab was renamed
  return (ROUTES.some((r) => r.id === id) ? id : "overview") as RouteId;
}

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export default function App() {
  const carts: Cart[] = DEFAULT_CARTS;
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [route, setRoute] = useState<RouteId>(routeFromHash);

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const range = useMemo(() => summarize(carts).range, [carts]);
  const Page = ROUTES.find((r) => r.id === route)!.Page;

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>DoorDash Cart Analytics</h1>
          <div className="sub">
            Source: {DEFAULT_SOURCE}
            {range && ` · ${fmtDay(range.from)} – ${fmtDay(range.to)}`}
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
        </div>
      </header>

      <nav className="tabs" aria-label="Pages">
        {ROUTES.map((r) => (
          <a key={r.id} href={`#/${r.id}`} aria-current={route === r.id ? "page" : undefined}>{r.label}</a>
        ))}
      </nav>

      <Page carts={carts} />

      <footer className="footer">
        Data comes from nyc_food_yum_doordash_carts_12mo.csv at build time. Parsing lives in src/lib/csv.ts.
      </footer>
    </div>
  );
}
