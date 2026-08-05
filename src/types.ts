export interface Profile {
  id: string;
  fullName: string;
  phone: string | null;
}

export interface RestaurantListItem {
  id: string;
  ownerId: string;
  placeId: string;
  name: string;
  address: string | null;
  checked: boolean;
  reservationUrl: string | null;
}
