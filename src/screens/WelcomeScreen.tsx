import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import "./WelcomeScreen.css";

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="screen welcome-screen">
      <button
        type="button"
        className="logout-button"
        onClick={handleLogout}
        aria-label="Log out"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>

      <div className="welcome-content">
        {profile && <p className="greeting">Welcome, {profile.fullName.split(" ")[0]}!</p>}
        <button className="primary-button" onClick={() => navigate("/search")}>
          Create your restaurant list
        </button>
      </div>
    </div>
  );
}
