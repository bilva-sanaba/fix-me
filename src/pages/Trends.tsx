import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Cart } from "../lib/types";
import { monthSeries, movers, topMovers, type Mover, type MoversResult } from "../lib/trends";

const tooltipStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--text-primary)",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
};
const tick = { fill: "var(--text-muted)", fontSize: 12 };
const signed = (v: number) => (v > 0 ? `+${v}` : String(v));
const SERIES_COLORS = ["var(--coral)", "var(--violet)", "var(--teal)", "var(--amber)"];

function MoversCard({ title, entity, result, color, limit = 10 }: { title: string; entity: string; result: MoversResult | undefined; color: string; limit?: number }) {
  const rows = result ? topMovers(result.movers, limit) : [];
  // Chart order: biggest riser at top, biggest faller at bottom.
  const chartRows = [...rows].sort((a, b) => b.delta - a.delta);
  return (
    <div className="card" style={{ "--card-accent": color } as React.CSSProperties}>
      <div className="card-head">
        <div>
          <h2>{title}</h2>
          <div className="desc">{result ? `${result.latestLabel} vs ${result.prevLabel} · change in carts` : "No data"}</div>
        </div>
      </div>
      {chartRows.length === 0 ? (
        <div className="empty">No data</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={Math.max(160, chartRows.length * 30 + 30)}>
            <BarChart data={chartRows} layout="vertical" margin={{ top: 4, right: 36, bottom: 0, left: 8 }}>
              <CartesianGrid horizontal={false} stroke="var(--grid)" />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={tick} tickFormatter={signed} />
              <YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={{ stroke: "var(--axis)" }} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <ReferenceLine x={0} stroke="var(--axis)" />
              <Tooltip cursor={{ fill: "var(--grid)", opacity: 0.6 }} contentStyle={tooltipStyle} formatter={(v: number) => [signed(v), "Change"]} />
              <Bar dataKey="delta" name="Change" maxBarSize={20} radius={4} label={{ position: "right", fill: "var(--text-secondary)", fontSize: 12, formatter: signed }}>
                {chartRows.map((r) => (
                  <Cell key={r.name} fill={r.delta >= 0 ? "var(--teal)" : "var(--coral)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <table>
            <thead>
              <tr>
                <th>{entity}</th>
                <th className="num">{result?.prevLabel}</th>
                <th className="num">{result?.latestLabel}</th>
                <th className="num">Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: Mover) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td className="num muted">{r.prev}</td>
                  <td className="num">{r.latest}</td>
                  <td className="num" style={{ color: r.delta > 0 ? "var(--teal)" : r.delta < 0 ? "var(--coral)" : undefined }}>{signed(r.delta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export function TrendsPage({ carts }: { carts: Cart[] }) {
  const people = useMemo(() => movers(carts, (c) => c.createdBy), [carts]);
  const restaurants = useMemo(() => movers(carts, (c) => c.restaurant), [carts]);
  const topPeople = useMemo(() => (people ? topMovers(people.movers, 4).map((m) => m.name) : []), [people]);
  const series = useMemo(() => monthSeries(carts, (c) => c.createdBy, topPeople), [carts, topPeople]);

  return (
    <>
      <div className="section-head">
        <h2>Month over month</h2>
        <span className="pill">{people ? `${people.latestLabel} vs ${people.prevLabel}` : "No data"}</span>
      </div>
      <section className="grid">
        <MoversCard title="Who changed the most" entity="Person" result={people} color="var(--coral)" />
        <MoversCard title="Restaurants that changed the most" entity="Restaurant" result={restaurants} color="var(--violet)" />

        <div className="card wide" style={{ "--card-accent": "var(--teal)" } as React.CSSProperties}>
          <div className="card-head">
            <div>
              <h2>Carts per month, top movers</h2>
              <div className="desc">Monthly cart count for the four people whose totals changed the most</div>
            </div>
          </div>
          {series.length === 0 || topPeople.length === 0 ? (
            <div className="empty">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={series} margin={{ top: 12, right: 16, bottom: 0, left: -20 }}>
                <CartesianGrid vertical={false} stroke="var(--grid)" />
                <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "var(--axis)" }} tick={tick} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={tick} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--axis)" }} />
                <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
                {topPeople.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={SERIES_COLORS[i]}
                    strokeWidth={2}
                    dot={{ r: 4, fill: SERIES_COLORS[i], stroke: "var(--surface)", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </>
  );
}
