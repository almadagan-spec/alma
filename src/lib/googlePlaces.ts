export interface PlacePrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  name: string;
  address: string;
  openNow: boolean | null;
  weekdayText: string[];
  phone: string | null;
  website: string | null;
}

/**
 * Google Maps API keys always match /^AIza[0-9A-Za-z_-]{35}$/. Rather than
 * trust the raw env var (a mis-pasted secret can carry leftover text,
 * duplicated content, or stray whitespace around the real key), pull the
 * first substring that matches this exact shape out of whatever is there.
 * This is immune to surrounding garbage in a way that merely stripping
 * invalid characters is not.
 */
const RAW_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const KEY_PATTERN = /AIza[0-9A-Za-z_-]{35}/;
const extractedKey = RAW_API_KEY?.match(KEY_PATTERN)?.[0];
const API_KEY = extractedKey ?? RAW_API_KEY?.replace(/[^A-Za-z0-9_-]/g, "");

if (RAW_API_KEY && !extractedKey) {
  console.warn(
    `[Alma] VITE_GOOGLE_MAPS_API_KEY (length ${RAW_API_KEY.length}) doesn't contain a ` +
      "recognizable Google API key pattern (AIza...). Re-copy the key from Google Cloud Console.",
  );
} else if (RAW_API_KEY && extractedKey !== RAW_API_KEY) {
  console.warn(
    `[Alma] VITE_GOOGLE_MAPS_API_KEY had extra content around the real key (raw length ` +
      `${RAW_API_KEY.length}, extracted length ${extractedKey!.length}). Using the extracted key.`,
  );
}

let scriptLoadingPromise: Promise<void> | null = null;

function isPlacesNamespaceReady(): boolean {
  return Boolean(window.google?.maps?.places?.AutocompleteSuggestion);
}

/**
 * The script's onload event fires once the file has been fetched and
 * executed, but with an async-loading Maps script that isn't always the
 * same moment google.maps.places is fully populated — so poll briefly
 * rather than assuming it's ready the instant onload fires.
 */
function waitForPlacesNamespace(): Promise<void> {
  if (isPlacesNamespaceReady()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (isPlacesNamespaceReady()) {
        resolve();
        return;
      }
      if (Date.now() - start > 10000) {
        reject(new Error("Timed out waiting for the Google Places library to load"));
        return;
      }
      setTimeout(check, 50);
    };
    check();
  });
}

function loadGoogleMapsScript(): Promise<void> {
  if (typeof window !== "undefined" && isPlacesNamespaceReady()) {
    return Promise.resolve();
  }
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => waitForPlacesNamespace().then(resolve).catch(reject);
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

export const isGooglePlacesConfigured = Boolean(API_KEY);

/** Shared with reservationSearch.ts so both use the same Google Cloud API key. */
export const googleApiKey = API_KEY;

/**
 * The script tag below loads the classic way (a direct <script src>, with
 * libraries=places requested up front), not via Google's newer bootstrap
 * loader snippet. That means google.maps.importLibrary is never defined —
 * the places classes are already attached directly on google.maps.places
 * once the script has loaded, so we just return that namespace as-is.
 */
async function getPlacesLibrary(): Promise<typeof google.maps.places> {
  await loadGoogleMapsScript();
  return google.maps.places;
}

let sessionToken: google.maps.places.AutocompleteSessionToken | null = null;

export function newAutocompleteSession(): void {
  sessionToken = null;
}

function readFormattableText(
  value: google.maps.places.FormattableText | null | undefined,
): string {
  return value?.text ?? "";
}

export async function getRestaurantPredictions(
  input: string,
): Promise<PlacePrediction[]> {
  if (!input.trim()) return [];
  if (!isGooglePlacesConfigured) return [];

  try {
    const { AutocompleteSuggestion, AutocompleteSessionToken } =
      await getPlacesLibrary();

    if (!sessionToken) {
      sessionToken = new AutocompleteSessionToken();
    }

    const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input,
      includedPrimaryTypes: ["restaurant"],
      includedRegionCodes: ["il"],
      sessionToken,
    });

    return suggestions
      .map((suggestion) => suggestion.placePrediction)
      .filter((prediction): prediction is google.maps.places.PlacePrediction =>
        Boolean(prediction),
      )
      .map((prediction) => ({
        placeId: prediction.placeId,
        mainText: readFormattableText(prediction.mainText) || readFormattableText(prediction.text),
        secondaryText: readFormattableText(prediction.secondaryText),
      }));
  } catch (error) {
    console.error("[Alma] getRestaurantPredictions failed:", error);
    return [];
  }
}

export async function getPlaceDetails(
  placeId: string,
): Promise<PlaceDetails | null> {
  if (!isGooglePlacesConfigured) return null;

  try {
    const { Place } = await getPlacesLibrary();
    const place = new Place({ id: placeId });
    const { place: result } = await place.fetchFields({
      fields: [
        "displayName",
        "formattedAddress",
        "regularOpeningHours",
        "nationalPhoneNumber",
        "websiteURI",
      ],
    });

    let openNow: boolean | null = null;
    try {
      const value = await result.isOpen();
      openNow = typeof value === "boolean" ? value : null;
    } catch {
      openNow = null;
    }

    return {
      name: result.displayName ?? "",
      address: result.formattedAddress ?? "",
      openNow,
      weekdayText: result.regularOpeningHours?.weekdayDescriptions ?? [],
      phone: result.nationalPhoneNumber ?? null,
      website: result.websiteURI ?? null,
    };
  } catch (error) {
    console.error("[Alma] getPlaceDetails failed:", error);
    return null;
  }
}
