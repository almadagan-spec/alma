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
}

function extractVenues(data: unknown): OntopoVenue[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const obj = data as { venues?: OntopoVenue[]; results?: OntopoVenue[] };
    return obj.venues ?? obj.results ?? [];
  }
  return [];
}

/**
 * Comparing names as text doesn't work: Google often stores a restaurant's
 * name in Hebrew while Ontopo's `locale=en` results come back transliterated
 * ("סלאס" vs "Selas") — different scripts can never text-match. Instead,
 * use what real search results look like: Ontopo pads out to a full batch
 * of MAX_UNMATCHED_RESULTS generic/popular venues when it has no genuine
 * match, but returns a short, focused list when it does. A restaurant with
 * a real match ("סלאס" -> 4 results, "הדסון לילינבלום" -> 2 results) stays
 * well under that count; an unmatched query (confirmed Tabit-only
 * restaurants, and other non-Ontopo names) always came back with exactly
 * MAX_UNMATCHED_RESULTS.
 */
const MAX_UNMATCHED_RESULTS = 20;

export async function findOntopoLink(name: string): Promise<string | null> {
  const url =
    `https://ontopo.com/api/venue_search?slug=${ONTOPO_ISRAEL_DISTRIBUTOR_SLUG}` +
    `&version=1&locale=en&terms=${encodeURIComponent(name)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const venues = extractVenues(await response.json());
    if (venues.length === 0 || venues.length >= MAX_UNMATCHED_RESULTS) return null;

    const first = venues[0];
    if (!first?.slug) return null;

    return `https://ontopo.com/en/il/page/${first.slug}`;
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
