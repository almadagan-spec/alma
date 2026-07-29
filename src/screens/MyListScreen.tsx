import { useNavigate } from "react-router-dom";
import { useAppContext } from "../AppContext";
import "./MyListScreen.css";

export default function MyListScreen() {
  const navigate = useNavigate();
  const { restaurantList } = useAppContext();
  const selected = restaurantList.filter((item) => item.checked);

  return (
    <div className="screen my-list-screen">
      <div className="my-list-content">
        <h1>Your restaurant list</h1>

        {selected.length > 0 ? (
          <ul>
            {selected.map((item) => (
              <li key={item.id}>
                <span className="main-text">{item.name}</span>
                {item.address && (
                  <span className="secondary-text">{item.address}</span>
                )}
              </li>
            ))}
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
