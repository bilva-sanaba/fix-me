# data/

Drop real Slack exports here for local use. JSON files in this folder are
git-ignored. To load them, use the **Upload Slack export** button in the app
and select the day files (plus `users.json` if you have it).

If we later want the export baked into the build instead of uploaded, point
`src/App.tsx` at a JSON file here and adjust `.gitignore`.
