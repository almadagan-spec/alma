import { useEffect, useRef, useState } from "react";
import {
  getRestaurantPredictions,
  isGooglePlacesConfigured,
  newAutocompleteSession,
  type PlacePrediction,
} from "../lib/googlePlaces";
import { getMockPredictions } from "../lib/mockRestaurants";
import "./RestaurantAutocomplete.css";

interface RestaurantAutocompleteProps {
  onSelect: (prediction: PlacePrediction) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** placeIds already in the user's list, so matching results show checked. */
  existingPlaceIds?: Set<string>;
}

export default function RestaurantAutocomplete({
  onSelect,
  placeholder,
  autoFocus,
  existingPlaceIds,
}: RestaurantAutocompleteProps) {
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
    onSelect(prediction);
    setQuery("");
    setPredictions([]);
    setIsOpen(false);
    newAutocompleteSession();
  };

  return (
    <div className="restaurant-autocomplete">
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
          placeholder={placeholder ?? "e.g. Sakura Sushi House"}
          autoFocus={autoFocus}
        />

        {isOpen && predictions.length > 0 && (
          <ul className="autocomplete-list">
            {predictions.map((p) => (
              <li key={p.placeId}>
                <button type="button" onClick={() => handleSelect(p)}>
                  <input
                    type="checkbox"
                    checked={existingPlaceIds?.has(p.placeId) ?? false}
                    readOnly
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                  <span className="list-item-text">
                    <span className="main-text">{p.mainText}</span>
                    {p.secondaryText && (
                      <span className="secondary-text">{p.secondaryText}</span>
                    )}
                  </span>
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
    </div>
  );
}
