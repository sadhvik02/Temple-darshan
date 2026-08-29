import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { NavItem } from "../types";

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: "📊", enabled: true },
  { label: "Temple Info", path: "/temple", icon: "🛕", enabled: true },
  { label: "Banners", path: "/banners", icon: "🖼", enabled: true },
  { label: "Services", path: "/services", icon: "🪔", enabled: true },
  { label: "Slots", path: "/slots", icon: "📅", enabled: true },
  { label: "Bookings", path: "/bookings", icon: "📋", enabled: true },
  { label: "News", path: "/news", icon: "📰", enabled: true },
  { label: "Events", path: "/events", icon: "🎉", enabled: true },
  { label: "Users", path: "/users", icon: "👥", enabled: true },
];

/**
 * Derive a human-readable page title from the current URL path.
 */
function getPageTitle(pathname: string): string {
  const item = NAV_ITEMS.find((n) => n.path === pathname);
  if (item) return item.label;
  if (pathname === "/" || pathname === "/dashboard") return "Dashboard";
  return pathname.replace("/", "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DashboardLayout() {
  const { adminData, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const pageTitle = getPageTitle(location.pathname);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <div className={`dashboard-layout ${sidebarOpen ? "sidebar-open" : ""}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">🛕</span>
          <span className="sidebar-title">Temple Admin</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item-active" : ""} ${
                  !item.enabled ? "nav-item-disabled" : ""
                }`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {!item.enabled && (
                <span className="nav-badge">Soon</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="user-avatar">
              {adminData?.name?.charAt(0)?.toUpperCase() || "A"}
            </span>
            <div className="user-info">
              <span className="user-name">
                {adminData?.name || "Admin"}
              </span>
              <span className="user-role">{adminData?.role || "admin"}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="main-area">
        {/* Top header */}
        <header className="top-header">
          <div className="header-left">
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
            <h2 className="header-title">{pageTitle}</h2>
          </div>

          <div className="header-right">
            <span className="header-admin-name">
              {adminData?.name || "Admin"}
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-logout"
              disabled={loggingOut}
            >
              {loggingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
