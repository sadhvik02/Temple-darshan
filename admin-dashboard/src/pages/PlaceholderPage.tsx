import { useLocation } from "react-router-dom";

/**
 * Placeholder page for navigation items not yet implemented.
 * Shows a clear "coming next phase" message without fake content.
 */
export default function PlaceholderPage() {
  const location = useLocation();

  // Derive page name from the URL path
  const pageName = location.pathname
    .replace("/", "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="placeholder-page">
      <div className="placeholder-content">
        <div className="placeholder-icon">🚧</div>
        <h1>{pageName || "Page"}</h1>
        <p>This section will be implemented in the next phase.</p>
        <div className="placeholder-details">
          <p>
            The database structure and security rules for{" "}
            <strong>{pageName.toLowerCase()}</strong> are already in place.
            The management interface will be built in the upcoming
            implementation phase.
          </p>
        </div>
      </div>
    </div>
  );
}
