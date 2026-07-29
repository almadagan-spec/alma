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
  if (typeof window !== "undefined" && window.google?.maps?.places) {
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

let autocompleteService: google.maps.places.AutocompleteService | null = null;
let sessionToken: google.maps.places.AutocompleteSessionToken | null = null;
let placesService: google.maps.places.PlacesService | null = null;

function getPlacesService(): google.maps.places.PlacesService {
  if (!placesService) {
    placesService = new window.google.maps.places.PlacesService(
      document.createElement("div"),
    );
  }
  return placesService;
}

export const isGooglePlacesConfigured = Boolean(API_KEY);

export function newAutocompleteSession(): void {
  if (window.google?.maps?.places) {
    sessionToken = new window.google.maps.places.AutocompleteSessionToken();
  }
}

export async function getRestaurantPredictions(
  input: string,
): Promise<PlacePrediction[]> {
  if (!input.trim()) return [];
  if (!isGooglePlacesConfigured) return [];

  await loadGoogleMapsScript();

  if (!autocompleteService) {
    autocompleteService = new window.google.maps.places.AutocompleteService();
  }
  if (!sessionToken) {
    newAutocompleteSession();
  }

  return new Promise((resolve) => {
    autocompleteService!.getPlacePredictions(
      {
        input,
        types: ["restaurant"],
        sessionToken: sessionToken ?? undefined,
      },
      (predictions, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
          resolve([]);
          return;
        }
        resolve(
          predictions.map((p) => ({
            placeId: p.place_id,
            mainText: p.structured_formatting.main_text,
            secondaryText: p.structured_formatting.secondary_text ?? "",
          })),
        );
      },
    );
  });
}

export async function getPlaceDetails(
  placeId: string,
): Promise<PlaceDetails | null> {
  if (!isGooglePlacesConfigured) return null;

  await loadGoogleMapsScript();
  const service = getPlacesService();

  return new Promise((resolve) => {
    service.getDetails(
      {
        placeId,
        fields: [
          "name",
          "formatted_address",
          "opening_hours",
          "formatted_phone_number",
          "website",
        ],
      },
      (place, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) {
          resolve(null);
          return;
        }
        resolve({
          name: place.name ?? "",
          address: place.formatted_address ?? "",
          openNow: place.opening_hours?.isOpen?.() ?? null,
          weekdayText: place.opening_hours?.weekday_text ?? [],
          phone: place.formatted_phone_number ?? null,
          website: place.website ?? null,
        });
      },
    );
  });
}
