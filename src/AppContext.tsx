import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { RestaurantListItem, User } from "./types";
import {
  loadRestaurantList,
  loadUser,
  saveRestaurantList,
  saveUser,
} from "./lib/storage";

interface AppContextValue {
  user: User | null;
  setUser: (user: User) => void;
  restaurantList: RestaurantListItem[];
  addRestaurant: (item: RestaurantListItem) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => loadUser());
  const [restaurantList, setRestaurantList] = useState<RestaurantListItem[]>(
    () => loadRestaurantList(),
  );

  const setUser = (nextUser: User) => {
    saveUser(nextUser);
    setUserState(nextUser);
  };

  const addRestaurant = (item: RestaurantListItem) => {
    setRestaurantList((prev) => {
      if (prev.some((existing) => existing.id === item.id)) return prev;
      const next = [...prev, item];
      saveRestaurantList(next);
      return next;
    });
  };

  const value = useMemo(
    () => ({ user, setUser, restaurantList, addRestaurant }),
    [user, restaurantList],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
