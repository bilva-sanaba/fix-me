import type { Cart } from "../lib/types";

/** TODO: who changed the most in carts ordered, and which restaurants changed the most. */
export function TrendsPage({ carts }: { carts: Cart[] }) {
  return (
    <section className="grid">
      <div className="card wide">
        <div className="card-head"><div><h2>Trends</h2><div className="desc">Coming soon · {carts.length} carts loaded</div></div></div>
      </div>
    </section>
  );
}
