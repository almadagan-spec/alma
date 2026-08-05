// Checks every URL in src/data/reservation-directory.json still resolves.
// Run daily by .github/workflows/verify-reservation-links.yml. Pure HTTP
// check — no database access, no credentials needed. Logs BROKEN: lines
// for a Claude Routine to re-research and fix, same pattern as UNMATCHED:
// lines from apply-reservation-links.mjs.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dirPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "data",
  "reservation-directory.json",
);
const directory = JSON.parse(readFileSync(dirPath, "utf-8")).restaurants;

// Multiple names can share the same URL (English/Hebrew variants) — check
// each unique URL once.
const uniqueUrls = [...new Set(directory.map((entry) => entry.url))];

console.log(`Checking ${uniqueUrls.length} unique reservation link(s).`);

let broken = 0;
for (const url of uniqueUrls) {
  const names = directory.filter((entry) => entry.url === url).map((entry) => entry.name);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; alma-link-check/1.0)" },
    });
    if (response.ok) {
      console.log(`OK (${response.status}): ${url}`);
    } else {
      console.log(`BROKEN: ${names.join(" / ")} -> ${url} (status ${response.status})`);
      broken += 1;
    }
  } catch (error) {
    console.log(`BROKEN: ${names.join(" / ")} -> ${url} (${error.message})`);
    broken += 1;
  }
}

console.log(`Done. ${broken} of ${uniqueUrls.length} link(s) broken.`);
