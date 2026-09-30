import { useEffect, useMemo, useState } from "react";
import sample from "./data/sample-carts.json";
import { UploadButton } from "./components/UploadButton";
import { OverviewPage } from "./pages/Overview";
import { TrendsPage } from "./pages/Trends";
import { MonthlyPage } from "./pages/Monthly";
import { summarize } from "./lib/analytics";
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

/** Hash-based routes so the app stays a single static page. */
const ROUTES = [
  { id: "overview", label: "Overview", Page: OverviewPage },
  { id: "trends", label: "Trends", Page: TrendsPage },
  { id: "monthly", label: "Monthly winners", Page: MonthlyPage },
] as const;
type RouteId = (typeof ROUTES)[number]["id"];

function routeFromHash(): RouteId {
  const id = location.hash.replace(/^#\/?/, "");
  return (ROUTES.some((r) => r.id === id) ? id : "overview") as RouteId;
}

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export default function App() {
  const [carts, setCarts] = useState<Cart[]>(SAMPLE);
  const [source, setSource] = useState("sample data");
  const [error, setError] = useState<string | null>(null);
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
            Source: {source}
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

      <nav className="tabs" aria-label="Pages">
        {ROUTES.map((r) => (
          <a key={r.id} href={`#/${r.id}`} aria-current={route === r.id ? "page" : undefined}>{r.label}</a>
        ))}
      </nav>

      {error && <div className="error">Couldn't load that file: {error}</div>}

      <Page carts={carts} />

      <footer className="footer">
        Upload one or more JSON files from a Slack channel export (day files, optionally users.json). Parsing lives in src/lib/slack.ts.
      </footer>
    </div>
  );
}
