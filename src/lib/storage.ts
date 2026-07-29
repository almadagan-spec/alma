import type { RestaurantListItem, User } from "../types";

const USER_KEY = "alma_user";
const LIST_KEY = "alma_restaurant_list";

export function loadUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function saveUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadRestaurantList(): RestaurantListItem[] {
  const raw = localStorage.getItem(LIST_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RestaurantListItem[];
  } catch {
    return [];
  }
}

export function saveRestaurantList(list: RestaurantListItem[]): void {
  localStorage.setItem(LIST_KEY, JSON.stringify(list));
}
