import type { PlaceDetails, PlacePrediction, ReservationDetails } from "./googlePlaces";
import type { OpeningPeriod } from "./openingHours";

interface MockRestaurant {
  name: string;
  area: string;
  address: string;
  openHour: number;
  closeHour: number;
  phone: string | null;
  website: string | null;
}

const MOCK_RESTAURANTS: MockRestaurant[] = [
  { name: "The Golden Spoon", area: "Downtown", address: "12 Market St, Downtown", openHour: 11, closeHour: 22, phone: "(555) 010-1234", website: "https://example.com/golden-spoon" },
  { name: "Trattoria Bella", area: "Midtown", address: "48 Elm Ave, Midtown", openHour: 12, closeHour: 23, phone: "(555) 010-2345", website: null },
  { name: "Sakura Sushi House", area: "Uptown", address: "7 Cedar Rd, Uptown", openHour: 11, closeHour: 21, phone: "(555) 010-3456", website: "https://example.com/sakura-sushi" },
  { name: "El Fuego Grill", area: "Riverside", address: "230 River Walk, Riverside", openHour: 10, closeHour: 22, phone: "(555) 010-4567", website: "https://example.com/el-fuego" },
  { name: "Blue Lotus Thai", area: "Eastside", address: "88 Orchid Ln, Eastside", openHour: 11, closeHour: 22, phone: "(555) 010-5678", website: null },
  { name: "Le Petit Bistro", area: "Old Town", address: "5 Cobblestone Sq, Old Town", openHour: 8, closeHour: 21, phone: "(555) 010-6789", website: "https://example.com/petit-bistro" },
  { name: "Copper Kettle Diner", area: "Westside", address: "301 Sunset Blvd, Westside", openHour: 7, closeHour: 20, phone: null, website: null },
  { name: "Mango Tree Curry House", area: "Harbor District", address: "19 Pier St, Harbor District", openHour: 12, closeHour: 22, phone: "(555) 010-7890", website: "https://example.com/mango-tree" },
  { name: "Stonewood Pizzeria", area: "Downtown", address: "64 Market St, Downtown", openHour: 11, closeHour: 23, phone: "(555) 010-8901", website: "https://example.com/stonewood" },
  { name: "Ocean Pearl Seafood", area: "Marina", address: "2 Harbor View, Marina", openHour: 12, closeHour: 22, phone: "(555) 010-9012", website: null },
  { name: "The Rustic Fork", area: "Hillside", address: "77 Hilltop Dr, Hillside", openHour: 9, closeHour: 21, phone: "(555) 010-0123", website: "https://example.com/rustic-fork" },
  { name: "Bombay Spice Kitchen", area: "Midtown", address: "140 Elm Ave, Midtown", openHour: 11, closeHour: 22, phone: "(555) 010-1122", website: "https://example.com/bombay-spice" },
];

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

function findMockRestaurant(placeId: string): MockRestaurant | undefined {
  return MOCK_RESTAURANTS.find((r) => `mock-${r.name}` === placeId);
}

function buildDailyPeriods(openHour: number, closeHour: number): OpeningPeriod[] {
  return Array.from({ length: 7 }, (_, day) => ({
    open: { day, hours: openHour, minutes: 0 },
    close: { day, hours: closeHour, minutes: 0 },
  }));
}

export function getMockPredictions(input: string): PlacePrediction[] {
  const query = input.trim().toLowerCase();
  if (!query) return [];
  return MOCK_RESTAURANTS.filter((r) => r.name.toLowerCase().includes(query)).map(
    (r) => ({
      placeId: `mock-${r.name}`,
      mainText: r.name,
      secondaryText: r.area,
    }),
  );
}

export function getMockDetails(placeId: string): PlaceDetails | null {
  const restaurant = findMockRestaurant(placeId);
  if (!restaurant) return null;

  const now = new Date();
  const openNow = now.getHours() >= restaurant.openHour && now.getHours() < restaurant.closeHour;
  const hoursText = `${formatHour(restaurant.openHour)} – ${formatHour(restaurant.closeHour)}`;

  return {
    name: restaurant.name,
    address: restaurant.address,
    openNow,
    weekdayText: WEEKDAYS.map((day) => `${day}: ${hoursText}`),
  };
}

export function getMockReservationDetails(placeId: string): ReservationDetails | null {
  const restaurant = findMockRestaurant(placeId);
  if (!restaurant) return null;

  return {
    name: restaurant.name,
    address: restaurant.address,
    phone: restaurant.phone,
    website: restaurant.website,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + " " + restaurant.address)}`,
    periods: buildDailyPeriods(restaurant.openHour, restaurant.closeHour),
  };
}
