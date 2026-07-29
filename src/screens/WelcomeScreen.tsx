import { useNavigate } from "react-router-dom";
import { useAppContext } from "../AppContext";
import "./WelcomeScreen.css";

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { user } = useAppContext();

  return (
    <div className="screen welcome-screen">
      <div className="welcome-content">
        {user && <p className="greeting">Welcome, {user.fullName.split(" ")[0]}!</p>}
        <button className="primary-button" onClick={() => navigate("/search")}>
          Create your restaurant list
        </button>
      </div>
    </div>
  );
}
