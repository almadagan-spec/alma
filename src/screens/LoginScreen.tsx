import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import "./SignupScreen.css";

export default function LoginScreen() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canSubmit = email.trim() !== "" && password !== "" && !isSubmitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setFormError(null);

    const { error } = await signIn(email.trim(), password);

    setIsSubmitting(false);

    if (error) {
      setFormError(error);
      return;
    }
    navigate("/my-list");
  };

  return (
    <div className="screen signup-screen">
      <div className="signup-card">
        <h1>Log in</h1>
        <p className="subtitle">Welcome back.</p>

        <form onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              autoComplete="current-password"
            />
          </label>

          {formError && <p className="error-text">{formError}</p>}

          <button type="submit" className="primary-button" disabled={!canSubmit}>
            {isSubmitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="switch-auth">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
