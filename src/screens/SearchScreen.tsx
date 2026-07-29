import { useEffect, useRef, useState } from "react";
import { useAppContext } from "../AppContext";
import {
  getRestaurantPredictions,
  isGooglePlacesConfigured,
  newAutocompleteSession,
  type PlacePrediction,
} from "../lib/googlePlaces";
import { getMockPredictions } from "../lib/mockRestaurants";
import "./SearchScreen.css";

export default function SearchScreen() {
  const { restaurantList, addRestaurant } = useAppContext();
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const results = isGooglePlacesConfigured
        ? await getRestaurantPredictions(query)
        : getMockPredictions(query);
      setPredictions(results);
      setIsOpen(true);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (prediction: PlacePrediction) => {
    addRestaurant({
      id: prediction.placeId,
      name: prediction.mainText,
      address: prediction.secondaryText,
      placeId: prediction.placeId,
    });
    setQuery("");
    setPredictions([]);
    setIsOpen(false);
    newAutocompleteSession();
  };

  return (
    <div className="screen search-screen">
      <div className="search-content">
        <h1>Type restaurant name</h1>

        {!isGooglePlacesConfigured && (
          <p className="demo-notice">
            Demo mode: showing sample results. Add VITE_GOOGLE_MAPS_API_KEY to
            search real places.
          </p>
        )}

        <div className="search-bar-wrap">
          <input
            type="text"
            className="search-bar"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => predictions.length > 0 && setIsOpen(true)}
            placeholder="e.g. Sakura Sushi House"
            autoFocus
          />

          {isOpen && predictions.length > 0 && (
            <ul className="autocomplete-list">
              {predictions.map((p) => (
                <li key={p.placeId}>
                  <button type="button" onClick={() => handleSelect(p)}>
                    <span className="main-text">{p.mainText}</span>
                    {p.secondaryText && (
                      <span className="secondary-text">{p.secondaryText}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {isOpen && query.trim() && predictions.length === 0 && (
            <ul className="autocomplete-list">
              <li className="no-results">No restaurants found</li>
            </ul>
          )}
        </div>

        {restaurantList.length > 0 && (
          <div className="my-list">
            <h2>Your list</h2>
            <ul>
              {restaurantList.map((item) => (
                <li key={item.id}>
                  <span className="main-text">{item.name}</span>
                  {item.address && (
                    <span className="secondary-text">{item.address}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
