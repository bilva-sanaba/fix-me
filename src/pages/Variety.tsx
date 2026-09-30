import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MonthPicker, useMonthScope } from "../components/MonthPicker";
import { StatTile } from "../components/StatTile";
import { byLoyalty, median, MIN_CARTS_ALL_TIME, MIN_CARTS_MONTH, personVariety, type PersonVariety } from "../lib/variety";
import type { Cart } from "../lib/types";

const tooltipStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  color: "var(--text-primary)",
  fontSize: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
};
const tick = { fill: "var(--text-muted)", fontSize: 12 };
const pct = (v: number) => `${Math.round(v * 100)}%`;
const spots = (v: number) => v.toFixed(1);

interface ChartProps {
  title: string;
  description: string;
  rows: PersonVariety[];
  value: (r: PersonVariety) => number;
  format: (v: number) => string;
  /** Extra line in the tooltip, e.g. the person's top restaurant. */
  detail: (r: PersonVariety) => string;
  color: string;
  domainMax?: number;
}

function VarietyBarCard({ title, description, rows, value, format, detail, color, domainMax }: ChartProps) {
  const shown = rows.slice(0, 10).map((r) => ({ ...r, value: value(r) }));
  return (
    <div className="card" style={{ "--card-accent": color } as React.CSSProperties}>
      <div className="card-head">
        <div>
          <h2>{title}</h2>
          <div className="desc">{description}</div>
        </div>
      </div>
      {shown.length === 0 ? (
        <div className="empty">Nobody has enough carts yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(160, shown.length * 30 + 30)}>
          <BarChart data={shown} layout="vertical" margin={{ top: 4, right: 44, bottom: 0, left: 8 }}>
            <CartesianGrid horizontal={false} stroke="var(--grid)" />
            <XAxis type="number" domain={[0, domainMax ?? "auto"]} tickLine={false} axisLine={false} tick={tick} tickFormatter={format} />
            <YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={{ stroke: "var(--axis)" }} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: "var(--grid)", opacity: 0.6 }}
              contentStyle={tooltipStyle}
              formatter={(v: number, _n, item) => [`${format(v)} · ${detail(item.payload as PersonVariety)}`, title]}
            />
            <Bar dataKey="value" name={title} fill={color} radius={[0, 4, 4, 0]} maxBarSize={20} label={{ position: "right", fill: "var(--text-secondary)", fontSize: 12, formatter: format }} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/** Explorers vs. regulars: how spread out each person's carts are across restaurants. */
export function VarietyPage({ carts }: { carts: Cart[] }) {
  const scope = useMonthScope(carts);
  const { isAll, scoped, scopeNote } = scope;
  const minCarts = isAll ? MIN_CARTS_ALL_TIME : MIN_CARTS_MONTH;
  const rows = useMemo(() => personVariety(scoped, minCarts), [scoped, minCarts]);
  const loyal = useMemo(() => byLoyalty(rows), [rows]);
  const typical = median(rows.map((r) => r.regularSpots));
  const explorer = rows[0];
  const regular = loyal[0];
  const eligibility = `${minCarts}+ carts with a known restaurant, ${scopeNote}`;

  return (
    <>
      <section>
        <div className="section-head">
          <h2>Explorers vs. regulars</h2>
          <MonthPicker scope={scope} />
        </div>
        <div className="tiles">
          <StatTile label="People ranked" value={rows.length} hint={`With ${eligibility}`} accent="var(--violet)" />
          <StatTile label="Typical regular spots" value={typical === undefined ? "–" : spots(typical)} hint="Median across people ranked" accent="var(--teal)" />
          <StatTile label="Biggest explorer" value={explorer?.name ?? "–"} hint={explorer ? `${explorer.restaurants} restaurants in ${explorer.carts} carts` : undefined} accent="var(--coral)" />
          <StatTile label="Most loyal regular" value={regular?.name ?? "–"} hint={regular ? `${pct(regular.topShare)} of carts from ${regular.topRestaurant}` : undefined} accent="var(--amber)" />
        </div>
      </section>

      <section className="grid">
        <VarietyBarCard
          title="Explorers"
          description={`Regular spots: how many restaurants someone rotates between, ${scopeNote}`}
          rows={rows}
          value={(r) => r.regularSpots}
          format={spots}
          detail={(r) => `${r.restaurants} restaurants in ${r.carts} carts`}
          color="var(--coral)"
        />
        <VarietyBarCard
          title="Regulars"
          description={`Share of carts from their most-ordered restaurant, ${scopeNote}`}
          rows={loyal}
          value={(r) => r.topShare}
          format={pct}
          detail={(r) => (r.topCount > 1 ? `${r.topCount} of ${r.carts} carts from ${r.topRestaurant}` : "no repeat restaurants")}
          color="var(--amber)"
          domainMax={1}
        />

        <div className="card wide" style={{ "--card-accent": "var(--teal)" } as React.CSSProperties}>
          <div className="card-head">
            <div>
              <h2>Everyone ranked</h2>
              <div className="desc">
                People with {eligibility}, most varied first. Regular spots counts a restaurant less the fewer carts it gets: 10 carts at 10 places is 10, but 9 at one place and 1 elsewhere is about 1.4. Name variants of one place count separately.
              </div>
            </div>
          </div>
          {rows.length === 0 ? (
            <div className="empty">Nobody has enough carts, {scopeNote}</div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Person</th>
                    <th className="num">Carts</th>
                    <th className="num">Restaurants</th>
                    <th className="num">Regular spots</th>
                    <th>Top spot</th>
                    <th className="num">Top spot share</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.name}>
                      <td className="muted">{i + 1}</td>
                      <td>{r.name}</td>
                      <td className="num">{r.carts}</td>
                      <td className="num">{r.restaurants}</td>
                      <td className="num">{spots(r.regularSpots)}</td>
                      <td>{r.topCount > 1 ? r.topRestaurant : <span style={{ color: "var(--text-muted)" }}>No repeats</span>}</td>
                      <td className="num">{r.topCount > 1 ? <>{pct(r.topShare)} <span style={{ color: "var(--text-muted)" }}>({r.topCount})</span></> : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
