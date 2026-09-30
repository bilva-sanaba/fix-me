import { useMemo, useState } from "react";
import { cartsInMonth, monthsIn } from "../lib/analytics";
import type { Cart } from "../lib/types";

const ALL = "all";

/** Month selection for a page: defaults to the latest month (or all time), with an "All time" option. */
export function useMonthScope(carts: Cart[], initial: "latest" | "all" = "latest") {
  const months = useMemo(() => monthsIn(carts), [carts]);
  const [selected, setSelected] = useState<string>(() => (initial === "all" ? ALL : months[0]?.key ?? ALL));
  const isAll = selected === ALL;
  const label = isAll ? "All time" : months.find((m) => m.key === selected)?.label ?? selected;
  const scoped = useMemo(() => (isAll ? carts : cartsInMonth(carts, selected)), [carts, selected, isAll]);
  return { months, selected, setSelected, isAll, label, scoped, scopeNote: isAll ? "all time" : label };
}

type Scope = ReturnType<typeof useMonthScope>;

/** The month dropdown plus a "Latest month" shortcut when an older month is picked. */
export function MonthPicker({ scope }: { scope: Scope }) {
  const { months, selected, setSelected, isAll } = scope;
  return (
    <>
      <select className="select" value={selected} onChange={(e) => setSelected(e.target.value)} aria-label="Month">
        {months.map((m) => (
          <option key={m.key} value={m.key}>{m.label}</option>
        ))}
        <option value={ALL}>All time</option>
      </select>
      {!isAll && months[0]?.key !== selected && (
        <button className="btn secondary small" onClick={() => setSelected(months[0].key)}>Latest month</button>
      )}
    </>
  );
}
