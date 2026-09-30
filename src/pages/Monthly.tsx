import type { Cart } from "../lib/types";

/** TODO: each month's top 3 cart makers for the last 12 months. */
export function MonthlyPage({ carts }: { carts: Cart[] }) {
  return (
    <section className="grid">
      <div className="card wide">
        <div className="card-head"><div><h2>Monthly winners</h2><div className="desc">Coming soon · {carts.length} carts loaded</div></div></div>
      </div>
    </section>
  );
}
