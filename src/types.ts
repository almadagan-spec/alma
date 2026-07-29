export interface User {
  fullName: string;
  email: string;
  phone: string;
}

export interface RestaurantListItem {
  id: string;
  name: string;
  address?: string;
  placeId?: string;
  checked: boolean;
}
