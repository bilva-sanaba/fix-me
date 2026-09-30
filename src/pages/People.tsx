import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MonthPicker, useMonthScope } from "../components/MonthPicker";
import { RankedBarCard } from "../components/RankedBarCard";
import { StatTile } from "../components/StatTile";
import { cartsByDayOfWeek, cartsByRestaurant } from "../lib/analytics";
import { emojiLabel, emojiUsage } from "../lib/emoji";
import { monthlyActivity, peopleIn, personStats } from "../lib/person";
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
const HISTORY_PREVIEW = 20;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const fmtBreakdown = (b: Record<string, number>) =>
  Object.entries(b)
    .sort((a, z) => z[1] - a[1])
    .map(([name, n]) => `${emojiLabel(name)} ${n}`)
    .join("  ");

/** The person named in the hash (#/people?name=...), if any. */
function nameFromHash(): string | null {
  return new URLSearchParams(location.hash.split("?")[1] ?? "").get("name");
}

/** Look up one person: their stats, favorite spots, when they post, and every cart. */
export function PeoplePage({ carts }: { carts: Cart[] }) {
  const people = useMemo(() => peopleIn(carts), [carts]);
  const alphabetical = useMemo(() => [...people].sort((a, b) => a.name.localeCompare(b.name)), [people]);
  const [name, setName] = useState<string>(() => {
    const fromHash = nameFromHash();
    return fromHash && people.some((p) => p.name === fromHash) ? fromHash : people[0]?.name ?? "";
  });
  const [showAll, setShowAll] = useState(false);

  // Keep the URL shareable without adding a history entry per pick.
  useEffect(() => {
    if (name) history.replaceState(null, "", `#/people?name=${encodeURIComponent(name)}`);
    setShowAll(false);
  }, [name]);

  const scope = useMonthScope(carts, "all");
  const { selected, isAll, scoped, scopeNote } = scope;
  const mine = useMemo(() => scoped.filter((c) => c.createdBy === name), [scoped, name]);
  const stats = useMemo(() => personStats(scoped, name), [scoped, name]);
  const activity = useMemo(() => monthlyActivity(carts, name), [carts, name]);
  const restaurants = useMemo(() => cartsByRestaurant(mine), [mine]);
  const byDay = useMemo(() => cartsByDayOfWeek(mine), [mine]);
  const emojis = useMemo(() => emojiUsage(mine), [mine]);
  const history_ = useMemo(() => [...mine].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [mine]);
  const shown = showAll ? history_ : history_.slice(0, HISTORY_PREVIEW);

  const perCart = (n: number) => (stats.carts ? `${(n / stats.carts).toFixed(1)} per cart` : undefined);

  return (
    <>
      <section>
        <div className="section-head">
          <h2>Person</h2>
          <select className="select" value={name} onChange={(e) => setName(e.target.value)} aria-label="Person">
            {alphabetical.map((p) => (
              <option key={p.name} value={p.name}>{p.name} ({p.carts})</option>
            ))}
          </select>
          <MonthPicker scope={scope} />
        </div>
        <div className="tiles">
          <StatTile
            label="Carts"
            value={stats.carts}
            hint={stats.rank ? `#${stats.rank} of ${stats.people} cart makers, ${scopeNote}` : `No carts, ${scopeNote}`}
            accent="var(--coral)"
          />
          <StatTile label="Restaurants" value={stats.restaurants} hint="Distinct known restaurants" accent="var(--violet)" />
          <StatTile label="Reactions received" value={stats.reactions} hint={perCart(stats.reactions)} accent="var(--amber)" />
          <StatTile label="Thread replies" value={stats.replies} hint={perCart(stats.replies)} accent="var(--teal)" />
        </div>
      </section>

      <section className="grid">
        <div className="card wide" style={{ "--card-accent": "var(--coral)" } as React.CSSProperties}>
          <div className="card-head">
            <div>
              <h2>Carts per month</h2>
              <div className="desc">{name}'s carts in every month of the data{isAll ? "" : ` · ${scope.label} highlighted`}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={activity} margin={{ top: 20, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "var(--axis)" }} tick={tick} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={tick} />
              <Tooltip cursor={{ fill: "var(--grid)", opacity: 0.6 }} contentStyle={tooltipStyle} formatter={(v: number) => [v, "Carts"]} />
              <Bar dataKey="carts" name="Carts" radius={[4, 4, 0, 0]} maxBarSize={28} label={{ position: "top", fill: "var(--text-secondary)", fontSize: 12, formatter: (v: number) => (v ? v : "") }}>
                {activity.map((p) => (
                  <Cell key={p.key} fill="var(--coral)" fillOpacity={isAll || p.key === selected ? 1 : 0.35} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <RankedBarCard title="Favorite restaurants" description={`${name}'s carts per restaurant, ${scopeNote} · unknown restaurants hidden`} rows={restaurants} color="var(--violet)" />
        <RankedBarCard title="Emojis received" description={`Reactions on ${name}'s carts, ${scopeNote}`} rows={emojis} metric="reactions" color="var(--amber)" />
        <RankedBarCard title="Carts by day of week" description={`When ${name} posts carts, ${scopeNote}`} rows={byDay} layout="columns" color="var(--teal)" wide />

        <div className="card wide" style={{ "--card-accent": "var(--violet)" } as React.CSSProperties}>
          <div className="card-head">
            <div>
              <h2>Cart history</h2>
              <div className="desc">Every cart {name} posted, {scopeNote}, newest first</div>
            </div>
          </div>
          {history_.length === 0 ? (
            <div className="empty">No carts, {scopeNote}</div>
          ) : (
            <>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Restaurant</th>
                      <th className="num">Reactions</th>
                      <th>Emoji</th>
                      <th className="num">Replies</th>
                      <th>Thread</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((c) => (
                      <tr key={c.id}>
                        <td className="muted">{fmtDate(c.createdAt)}</td>
                        <td>{c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.restaurant}</a> : c.restaurant}</td>
                        <td className="num">{c.reactions}</td>
                        <td className="muted">{fmtBreakdown(c.reactionBreakdown) || "–"}</td>
                        <td className="num">{c.threadReplies ?? 0}</td>
                        <td>{c.slackLink ? <a href={c.slackLink} target="_blank" rel="noreferrer">Slack</a> : "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {history_.length > HISTORY_PREVIEW && (
                <div className="show-more">
                  <button className="btn secondary small" onClick={() => setShowAll(!showAll)}>
                    {showAll ? "Show fewer" : `Show all ${history_.length} carts`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
