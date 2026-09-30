# DoorDash Cart Analytics

Small dashboard over DoorDash group carts posted in Slack. Answers things like
who makes the most carts, which carts get the most reactions, which restaurants
get carted most, and which days of the week people order.

## Run it

```sh
bun install   # or npm install
bun dev       # or npm run dev
```

Opens on http://localhost:5173 with sample data. Click **Upload Slack export**
and select the channel's day JSON files (multi-select works, `users.json` optional).

## Layout

| Path | What |
|---|---|
| `src/lib/types.ts` | `Cart`, the normalized record everything else reads |
| `src/lib/slack.ts` | Slack export -> `Cart[]`. Cart detection + restaurant extraction heuristics live here and will need tuning against the real export |
| `src/lib/analytics.ts` | Pure aggregation helpers (by creator, by restaurant, by weekday, top reacted, summary) |
| `src/components/` | Stat tiles, ranked bar card (chart/table toggle), top carts table, upload button |
| `src/data/sample-carts.json` | Fake data so the page renders before real data lands |
| `data/` | Git-ignored spot for real exports |

## Adding an analysis

1. Add a function in `src/lib/analytics.ts` that takes `Cart[]` and returns `RankedRow[]` (or whatever shape you need).
2. Render it in `src/App.tsx` with `RankedBarCard` or a new component.
