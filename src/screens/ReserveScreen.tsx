import { useState } from "react";
import { useAppContext } from "../AppContext";
import BackButton from "../components/BackButton";
import Modal from "../components/Modal";
import {
  getReservationDetails,
  isGooglePlacesConfigured,
  type ReservationDetails,
} from "../lib/googlePlaces";
import { getMockReservationDetails } from "../lib/mockRestaurants";
import { isOpenForRange } from "../lib/openingHours";
import "./ReserveScreen.css";

interface ResultItem {
  id: string;
  name: string;
  address: string;
  details: ReservationDetails | null;
}

type Bucket = "available" | "phoneOnly" | "unavailable";

function bucketFor(item: ResultItem, date: Date, startTime: string, endTime: string): Bucket {
  if (!item.details || !item.details.periods) return "phoneOnly";
  const open = isOpenForRange(item.details.periods, date, startTime, endTime);
  if (!open) return "unavailable";
  return item.details.website ? "available" : "phoneOnly";
}

function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function generateSlots(fromTime: string, toTime: string, stepMinutes = 30): string[] {
  const [fromHours, fromMinutes] = fromTime.split(":").map(Number);
  const [toHours, toMinutes] = toTime.split(":").map(Number);
  const start = fromHours * 60 + fromMinutes;
  const end = toHours * 60 + toMinutes;

  const slots: string[] = [];
  for (let minute = start; minute <= end; minute += stepMinutes) {
    const hours = Math.floor(minute / 60);
    const mins = minute % 60;
    slots.push(`${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`);
  }
  return slots;
}

export default function ReserveScreen() {
  const { restaurantList } = useAppContext();
  const myRestaurants = restaurantList.filter((item) => item.checked && item.placeId);

  const [date, setDate] = useState(todayISO());
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [orderItem, setOrderItem] = useState<ResultItem | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const canSearch = Boolean(date) && Boolean(fromTime) && Boolean(toTime) && toTime > fromTime;

  const handleSearch = async () => {
    if (!canSearch || myRestaurants.length === 0) return;
    setIsLoading(true);
    setHasSearched(true);

    const fetched = await Promise.all(
      myRestaurants.map(async (item) => {
        const details = isGooglePlacesConfigured
          ? await getReservationDetails(item.placeId!)
          : getMockReservationDetails(item.placeId!);
        return {
          id: item.id,
          name: details?.name ?? item.name,
          address: details?.address ?? item.address ?? "",
          details,
        };
      }),
    );

    setResults(fetched);
    setIsLoading(false);
  };

  const openOrderPopup = (item: ResultItem) => {
    setSelectedSlot(null);
    setOrderItem(item);
  };

  const handleOrder = () => {
    if (!orderItem?.details?.website || !selectedSlot) return;
    window.open(orderItem.details.website, "_blank", "noopener,noreferrer");
    setOrderItem(null);
  };

  const targetDate = new Date(`${date}T00:00:00`);
  const buckets = { available: [] as ResultItem[], phoneOnly: [] as ResultItem[], unavailable: [] as ResultItem[] };
  if (hasSearched) {
    for (const item of results) {
      buckets[bucketFor(item, targetDate, fromTime, toTime)].push(item);
    }
  }

  return (
    <div className="screen reserve-screen">
      <div className="reserve-content">
        <BackButton />
        <h1>Find a table</h1>

        <div className="filter-bar">
          <label className="filter-field">
            <span>Date</span>
            <input
              type="date"
              value={date}
              min={todayISO()}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <div className="filter-field">
            <span>Hour range</span>
            <div className="hour-range">
              <input
                type="time"
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                aria-label="From"
              />
              <span className="hour-range-sep">–</span>
              <input
                type="time"
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                aria-label="To"
              />
            </div>
          </div>

          <button
            type="button"
            className="primary-button"
            disabled={!canSearch || myRestaurants.length === 0}
            onClick={handleSearch}
          >
            Show me what's available
          </button>

          {myRestaurants.length === 0 && (
            <p className="hint-text">Add restaurants to your list first.</p>
          )}
        </div>

        {isLoading && <p className="hint-text">Checking your restaurants…</p>}

        {!isLoading && hasSearched && (
          <div className="results">
            <div className="result-section">
              <h2>Available</h2>
              {buckets.available.length > 0 ? (
                <ul>
                  {buckets.available.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="result-card"
                        onClick={() => openOrderPopup(item)}
                      >
                        <span className="main-text">{item.name}</span>
                        <span className="secondary-text">{item.address}</span>
                        <span className="secondary-text">
                          Open {fromTime}–{toTime}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-list-text">
                  None of your restaurants are open for that window.
                </p>
              )}
            </div>

            {buckets.phoneOnly.length > 0 && (
              <div className="result-section phone-only">
                <h2>Call to reserve</h2>
                <p className="hint-text">
                  We couldn't find online booking for these — they're open at
                  your chosen time, but you'll need to call.
                </p>
                <ul>
                  {buckets.phoneOnly.map((item) => (
                    <li key={item.id}>
                      <span className="main-text">{item.name}</span>
                      <span className="secondary-text">{item.address}</span>
                      {item.details?.phone ? (
                        <a className="link" href={`tel:${item.details.phone}`}>
                          {item.details.phone}
                        </a>
                      ) : item.details?.mapsUrl ? (
                        <a
                          className="link"
                          href={item.details.mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Find contact info on Google Maps
                        </a>
                      ) : (
                        <span className="secondary-text">
                          No contact info found — try Google Maps directly.
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {buckets.unavailable.length > 0 && (
              <div className="result-section unavailable">
                <h2>Not available at this time</h2>
                <ul className="compact-list">
                  {buckets.unavailable.map((item) => (
                    <li key={item.id}>{item.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {orderItem && (
        <Modal onClose={() => setOrderItem(null)}>
          <h2>{orderItem.name}</h2>
          <p className="secondary-text">{orderItem.address}</p>

          <p className="slot-label">Choose a time</p>
          <div className="slot-grid">
            {generateSlots(fromTime, toTime).map((slot) => (
              <button
                key={slot}
                type="button"
                className={`slot-button ${selectedSlot === slot ? "selected" : ""}`}
                onClick={() => setSelectedSlot(slot)}
              >
                {slot}
              </button>
            ))}
          </div>

          {orderItem.details?.requiresCard && (
            <p className="card-notice">
              This restaurant asks for a card to hold your reservation.
              You'll enter it securely on their own page after you continue —
              we never collect or see your card details.
            </p>
          )}

          <button
            type="button"
            className="primary-button order-button"
            disabled={!selectedSlot}
            onClick={handleOrder}
          >
            Order
          </button>
        </Modal>
      )}
    </div>
  );
}
