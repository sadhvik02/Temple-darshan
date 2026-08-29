import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Navigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { loading, isAdmin, firebaseUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          setError(
            "Too many failed login attempts. Please try again later."
          );
          break;
        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection."
          );
          break;
        default:
          setError("Login failed. Please try again.");
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
          <div className="login-icon">🛕</div>
          <h1>Temple Admin</h1>
          <p>Sign in to manage the temple platform</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              disabled={loginLoading}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loginLoading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loginLoading}
          >
            {loginLoading ? (
              <>
                <span className="spinner spinner-sm" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="login-footer">
          Admin accounts are managed by the system administrator.
        </p>
      </div>
    </div>
  );
}
