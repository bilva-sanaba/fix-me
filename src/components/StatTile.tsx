interface Props {
  label: string;
  value: number | string;
  hint?: string;
}

export function StatTile({ label, value, hint }: Props) {
  return (
    <div className="tile">
      <div className="label">{label}</div>
      <div className="value">{typeof value === "number" ? value.toLocaleString() : value}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}
