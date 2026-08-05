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

export async function findOntopoLink(name: string): Promise<string | null> {
  const url =
    `https://ontopo.com/api/venue_search?slug=${ONTOPO_ISRAEL_DISTRIBUTOR_SLUG}` +
    `&version=1&locale=en&terms=${encodeURIComponent(name)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const venues = extractVenues(await response.json());
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
