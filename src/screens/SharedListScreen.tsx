import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BackButton from "../components/BackButton";
import RestaurantListPanel from "../components/RestaurantListPanel";
import { fetchOwnerName } from "../lib/listApi";
import "./MyListScreen.css";

export default function SharedListScreen() {
  const { ownerId } = useParams<{ ownerId: string }>();
  const [ownerName, setOwnerName] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerId) return;
    fetchOwnerName(ownerId).then(setOwnerName);
  }, [ownerId]);

  if (!ownerId) return null;

  return (
    <div className="screen my-list-screen">
      <div className="my-list-content">
        <BackButton />
        <RestaurantListPanel
          ownerId={ownerId}
          title={ownerName ? `${ownerName}'s list` : "Shared list"}
          canShare={false}
        />
      </div>
    </div>
  );
}
