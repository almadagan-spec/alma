import reservationDirectory from "../data/reservation-directory.json";

/**
 * Restaurants already researched (by the daily automation, or by hand) —
 * checked first and instantly, client-side, before any network round trip.
 * This is what makes a previously-seen restaurant (Tabit or Ontopo) get its
 * real link the moment it's added, rather than waiting for the next hourly
 * background pass to write it in.
 */
function normalizeDirectoryName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const directoryByName = new Map(
  reservationDirectory.restaurants.map((entry) => [
    normalizeDirectoryName(entry.name),
    entry.url,
  ]),
);

function findInDirectory(name: string): string | null {
  return directoryByName.get(normalizeDirectoryName(name)) ?? null;
}

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
  address?: string;
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
 * ("סלאס" vs "Selas") — different scripts can never text-match. A result
 * count heuristic (small list = confident match) isn't reliable either: a
 * generic name (e.g. "Eats") can return a small-looking list that's still
 * just a coincidental near-match to a *different* venue, producing a wrong
 * link with real-sounding confidence. Address is the strongest available
 * signal — a name collision with a genuinely different venue essentially
 * never also shares a street — so it's checked first, regardless of result
 * count, and only falls back to trusting a small result count when no
 * address data is available to confirm against at all. Kept generous
 * enough to not break already-confirmed real matches ("סלאס" -> 4 results,
 * "הדסון לילינבלום" -> 2), while still well under the batch size (20) a
 * genuinely unmatched query always came back with.
 */
const MAX_TRUSTED_RESULTS_WITHOUT_ADDRESS = 10;

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Only the street segment (before the first comma), not the full address —
 * comparing full addresses lets "Tel Aviv" alone count as a match between
 * two completely unrelated restaurants, since nearly everything in this
 * app is in Tel Aviv.
 */
function streetSegment(address: string): string {
  return address.split(",")[0] ?? address;
}

function addressesLikelyMatch(known: string, candidate: string): boolean {
  const k = normalizeForMatch(streetSegment(known));
  const c = normalizeForMatch(streetSegment(candidate));
  if (!k || !c) return false;
  const meaningfulWords = k.split(" ").filter((word) => word.length >= 3);
  return meaningfulWords.length > 0 && meaningfulWords.some((word) => c.includes(word));
}

export async function findOntopoLink(
  name: string,
  address: string | null,
): Promise<string | null> {
  const url =
    `https://ontopo.com/api/venue_search?slug=${ONTOPO_ISRAEL_DISTRIBUTOR_SLUG}` +
    `&version=1&locale=en&terms=${encodeURIComponent(name)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const venues = extractVenues(await response.json());
    if (venues.length === 0) return null;

    // Only trust the address signal if the response actually carries address
    // data at all — if Ontopo's real response shape turns out not to include
    // it, silently requiring a match against nothing would wrongly reject
    // every result instead of falling back to the count-based check below.
    const anyAddressData = venues.some((venue) => venue.address);
    if (address && anyAddressData) {
      const match = venues.find(
        (venue) => venue.slug && addressesLikelyMatch(address, venue.address ?? ""),
      );
      return match?.slug ? `https://ontopo.com/en/il/page/${match.slug}` : null;
    }

    if (venues.length <= MAX_TRUSTED_RESULTS_WITHOUT_ADDRESS) {
      const first = venues[0];
      return first?.slug ? `https://ontopo.com/en/il/page/${first.slug}` : null;
    }

    return null;
  } catch (error) {
    console.error("[Alma] findOntopoLink failed:", error);
    return null;
  }
}

/**
 * Checks the researched directory first (instant, covers Tabit and any
 * Ontopo restaurant the live search below might miss), then falls back to
 * live Ontopo search for anything not yet researched. Tabit has no known
 * public/unauthenticated search endpoint (unlike Ontopo), so a genuinely
 * new Tabit restaurant still needs the hourly background research pass (or
 * the pencil icon) before it lands in the directory this checks.
 */
export async function findReservationLink(
  name: string,
  address: string | null,
): Promise<string | null> {
  const known = findInDirectory(name);
  if (known) return known;

  return findOntopoLink(name, address);
}
