import { useNavigate } from "react-router-dom";
import "./BackButton.css";

interface BackButtonProps {
  /** Navigate here directly instead of relying on browser history. */
  to?: string;
}

export default function BackButton({ to }: BackButtonProps) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="back-button"
      onClick={() => (to ? navigate(to) : navigate(-1))}
    >
      ← Back
    </button>
  );
}
