import { useMemo } from "react";
import { StatTile } from "../components/StatTile";
import { hallOfFame, lastNMonths } from "../lib/monthly";
import type { Cart } from "../lib/types";
import "./monthly.css";

/** Each month's top 3 cart makers for the last 12 months, plus a hall of fame. */
export function MonthlyPage({ carts }: { carts: Cart[] }) {
  const months = useMemo(() => lastNMonths(carts, 12), [carts]);
  const fame = useMemo(() => hallOfFame(months), [months]);

  return (
    <>
      <section>
        <div className="section-head">
          <h2>Hall of fame</h2>
          <span className="pill">Last 12 months</span>
        </div>
        <div className="tiles">
          <StatTile
            label="Most monthly wins"
            value={fame.mostWins?.name ?? "–"}
            hint={fame.mostWins ? `${fame.mostWins.count} ${fame.mostWins.count === 1 ? "win" : "wins"}` : undefined}
            accent="var(--amber)"
          />
          <StatTile
            label="Most podium finishes"
            value={fame.mostPodiums?.name ?? "–"}
            hint={fame.mostPodiums ? `${fame.mostPodiums.count} top-3 ${fame.mostPodiums.count === 1 ? "finish" : "finishes"}` : undefined}
            accent="var(--violet)"
          />
          <StatTile
            label="Current month winner"
            value={fame.currentWinner?.name ?? "–"}
            hint={fame.currentWinner ? `${fame.currentWinner.carts} carts · ${fame.currentWinner.monthLabel}` : undefined}
            accent="var(--coral)"
          />
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>Monthly podium</h2>
          <span className="pill">Top 3 by carts</span>
        </div>
        {months.length === 0 ? (
          <div className="card wide"><div className="empty">No data</div></div>
        ) : (
          <div className="month-grid">
            {months.map((m, i) => (
              <div key={m.key} className={`card month-card${i === 0 ? " winner-month" : ""}`} style={{ "--card-accent": i === 0 ? "var(--amber)" : "var(--violet)" } as React.CSSProperties}>
                <div className="card-head">
                  <div>
                    <h2>{m.label}</h2>
                    <div className="desc">{m.totalCarts} {m.totalCarts === 1 ? "cart" : "carts"}</div>
                  </div>
                </div>
                {m.top3.length === 0 ? (
                  <div className="empty">No carts</div>
                ) : (
                  <ol className="podium">
                    {m.top3.map((p, rank) => (
                      <li key={p.name}>
                        <span className={`badge r${rank + 1}`}>{rank + 1}</span>
                        <span className="name">{p.name}</span>
                        <span className="count">{p.carts} {p.carts === 1 ? "cart" : "carts"}</span>
                      </li>
                    ))}
                  </ol>
                )}
                {m.restaurant && <div className="month-foot">Restaurant of the month: {m.restaurant}</div>}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
