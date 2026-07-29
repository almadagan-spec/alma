import type { PlacePrediction } from "./googlePlaces";

const MOCK_RESTAURANTS: Array<{ name: string; area: string }> = [
  { name: "The Golden Spoon", area: "Downtown" },
  { name: "Trattoria Bella", area: "Midtown" },
  { name: "Sakura Sushi House", area: "Uptown" },
  { name: "El Fuego Grill", area: "Riverside" },
  { name: "Blue Lotus Thai", area: "Eastside" },
  { name: "Le Petit Bistro", area: "Old Town" },
  { name: "Copper Kettle Diner", area: "Westside" },
  { name: "Mango Tree Curry House", area: "Harbor District" },
  { name: "Stonewood Pizzeria", area: "Downtown" },
  { name: "Ocean Pearl Seafood", area: "Marina" },
  { name: "The Rustic Fork", area: "Hillside" },
  { name: "Bombay Spice Kitchen", area: "Midtown" },
];

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
