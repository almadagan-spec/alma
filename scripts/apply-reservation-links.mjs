// Applies data/tabit-directory.json to every account's saved restaurant list.
// Run by .github/workflows/apply-reservation-links.yml on a schedule, using
// the Supabase service role key (bypasses row-level security — this is a
// trusted server-side job, never exposed to the deployed website itself).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const RAW_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !RAW_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

// Same lesson as the Google Maps key earlier in this project: a key copied
// from a "reveal" UI can end up with leftover masking characters instead of
// the real value. These are opaque tokens with no published fixed format,
// so only trim surrounding whitespace and check the one thing that IS
// documented (the sb_secret_ prefix) — anything stricter risks rejecting a
// genuinely valid key, which is worse than letting Supabase's own server
// be the real judge.
const KEY_PATTERN = /sb_secret_\S+/;
const extractedKey = RAW_SERVICE_ROLE_KEY.trim().match(KEY_PATTERN)?.[0];
if (!extractedKey) {
  console.error(
    `SUPABASE_SERVICE_ROLE_KEY (length ${RAW_SERVICE_ROLE_KEY.length}) doesn't contain an ` +
      "sb_secret_... prefix. Re-copy it from Supabase's API settings.",
  );
  process.exit(1);
}
const SERVICE_ROLE_KEY = extractedKey;

const dirPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "data",
  "tabit-directory.json",
);
const directory = JSON.parse(readFileSync(dirPath, "utf-8")).restaurants;

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const byName = new Map(directory.map((entry) => [normalize(entry.name), entry.url]));

async function supabaseFetch(pathAndQuery, init = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  }
  return response.status === 204 ? null : response.json();
}

const rows = await supabaseFetch(
  "list_items?select=id,name,reservation_url&reservation_url=is.null",
);

console.log(`Checking ${rows.length} restaurant(s) with no reservation link yet.`);

let updated = 0;
for (const row of rows) {
  const url = byName.get(normalize(row.name));
  if (!url) continue;

  await supabaseFetch(`list_items?id=eq.${row.id}`, {
    method: "PATCH",
    body: JSON.stringify({ reservation_url: url }),
  });
  console.log(`Set reservation link for "${row.name}" -> ${url}`);
  updated += 1;
}

console.log(`Done. Updated ${updated} of ${rows.length} restaurant(s).`);
