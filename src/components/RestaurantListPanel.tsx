import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import RestaurantAutocomplete from "./RestaurantAutocomplete";
import ShareListModal from "./ShareListModal";
import { useRestaurantList } from "../hooks/useRestaurantList";
import {
  getPlaceDetails,
  isGooglePlacesConfigured,
  type PlaceDetails,
} from "../lib/googlePlaces";
import { getMockDetails } from "../lib/mockRestaurants";
import { getReservationLink } from "../lib/reservationPlatform";
import "./RestaurantListPanel.css";

type DetailsState =
  | { status: "loading" }
  | { status: "loaded"; details: PlaceDetails }
  | { status: "error" };

function todayHoursLine(weekdayText: string[]): string | null {
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  return weekdayText.find((line) => line.startsWith(todayName)) ?? weekdayText[0] ?? null;
}

interface RestaurantListPanelProps {
  ownerId: string;
  title: string;
  canShare: boolean;
}

export default function RestaurantListPanel({
  ownerId,
  title,
  canShare,
}: RestaurantListPanelProps) {
  const navigate = useNavigate();
  const { items, loading, error, addRestaurant } = useRestaurantList(ownerId);
  const selected = items.filter((item) => item.checked);

  const [detailsById, setDetailsById] = useState<Record<string, DetailsState>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    selected.forEach((item) => {
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
  }, [items]);

  return (
    <div className="restaurant-list-panel">
      <div className="list-header">
        <h1>{title}</h1>
        <div className="header-actions">
          <button
            type="button"
            className="add-button"
            onClick={() => setIsAddOpen(true)}
            aria-label="Add a restaurant"
          >
            +
          </button>
          {canShare && (
            <>
              <button
                type="button"
                className="share-button"
                onClick={() => setIsShareOpen(true)}
              >
                Share list
              </button>
              <button
                type="button"
                className="shared-with-me-button"
                onClick={() => navigate("/shared")}
              >
                Shared with me
              </button>
            </>
          )}
        </div>
      </div>

      {loading && <p className="hint-text">Loading…</p>}
      {error && <p className="hint-text">{error}</p>}

      {!loading &&
        !error &&
        (selected.length > 0 ? (
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
                      {(() => {
                        const link = getReservationLink(
                          state.details.website,
                          state.details.phone,
                        );
                        return link.href ? (
                          <a
                            className={`reservation-link ${link.type}`}
                            href={link.href}
                            target={link.type === "phone" ? undefined : "_blank"}
                            rel={link.type === "phone" ? undefined : "noreferrer"}
                          >
                            {link.label}
                          </a>
                        ) : (
                          <span className="secondary-text">{link.label}</span>
                        );
                      })()}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty-list-text">No restaurants checked yet.</p>
        ))}

      {isAddOpen && (
        <Modal onClose={() => setIsAddOpen(false)}>
          <h2>Add a restaurant</h2>
          <RestaurantAutocomplete
            autoFocus
            onSelect={(prediction) => {
              addRestaurant({
                placeId: prediction.placeId,
                name: prediction.mainText,
                address: prediction.secondaryText,
              });
              setIsAddOpen(false);
            }}
          />
        </Modal>
      )}

      {canShare && isShareOpen && (
        <Modal onClose={() => setIsShareOpen(false)}>
          <ShareListModal ownerId={ownerId} />
        </Modal>
      )}
    </div>
  );
}
