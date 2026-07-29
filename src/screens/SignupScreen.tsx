import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../AppContext";
import "./SignupScreen.css";

export default function SignupScreen() {
  const navigate = useNavigate();
  const { setUser } = useAppContext();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [touchedRepeat, setTouchedRepeat] = useState(false);

  const passwordsMismatch =
    touchedRepeat && password.length > 0 && repeatPassword.length > 0 && password !== repeatPassword;

  const isFormComplete =
    fullName.trim() !== "" &&
    email.trim() !== "" &&
    phone.trim() !== "" &&
    password !== "" &&
    repeatPassword !== "";

  const passwordsMatch = password !== "" && password === repeatPassword;

  const canSubmit = isFormComplete && passwordsMatch;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setUser({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim() });
    navigate("/welcome");
  };

  return (
    <div className="screen signup-screen">
      <div className="signup-card">
        <h1>Create your account</h1>
        <p className="subtitle">Let's get your details so we can save your reservations.</p>

        <form onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Full name</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              autoComplete="name"
            />
          </label>

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
            <span>Phone number</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
              autoComplete="tel"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouchedRepeat(true)}
              className={passwordsMismatch ? "error" : ""}
              placeholder="********"
              autoComplete="new-password"
            />
          </label>

          <label className="field">
            <span>Repeat password</span>
            <input
              type="password"
              value={repeatPassword}
              onChange={(e) => {
                setRepeatPassword(e.target.value);
                setTouchedRepeat(true);
              }}
              className={passwordsMismatch ? "error" : ""}
              placeholder="********"
              autoComplete="new-password"
            />
          </label>

          {passwordsMismatch && (
            <p className="error-text">Passwords do not match.</p>
          )}

          <button type="submit" className="primary-button" disabled={!canSubmit}>
            Save and continue
          </button>
        </form>
      </div>
    </div>
  );
}
