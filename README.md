# Alma — Restaurant Reservations

A one-stop app for building your own restaurant reservation list.

## Current flow

1. **Sign up** (`/signup`) — real accounts via Supabase Auth: full name,
   email, phone number, password, repeat password. Passwords must match
   before "Save and continue" is enabled. If the project requires email
   confirmation, a "check your email" screen follows instead of signing
   you straight in. **Log in** (`/login`) handles returning users.
2. **Welcome** (`/welcome`) — a single centered "Create your restaurant
   list" button.
3. **Search** (`/search`) — a search bar titled "Type restaurant name"
   with live autocomplete. Selecting a suggestion adds it to your list,
   checked.
4. **My restaurants** (`/my-list`) — the full list with live address and
   hours from Google, a `+` popup to add more, a reservation link per
   restaurant ("Reserve on Tabit" / "Reserve on Ontopo" / a tap-to-call
   number), a **Share list** button, and a **Shared with me** button.
5. **Share list** — enter an email; once that person creates an account
   (or logs in) with the same address, your list appears for them under
   "Shared with me."
6. **Shared with me** (`/shared`) — every list shared with you, by owner
   name. Opening one (`/shared/:ownerId`) shows the same list view,
   fully editable — you can add restaurants to someone else's shared
   list the same way you would your own.

Accounts and restaurant lists live in Supabase (Postgres), not
`localStorage`, so they're real across devices and browsers.

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

For the deployed site, add the same key as a repository secret instead
(see Deployment below).

## Reservation links (Tabit / Ontopo)

Each restaurant shows a "Reserve on Tabit" / "Reserve on Ontopo" link when
one can be found; otherwise it falls back to a phone link, or a link you
enter yourself via the pencil icon on that restaurant (which always takes
priority over auto-detection).

Ontopo links are found automatically, with no setup needed: it queries
Ontopo's own (unauthenticated) restaurant search, live in the browser.

### The reservation directory (Tabit, and an Ontopo backstop)

Tabit has no public search endpoint (unlike Ontopo), so there's no way
for the site itself to look one up live. `data/reservation-directory.json`
is a manually-researched list of restaurant name -> reservation link
(Tabit or Ontopo), and `.github/workflows/apply-reservation-links.yml`
applies it to every account's list hourly (or on demand via "Run
workflow"), writing straight into the database with the Supabase
**service role** key — bypassing row-level security, since this is a
trusted server-side job, not part of the deployed website. It also
covers Ontopo restaurants the live browser search happens to miss.

Two ways entries get added:
- **A scheduled Claude Routine** ("Alma: research new reservation links")
  runs hourly, a few minutes after the apply job: it reads that job's log
  for `UNMATCHED: <name>` lines (restaurants with no link and no directory
  entry), researches each via web search, adds any it can confidently
  identify to the directory, pushes, and re-triggers the apply job — so a
  newly-added restaurant gets linked without anyone needing to ask,
  typically within about an hour (true instant lookup isn't possible
  without a paid always-on AI service wired to a database webhook).
- **By hand**: append `{ "name": ..., "url": ... }`, matching the name
  exactly as it's saved in the app (Hebrew or English, whichever Google
  lists it as — add both if unsure). Picked up on the next run.

Once a link is set (directory, live search, or the pencil icon) it's
saved and not looked up again.

**Setup**: add a `SUPABASE_SERVICE_ROLE_KEY` repository secret (Project
Settings -> API -> reveal the **secret key**/`service_role` key in
Supabase — not the anon key used elsewhere, and never put this one in
`.env` or anywhere it could reach the deployed site's code).

## Accounts and sharing (Supabase)

Real accounts and list sharing run on [Supabase](https://supabase.com)
(Postgres + Auth, free tier). One-time setup:

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run `supabase/schema.sql` — it creates the
   `profiles`, `list_items`, and `list_shares` tables plus the row-level
   security policies that let a list be read/edited by its owner or
   anyone the owner has shared it with.
3. From **Project Settings → API**, copy the **Project URL** and the
   **`anon` `public`** key (not `service_role`).
4. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`.

For the deployed site, add both as repository secrets instead (see
Deployment below).

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

To have the deployed site use real Google Places data and/or real
accounts, add repository secrets (**Settings → Secrets and variables →
Actions**) named `VITE_GOOGLE_MAPS_API_KEY`, `VITE_SUPABASE_URL`, and
`VITE_SUPABASE_ANON_KEY`, then re-run the workflow.

The app uses `HashRouter` (URLs look like `.../#/search`) specifically
so it works on static hosts like GitHub Pages without any server-side
rewrite rules — a hard refresh or a shared link to any screen works
correctly.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run lint` — run oxlint
