import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";
import * as api from "../api/portfolio";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Already authenticated → go straight to admin
    if (localStorage.getItem("access_token")) navigate("/admin");
    document.body.style.overflow = "auto";
    return () => {
      document.body.style.overflow = "hidden";
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.login(username, password);
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      navigate("/admin");
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } };
      if (!e.response) {
        setError(
          "Cannot reach the server. Make sure Django is running on http://localhost:8000"
        );
      } else if (e.response.status === 401) {
        setError("Incorrect username or password.");
      } else {
        setError(`Server error (${e.response.status}). Check the Django console.`);
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
        <h2>Welcome back</h2>
        <p className="auth-sub">Sign in to manage your portfolio</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account?{" "}
          <button className="auth-link" onClick={() => navigate("/register")}>
            Register free
          </button>
        </p>
      </div>
    </div>
  );
}
