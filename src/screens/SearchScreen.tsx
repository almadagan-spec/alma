import { useNavigate } from "react-router-dom";
import { useAppContext } from "../AppContext";
import BackButton from "../components/BackButton";
import RestaurantAutocomplete from "../components/RestaurantAutocomplete";
import "./SearchScreen.css";

export default function SearchScreen() {
  const navigate = useNavigate();
  const { restaurantList, addRestaurant, toggleRestaurant } = useAppContext();

  return (
    <div className="screen search-screen">
      <div className="search-content">
        <BackButton />
        <h1>Type restaurant name</h1>

        <RestaurantAutocomplete
          autoFocus
          onSelect={(prediction) =>
            addRestaurant({
              id: prediction.placeId,
              name: prediction.mainText,
              address: prediction.secondaryText,
              placeId: prediction.placeId,
              checked: true,
            })
          }
        />

        <div className="my-list">
          <h2>Your list</h2>

          {restaurantList.length > 0 ? (
            <ul>
              {restaurantList.map((item) => (
                <li key={item.id}>
                  <label className="list-item">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleRestaurant(item.id)}
                    />
                    <span className="list-item-text">
                      <span className="main-text">{item.name}</span>
                      {item.address && (
                        <span className="secondary-text">{item.address}</span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-list-text">
              Search above and pick a restaurant to add it here.
            </p>
          )}

          <button
            type="button"
            className="primary-button continue-button"
            disabled={restaurantList.length === 0}
            onClick={() => navigate("/my-list")}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
