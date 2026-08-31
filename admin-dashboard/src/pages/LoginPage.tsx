import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Navigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { loading, isAdmin, firebaseUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated as admin, redirect to dashboard
  if (!loading && firebaseUser && isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoginLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Auth state change will be picked up by AuthContext
      // and ProtectedRoute will handle the redirect
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      switch (firebaseError.code) {
        case "auth/invalid-email":
          setError("Invalid email address.");
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;
        case "auth/too-many-requests":
          setError("Too many failed login attempts. Please try again later.");
          break;
        case "auth/network-request-failed":
          setError("Network error. Please check your internet connection.");
          break;
        default:
          setError("Login failed. Please check credentials.");
          console.error("Login error:", firebaseError);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon-badge">🛕</div>
          <h1>Sri Kedareshwara Ashramam</h1>
          <p>Admin Portal & Operations Console</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: "6px" }}>
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Administrator Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@temple.org"
              disabled={loginLoading}
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Security Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={loginLoading}
                autoComplete="current-password"
                required
                style={{ paddingRight: "42px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1rem",
                  color: "var(--color-text-secondary)",
                }}
                tabIndex={-1}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loginLoading}
            style={{ marginTop: "8px", padding: "12px 18px", fontSize: "0.95rem" }}
          >
            {loginLoading ? (
              <>
                <span className="spinner spinner-sm" />
                Signing in...
              </>
            ) : (
              "Sign In to Portal →"
            )}
          </button>
        </form>

        <p className="login-footer">
          🔒 Authorized Administrator Access Only.
          <br />
          Temple Digital Platform • End-to-End Secure
        </p>
      </div>
    </div>
  );
}
