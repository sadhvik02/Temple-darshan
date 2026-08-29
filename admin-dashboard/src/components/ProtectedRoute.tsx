import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard that requires:
 * 1. Firebase Authentication (user is logged in)
 * 2. Admin authorization (user exists in admins collection)
 *
 * Shows loading state while auth initializes.
 * Redirects to /login if not authenticated.
 * Shows access-denied if authenticated but not admin.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { loading, firebaseUser, isAdmin, error } = useAuth();

  // Still checking auth state — don't flash content
  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-content">
          <div className="spinner" />
          <p>Verifying authorization...</p>
        </div>
      </div>
    );
  }

  // Not logged in — redirect to login
  if (!firebaseUser) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but NOT an admin — access denied
  if (!isAdmin) {
    return <AccessDenied error={error} />;
  }

  // Authorized admin — render children
  return <>{children}</>;
}

function AccessDenied({ error }: { error: string | null }) {
  const { logout, firebaseUser } = useAuth();

  return (
    <div className="access-denied-screen">
      <div className="access-denied-card">
        <div className="access-denied-icon">⛔</div>
        <h1>Access Denied</h1>
        <p>
          The account <strong>{firebaseUser?.email}</strong> is not authorized
          to access the Admin Dashboard.
        </p>
        {error && <p className="error-detail">{error}</p>}
        <p className="access-denied-help">
          Admin accounts must be provisioned by a system administrator. If you
          believe this is an error, please contact support.
        </p>
        <button onClick={logout} className="btn btn-secondary">
          Sign Out
        </button>
      </div>
    </div>
  );
}
