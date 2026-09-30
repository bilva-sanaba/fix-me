import type { Cart } from "../lib/types";

interface Props {
  title: string;
  description?: string;
  carts: Cart[];
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const fmtBreakdown = (b: Record<string, number>) =>
  Object.entries(b)
    .sort((a, z) => z[1] - a[1])
    .map(([emoji, n]) => `:${emoji}: ${n}`)
    .join("  ");

export function TopCartsTable({ title, description, carts }: Props) {
  return (
    <div className="card wide">
      <div className="card-head">
        <div>
          <h2>{title}</h2>
          {description && <div className="desc">{description}</div>}
        </div>
      </div>
      {carts.length === 0 ? (
        <div className="empty">No data</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Restaurant</th>
              <th>Posted by</th>
              <th>When</th>
              <th className="num">Reactions</th>
              <th>Breakdown</th>
            </tr>
          </thead>
          <tbody>
            {carts.map((c, i) => (
              <tr key={c.id}>
                <td className="muted">{i + 1}</td>
                <td>{c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.restaurant}</a> : c.restaurant}</td>
                <td>{c.createdBy}</td>
                <td className="muted">{fmtDate(c.createdAt)}</td>
                <td className="num">{c.reactions}</td>
                <td className="muted">{fmtBreakdown(c.reactionBreakdown)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
