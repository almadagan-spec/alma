import type { PlaceDetails, PlacePrediction } from "./googlePlaces";

interface MockRestaurant {
  name: string;
  area: string;
  address: string;
  openHour: number;
  closeHour: number;
}

const MOCK_RESTAURANTS: MockRestaurant[] = [
  { name: "The Golden Spoon", area: "Downtown", address: "12 Market St, Downtown", openHour: 11, closeHour: 22 },
  { name: "Trattoria Bella", area: "Midtown", address: "48 Elm Ave, Midtown", openHour: 12, closeHour: 23 },
  { name: "Sakura Sushi House", area: "Uptown", address: "7 Cedar Rd, Uptown", openHour: 11, closeHour: 21 },
  { name: "El Fuego Grill", area: "Riverside", address: "230 River Walk, Riverside", openHour: 10, closeHour: 22 },
  { name: "Blue Lotus Thai", area: "Eastside", address: "88 Orchid Ln, Eastside", openHour: 11, closeHour: 22 },
  { name: "Le Petit Bistro", area: "Old Town", address: "5 Cobblestone Sq, Old Town", openHour: 8, closeHour: 21 },
  { name: "Copper Kettle Diner", area: "Westside", address: "301 Sunset Blvd, Westside", openHour: 7, closeHour: 20 },
  { name: "Mango Tree Curry House", area: "Harbor District", address: "19 Pier St, Harbor District", openHour: 12, closeHour: 22 },
  { name: "Stonewood Pizzeria", area: "Downtown", address: "64 Market St, Downtown", openHour: 11, closeHour: 23 },
  { name: "Ocean Pearl Seafood", area: "Marina", address: "2 Harbor View, Marina", openHour: 12, closeHour: 22 },
  { name: "The Rustic Fork", area: "Hillside", address: "77 Hilltop Dr, Hillside", openHour: 9, closeHour: 21 },
  { name: "Bombay Spice Kitchen", area: "Midtown", address: "140 Elm Ave, Midtown", openHour: 11, closeHour: 22 },
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
