import { googleApiKey } from "./googlePlaces";

const SEARCH_ENGINE_ID = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID as
  | string
  | undefined;

export const isReservationSearchConfigured = Boolean(googleApiKey && SEARCH_ENGINE_ID);

interface CustomSearchItem {
  link: string;
}

interface CustomSearchResponse {
  items?: CustomSearchItem[];
}

/**
 * Looks up a restaurant's Tabit/Ontopo booking page via Google's Custom
 * Search API, since neither platform exposes a directory to query directly.
 * Best-effort: returns null on no match, no configuration, or any error —
 * callers should fall back to phone/none, same as the manual-detection path.
 */
export async function findReservationLink(
  name: string,
  address: string | null,
): Promise<string | null> {
  if (!isReservationSearchConfigured) return null;

  const query = `${name} ${address ?? ""} tabit OR ontopo reservation`.trim();
  const url =
    `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}` +
    `&cx=${SEARCH_ENGINE_ID}&num=5&q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = (await response.json()) as CustomSearchResponse;
    const match = data.items?.find((item) => /tabit|ontopo/i.test(item.link));
    return match?.link ?? null;
  } catch (error) {
    console.error("[Alma] findReservationLink failed:", error);
    return null;
  }
}
