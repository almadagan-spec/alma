import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import "./WelcomeScreen.css";

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <div className="screen welcome-screen">
      <div className="welcome-content">
        {profile && <p className="greeting">Welcome, {profile.fullName.split(" ")[0]}!</p>}
        <button className="primary-button" onClick={() => navigate("/search")}>
          Create your restaurant list
        </button>
      </div>
    </div>
  );
}
