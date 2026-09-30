import { useRef } from "react";
import { parseCartsCsv } from "../lib/csv";
import { parseUploads } from "../lib/slack";
import type { Cart } from "../lib/types";

interface Props {
  onLoaded: (carts: Cart[], sourceLabel: string) => void;
  onError: (message: string) => void;
}

/**
 * Lets someone drop in a cart CSV or a Slack export without redeploying. Select
 * one or many files at once (CSV, or JSON day files + users.json).
 */
export function UploadButton({ onLoaded, onError }: Props) {
  const input = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    try {
      const isCsv = (f: File) => f.name.toLowerCase().endsWith(".csv");
      const list = [...files];
      const csvCarts = (await Promise.all(list.filter(isCsv).map(async (f) => parseCartsCsv(await f.text())))).flat();
      const docs = await Promise.all(list.filter((f) => !isCsv(f)).map(async (f) => JSON.parse(await f.text()) as unknown));
      const carts = [...csvCarts, ...(docs.length ? parseUploads(docs) : [])];
      const label = files.length === 1 ? files[0].name : `${files.length} files`;
      onLoaded(carts, label);
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  return (
    <>
      <input ref={input} type="file" accept=".csv,text/csv,.json,application/json" multiple hidden onChange={(e) => void handleFiles(e.target.files)} />
      <button className="btn" onClick={() => input.current?.click()}>Upload CSV / Slack export</button>
    </>
  );
}
