import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RankedRow } from "../lib/analytics";

type Metric = "carts" | "reactions" | "avgCarts" | "replies";

interface Props {
  title: string;
  description?: string;
  rows: RankedRow[];
  /** Which column drives the bars. Defaults to carts. */
  metric?: Metric;
  /** CSS color for the bars, e.g. "var(--violet)". */
  color?: string;
  /** Cap how many rows the chart shows. Table always shows all. */
  limit?: number;
  /** Vertical bars (columns) in the given order instead of ranked horizontal bars. */
  layout?: "ranked" | "columns";
  /** Span the full grid width. */
  wide?: boolean;
}

const LABEL: Record<Metric, string> = { carts: "Carts", reactions: "Reactions", avgCarts: "Avg carts", replies: "Replies" };
const FORMAT: Record<Metric, (v: number) => string> = {
  carts: (v) => String(v),
  reactions: (v) => String(v),
  avgCarts: (v) => v.toFixed(1),
  replies: (v) => String(v),
};

const tooltipStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--text-primary)",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
};

const tick = { fill: "var(--text-muted)", fontSize: 12 };

export function RankedBarCard({ title, description, rows, metric = "carts", color = "var(--coral)", limit = 10, layout = "ranked", wide = false }: Props) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const shown = layout === "ranked" ? rows.slice(0, limit) : rows;
  const columns = layout === "columns";
  const fmt = FORMAT[metric];
  const hasAvg = rows.some((r) => r.avgCarts !== undefined);
  const hasReplies = rows.some((r) => r.replies !== undefined);

  return (
    <div className={`card${wide ? " wide" : ""}`} style={{ "--card-accent": color } as React.CSSProperties}>
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
        <ResponsiveContainer width="100%" height={columns ? 220 : Math.max(160, shown.length * 30 + 30)}>
          {columns ? (
            <BarChart data={shown} margin={{ top: 20, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: "var(--axis)" }} tick={tick} />
              <YAxis allowDecimals={metric === "avgCarts"} tickLine={false} axisLine={false} tick={tick} />
              <Tooltip cursor={{ fill: "var(--grid)", opacity: 0.6 }} contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
              <Bar
                dataKey={metric}
                name={LABEL[metric]}
                fill={color}
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                label={{ position: "top", fill: "var(--text-secondary)", fontSize: 12, formatter: fmt }}
              />
            </BarChart>
          ) : (
            <BarChart data={shown} layout="vertical" margin={{ top: 4, right: 36, bottom: 0, left: 8 }}>
              <CartesianGrid horizontal={false} stroke="var(--grid)" />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={tick} />
              <YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={{ stroke: "var(--axis)" }} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <Tooltip cursor={{ fill: "var(--grid)", opacity: 0.6 }} contentStyle={tooltipStyle} formatter={(v: number) => fmt(v)} />
              <Bar
                dataKey={metric}
                name={LABEL[metric]}
                fill={color}
                radius={[0, 4, 4, 0]}
                maxBarSize={20}
                label={{ position: "right", fill: "var(--text-secondary)", fontSize: 12, formatter: fmt }}
              />
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
              {hasAvg && <th className="num">Days in range</th>}
              {hasAvg && <th className="num">Avg carts / day</th>}
              <th className="num">Reactions</th>
              <th className="num">Reactions / cart</th>
              {hasReplies && <th className="num">Replies</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name}>
                <td className="muted">{i + 1}</td>
                <td>{r.name}</td>
                <td className="num">{r.carts}</td>
                {hasAvg && <td className="num">{r.occurrences ?? 0}</td>}
                {hasAvg && <td className="num">{(r.avgCarts ?? 0).toFixed(2)}</td>}
                <td className="num">{r.reactions}</td>
                <td className="num">{r.carts ? (r.reactions / r.carts).toFixed(1) : "–"}</td>
                {hasReplies && <td className="num">{r.replies ?? 0}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
