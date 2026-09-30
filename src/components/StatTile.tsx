interface Props {
  label: string;
  value: number | string;
  hint?: string;
  /** CSS color for the tile's accent stripe, e.g. "var(--coral)". */
  accent?: string;
}

export function StatTile({ label, value, hint, accent = "var(--coral)" }: Props) {
  return (
    <div className="tile" style={{ "--tile-accent": accent } as React.CSSProperties}>
      <div className="label">{label}</div>
      <div className="value">{typeof value === "number" ? value.toLocaleString() : value}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}
