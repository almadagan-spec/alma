import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
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
import { findReservationLink } from "../lib/reservationSearch";
import type { RestaurantListItem } from "../types";
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
  const { items, loading, error, addRestaurant, removeRestaurant, setRestaurantReservationUrl } =
    useRestaurantList(ownerId);
  const selected = items.filter((item) => item.checked);
  const existingPlaceIds = useMemo(
    () => new Set(items.map((item) => item.placeId)),
    [items],
  );

  const [detailsById, setDetailsById] = useState<Record<string, DetailsState>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RestaurantListItem | null>(null);
  const [editingUrl, setEditingUrl] = useState("");
  const searchAttempted = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    selected.forEach((item) => {
      if (item.reservationUrl || searchAttempted.current.has(item.id)) return;

      const state = detailsById[item.id];
      if (state?.status !== "loaded") return;

      const detected = getReservationLink(state.details.website, state.details.phone);
      if (detected.type === "tabit" || detected.type === "ontopo") return;

      searchAttempted.current.add(item.id);
      findReservationLink(item.name, item.address).then((found) => {
        if (found) setRestaurantReservationUrl(item, found);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, detailsById]);

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
                  <div className="item-header">
                    <span className="main-text">
                      {state?.status === "loaded" ? state.details.name : item.name}
                    </span>
                    <div className="item-actions">
                      <button
                        type="button"
                        className="edit-button"
                        onClick={() => {
                          setEditingItem(item);
                          setEditingUrl(item.reservationUrl ?? "");
                        }}
                        aria-label={`Set reservation link for ${item.name}`}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeRestaurant(item)}
                        aria-label={`Remove ${item.name} from the list`}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

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
                          item.reservationUrl,
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
            existingPlaceIds={existingPlaceIds}
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

      {editingItem && (
        <Modal onClose={() => setEditingItem(null)}>
          <h2>Reservation link for {editingItem.name}</h2>
          <p className="hint-text">
            Paste the restaurant's Tabit or Ontopo booking page (or any
            reservation link). This overrides the automatically detected one.
          </p>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              const trimmed = editingUrl.trim();
              setRestaurantReservationUrl(editingItem, trimmed ? trimmed : null);
              setEditingItem(null);
            }}
          >
            <label className="field">
              <span>Reservation link</span>
              <input
                type="url"
                value={editingUrl}
                onChange={(e) => setEditingUrl(e.target.value)}
                placeholder="https://www.tabit.cloud/..."
                autoFocus
              />
            </label>
            <button type="submit" className="primary-button">
              Save
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
