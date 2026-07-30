import { useCallback, useEffect, useState } from "react";
import type { RestaurantListItem } from "../types";
import { addListItem, deleteListItem, fetchList, setItemChecked } from "../lib/listApi";

export function useRestaurantList(ownerId: string | null) {
  const [items, setItems] = useState<RestaurantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!ownerId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchList(ownerId);
      setItems(data);
      setError(null);
    } catch {
      setError("Couldn't load this list right now.");
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addRestaurant = async (item: {
    placeId: string;
    name: string;
    address: string | null;
  }) => {
    if (!ownerId) return;
    await addListItem(ownerId, item);
    await reload();
  };

  const toggleRestaurant = async (item: RestaurantListItem) => {
    await setItemChecked(item.id, !item.checked);
    await reload();
  };

  const removeRestaurant = async (item: RestaurantListItem) => {
    await deleteListItem(item.id);
    await reload();
  };

  return { items, loading, error, addRestaurant, toggleRestaurant, removeRestaurant, reload };
}
