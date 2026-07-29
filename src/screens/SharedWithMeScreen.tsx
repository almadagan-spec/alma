import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import BackButton from "../components/BackButton";
import { fetchSharedWithMe, type SharedListSummary } from "../lib/listApi";
import "./SharedWithMeScreen.css";

export default function SharedWithMeScreen() {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const [shares, setShares] = useState<SharedListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser?.email) return;
    fetchSharedWithMe(authUser.email)
      .then(setShares)
      .catch(() => setError("Couldn't load shared lists right now."))
      .finally(() => setLoading(false));
  }, [authUser?.email]);

  return (
    <div className="screen shared-with-me-screen">
      <div className="shared-with-me-content">
        <BackButton />
        <h1>Shared with me</h1>

        {loading && <p className="hint-text">Loading…</p>}
        {error && <p className="hint-text">{error}</p>}

        {!loading &&
          !error &&
          (shares.length > 0 ? (
            <ul>
              {shares.map((share) => (
                <li key={share.ownerId}>
                  <button
                    type="button"
                    onClick={() => navigate(`/shared/${share.ownerId}`)}
                  >
                    {share.ownerName}'s list
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-list-text">No one has shared a list with you yet.</p>
          ))}
      </div>
    </div>
  );
}
