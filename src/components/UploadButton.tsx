import { useRef } from "react";
import { parseUploads } from "../lib/slack";
import type { Cart } from "../lib/types";

interface Props {
  onLoaded: (carts: Cart[], sourceLabel: string) => void;
  onError: (message: string) => void;
}

/**
 * Lets someone drop in a Slack export without redeploying. Select one or many
 * JSON files at once (day files + users.json is fine).
 */
export function UploadButton({ onLoaded, onError }: Props) {
  const input = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    try {
      const docs = await Promise.all([...files].map(async (f) => JSON.parse(await f.text()) as unknown));
      const carts = parseUploads(docs);
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
      <input ref={input} type="file" accept=".json,application/json" multiple hidden onChange={(e) => void handleFiles(e.target.files)} />
      <button className="btn" onClick={() => input.current?.click()}>Upload Slack export</button>
    </>
  );
}
