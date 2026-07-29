# Alma — Restaurant Reservations

A one-stop app for building your own restaurant reservation list.

## Current flow

1. **Sign up** (`/signup`) — first-time users enter full name, email,
   phone number, password, and repeat password. If the passwords don't
   match, both fields outline in red and "Save and continue" is disabled
   until they match.
2. **Welcome** (`/welcome`) — a single centered "Create your restaurant
   list" button.
3. **Search** (`/search`) — a search bar titled "Type restaurant name"
   with live autocomplete. Selecting a suggestion adds it to your list,
   checked.
4. **My restaurants** (`/my-list`) — the full list with live address and
   hours from Google, a `+` popup to add more, and a reservation link per
   restaurant: "Reserve on Tabit" / "Reserve on Ontopo" when detected, a
   tap-to-call number otherwise.

State (user + list) is persisted to `localStorage`, so reloading keeps
you on the right screen.

## Getting started

```bash
npm install
npm run dev
```

## Restaurant autocomplete (Google Places)

The search screen uses the Google Places Autocomplete API. Without a
key configured, it falls back to a small built-in sample dataset so the
app is fully demoable out of the box.

To enable real search results:

1. Create a key in the [Google Cloud Console](https://console.cloud.google.com/)
   with the **Places API** enabled.
2. Copy `.env.example` to `.env` and set `VITE_GOOGLE_MAPS_API_KEY`.
3. Restart `npm run dev`.

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` builds and deploys the app to GitHub
Pages on every push to `claude/restaurant-reservation-app-o6g001`.

**One-time setup** (can't be done from a workflow file — do this once in
the repo's web UI): go to **Settings → Pages** and set **Source** to
**GitHub Actions**. After that, every push to the branch above
redeploys automatically, and the app is live at:

```
https://almadagan-spec.github.io/alma/
```

To have the deployed site use real Google Places data instead of demo
data, add a repository secret named `VITE_GOOGLE_MAPS_API_KEY`
(**Settings → Secrets and variables → Actions**) with your API key, then
re-run the workflow.

The app uses `HashRouter` (URLs look like `.../#/search`) specifically
so it works on static hosts like GitHub Pages without any server-side
rewrite rules — a hard refresh or a shared link to any screen works
correctly.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run lint` — run oxlint
