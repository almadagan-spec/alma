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

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

let scriptLoadingPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (typeof window !== "undefined" && window.google?.maps) {
    return Promise.resolve();
  }
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

export const isGooglePlacesConfigured = Boolean(API_KEY);

let placesLibraryPromise: Promise<google.maps.PlacesLibrary> | null = null;

async function getPlacesLibrary(): Promise<google.maps.PlacesLibrary> {
  await loadGoogleMapsScript();
  if (!placesLibraryPromise) {
    placesLibraryPromise = google.maps.importLibrary(
      "places",
    ) as Promise<google.maps.PlacesLibrary>;
  }
  return placesLibraryPromise;
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
