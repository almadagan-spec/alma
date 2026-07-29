import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../AppContext";
import {
  getPlaceDetails,
  isGooglePlacesConfigured,
  type PlaceDetails,
} from "../lib/googlePlaces";
import { getMockDetails } from "../lib/mockRestaurants";
import "./MyListScreen.css";

type DetailsState =
  | { status: "loading" }
  | { status: "loaded"; details: PlaceDetails }
  | { status: "error" };

function todayHoursLine(weekdayText: string[]): string | null {
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  return weekdayText.find((line) => line.startsWith(todayName)) ?? weekdayText[0] ?? null;
}

export default function MyListScreen() {
  const navigate = useNavigate();
  const { restaurantList } = useAppContext();
  const selected = restaurantList.filter((item) => item.checked);

  const [detailsById, setDetailsById] = useState<Record<string, DetailsState>>({});

  useEffect(() => {
    let cancelled = false;

    selected.forEach((item) => {
      if (!item.placeId) return;

      setDetailsById((prev) => ({ ...prev, [item.id]: { status: "loading" } }));

      const fetchDetails = isGooglePlacesConfigured
        ? getPlaceDetails(item.placeId)
        : Promise.resolve(getMockDetails(item.placeId));

      fetchDetails.then((details) => {
        if (cancelled) return;
        setDetailsById((prev) => ({
          ...prev,
          [item.id]: details ? { status: "loaded", details } : { status: "error" },
        }));
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantList]);

  return (
    <div className="screen my-list-screen">
      <div className="my-list-content">
        <h1>My restaurants</h1>

        {selected.length > 0 ? (
          <ul>
            {selected.map((item) => {
              const state = detailsById[item.id];
              return (
                <li key={item.id}>
                  <span className="main-text">
                    {state?.status === "loaded" ? state.details.name : item.name}
                  </span>

                  {state?.status === "loading" && (
                    <span className="secondary-text">Fetching latest info…</span>
                  )}

                  {state?.status === "error" && (
                    <span className="secondary-text">
                      Couldn't load the latest details right now.
                    </span>
                  )}

                  {state?.status === "loaded" && (
                    <>
                      <span className="secondary-text">{state.details.address}</span>
                      <span className="hours-row">
                        {state.details.openNow !== null && (
                          <span
                            className={`status-badge ${state.details.openNow ? "open" : "closed"}`}
                          >
                            {state.details.openNow ? "Open now" : "Closed now"}
                          </span>
                        )}
                        {todayHoursLine(state.details.weekdayText) && (
                          <span className="hours-text">
                            {todayHoursLine(state.details.weekdayText)}
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty-list-text">No restaurants checked yet.</p>
        )}

        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/search")}
        >
          Back to search
        </button>
      </div>
    </div>
  );
}
