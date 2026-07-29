import { useNavigate } from "react-router-dom";
import "./BackButton.css";

export default function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="back-button"
      onClick={() => navigate(-1)}
    >
      ← Back
    </button>
  );
}
