import { useAuth } from "../AuthContext";
import RestaurantListPanel from "../components/RestaurantListPanel";
import "./MyListScreen.css";

export default function MyListScreen() {
  const { authUser } = useAuth();

  if (!authUser) return null;

  return (
    <div className="screen my-list-screen">
      <div className="my-list-content">
        <RestaurantListPanel ownerId={authUser.id} title="My restaurants" canShare />
      </div>
    </div>
  );
}
