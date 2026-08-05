/**
 * Ontopo has no official public API, but its own web app calls this
 * unauthenticated GET endpoint to power its "find a restaurant" search box.
 * Slug 15171493 is Ontopo's Israel distributor ID (constant across venues).
 * No API key needed. Best-effort: returns null on no match, a network/CORS
 * failure, or an unexpected response shape — callers fall back to
 * phone/manual entry either way.
 */
const ONTOPO_ISRAEL_DISTRIBUTOR_SLUG = "15171493";

interface OntopoVenue {
  slug?: string;
  title?: string;
  name?: string;
}

function extractVenues(data: unknown): OntopoVenue[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const obj = data as { venues?: OntopoVenue[]; results?: OntopoVenue[] };
    return obj.venues ?? obj.results ?? [];
  }
  return [];
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Ontopo's search is fuzzy and can return a "closest" result even for a
 * restaurant it doesn't actually have (e.g. a Tabit-only place) — so a
 * result existing isn't enough; require its name to actually match the
 * one we searched for before trusting it. Exact-after-normalizing only:
 * a loose substring check (e.g. "Bar" inside "Bar 51") let mismatches
 * through, and a wrong reservation link is worse than none at all.
 */
function namesLikelyMatch(query: string, candidate: string): boolean {
  const q = normalize(query);
  const c = normalize(candidate);
  return Boolean(q) && q === c;
}

export async function findOntopoLink(name: string): Promise<string | null> {
  const url =
    `https://ontopo.com/api/venue_search?slug=${ONTOPO_ISRAEL_DISTRIBUTOR_SLUG}` +
    `&version=1&locale=en&terms=${encodeURIComponent(name)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const venues = extractVenues(await response.json());
    // Temporary diagnostic: log what Ontopo actually returns for each name,
    // so the matching rule can be tuned against real data instead of guesses.
    console.log(
      `[Alma] Ontopo search "${name}" ->`,
      venues.map((v) => v.title ?? v.name ?? "(no title)"),
    );

    const match = venues.find(
      (venue) => venue.slug && namesLikelyMatch(name, venue.title ?? venue.name ?? ""),
    );
    if (!match?.slug) return null;

    return `https://ontopo.com/en/il/page/${match.slug}`;
  } catch (error) {
    console.error("[Alma] findOntopoLink failed:", error);
    return null;
  }
}

/**
 * Tabit has no known public/unauthenticated search endpoint (unlike
 * Ontopo) — no automatic lookup is available for it yet. Restaurants on
 * Tabit still work via manual entry (the pencil icon) or auto-detection
 * from Google's listed website when it happens to point at Tabit directly.
 */
export async function findReservationLink(
  name: string,
  _address: string | null,
): Promise<string | null> {
  return findOntopoLink(name);
}
