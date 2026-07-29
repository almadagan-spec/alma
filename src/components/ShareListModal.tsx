import { useState } from "react";
import { shareList } from "../lib/listApi";

interface ShareListModalProps {
  ownerId: string;
}

export default function ShareListModal({ ownerId }: ShareListModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleShare = async () => {
    if (!email.trim()) return;
    setIsSubmitting(true);
    const result = await shareList(ownerId, email);
    setIsSubmitting(false);
    setStatus(result);
    if (result.ok) setEmail("");
  };

  return (
    <>
      <h2>Share your list</h2>
      <p className="hint-text">
        Enter their email. Once they create an account (or log in) with that
        address, your list shows up under "Shared with me" for them to view
        and edit.
      </p>
      <label className="field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@example.com"
          autoFocus
        />
      </label>
      {status && (
        <p className={status.ok ? "success-text" : "error-text"}>
          {status.message}
        </p>
      )}
      <button
        type="button"
        className="primary-button"
        disabled={!email.trim() || isSubmitting}
        onClick={handleShare}
      >
        {isSubmitting ? "Sharing…" : "Share"}
      </button>
    </>
  );
}
