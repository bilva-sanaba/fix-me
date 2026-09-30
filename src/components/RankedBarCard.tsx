import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RankedRow } from "../lib/analytics";

type Metric = "carts" | "reactions";

interface Props {
  title: string;
  description?: string;
  rows: RankedRow[];
  /** Which column drives the bars. Defaults to carts. */
  metric?: Metric;
  /** Cap how many rows the chart shows. Table always shows all. */
  limit?: number;
  /** Vertical bars (columns) in the given order instead of ranked horizontal bars. */
  layout?: "ranked" | "columns";
}

const LABEL: Record<Metric, string> = { carts: "Carts", reactions: "Reactions" };
const COLOR: Record<Metric, string> = { carts: "var(--series-1)", reactions: "var(--series-2)" };

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 12,
};

export function RankedBarCard({ title, description, rows, metric = "carts", limit = 10, layout = "ranked" }: Props) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const shown = layout === "ranked" ? rows.slice(0, limit) : rows;
  const wide = layout === "columns";

  return (
    <div className={`card${wide ? " wide" : ""}`}>
      <div className="card-head">
        <div>
          <h2>{title}</h2>
          {description && <div className="desc">{description}</div>}
        </div>
        <div className="seg" role="group" aria-label="View">
          <button aria-pressed={view === "chart"} onClick={() => setView("chart")}>Chart</button>
          <button aria-pressed={view === "table"} onClick={() => setView("table")}>Table</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty">No data</div>
      ) : view === "chart" ? (
        <ResponsiveContainer width="100%" height={wide ? 220 : Math.max(160, shown.length * 30 + 30)}>
          {wide ? (
            <BarChart data={shown} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: "var(--axis)" }} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <Tooltip cursor={{ fill: "var(--grid)", opacity: 0.5 }} contentStyle={tooltipStyle} />
              <Bar dataKey={metric} name={LABEL[metric]} fill={COLOR[metric]} radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          ) : (
            <BarChart data={shown} layout="vertical" margin={{ top: 4, right: 32, bottom: 0, left: 8 }}>
              <CartesianGrid horizontal={false} stroke="var(--grid)" />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={{ stroke: "var(--axis)" }} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <Tooltip cursor={{ fill: "var(--grid)", opacity: 0.5 }} contentStyle={tooltipStyle} />
              <Bar dataKey={metric} name={LABEL[metric]} fill={COLOR[metric]} radius={[0, 4, 4, 0]} maxBarSize={20} label={{ position: "right", fill: "var(--text-secondary)", fontSize: 12 }} />
            </BarChart>
          )}
        </ResponsiveContainer>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th className="num">Carts</th>
              <th className="num">Reactions</th>
              <th className="num">Reactions / cart</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name}>
                <td className="muted">{i + 1}</td>
                <td>{r.name}</td>
                <td className="num">{r.carts}</td>
                <td className="num">{r.reactions}</td>
                <td className="num">{r.carts ? (r.reactions / r.carts).toFixed(1) : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
