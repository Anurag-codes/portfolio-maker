import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import * as api from "../api/portfolio";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "hidden";
    };
  }, []);

  const change = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.register(
        form.username.trim(),
        form.email.trim(),
        form.password
      );
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      navigate("/admin");
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { detail?: string }; status?: number };
      };
      if (!e.response) {
        setError(
          "Cannot reach the server. Make sure Django is running on http://localhost:8000"
        );
      } else {
        setError(
          e.response.data?.detail || "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button className="auth-back" onClick={() => navigate("/")}>
          ← Back
        </button>
        <div className="auth-logo">PortfolioCraft</div>
        <h2>Create Account</h2>
        <p className="auth-sub">Set up your free 3D portfolio in minutes</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => change("username", e.target.value)}
              placeholder="johndoe"
              required
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label>
              Email <span className="auth-opt">(optional)</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => change("email", e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => change("password", e.target.value)}
              placeholder="Min. 6 characters"
              required
            />
          </div>
          <div className="auth-field">
            <label>Confirm Password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => change("confirm", e.target.value)}
              placeholder="Repeat password"
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? "Creating account…" : "Create Account →"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <button className="auth-link" onClick={() => navigate("/login")}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
