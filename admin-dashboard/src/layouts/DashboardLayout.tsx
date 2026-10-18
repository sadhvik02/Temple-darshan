import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { NavItem } from "../types";

const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: "📊", enabled: true },
  { label: "Temple Info", path: "/temple", icon: "🛕", enabled: true },
  { label: "Banners", path: "/banners", icon: "🖼", enabled: true },
  { label: "Darshan", path: "/darshans", icon: "🙏", enabled: true },
  { label: "Services", path: "/services", icon: "🪔", enabled: true },
  { label: "Slots", path: "/slots", icon: "📅", enabled: true },
  { label: "Bookings", path: "/bookings", icon: "📋", enabled: true },
  { label: "Donations", path: "/donations", icon: "💰", enabled: true },
  { label: "News", path: "/news", icon: "📰", enabled: true },
  { label: "Events", path: "/events", icon: "🎉", enabled: true },
  { label: "Notifications", path: "/notifications", icon: "🔔", enabled: true },
  { label: "Users", path: "/users", icon: "👥", enabled: true },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Admin Pages", path: "/admins", icon: "🛡️", enabled: true, superAdminOnly: true },
  { label: "Create Admin", path: "/admins/create", icon: "➕", enabled: true, superAdminOnly: true },
];

function getPageTitle(pathname: string): string {
  if (pathname === "/admins") return "Admin Directory & Pages";
  if (pathname === "/admins/create") return "Create Administrator";
  const allItems = [...MAIN_NAV_ITEMS, ...ADMIN_NAV_ITEMS];
  const item = allItems.find((n) => n.path === pathname);
  if (item) return item.label;
  if (pathname === "/" || pathname === "/dashboard") return "Dashboard";
  return pathname.replace("/", "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DashboardLayout() {
  const { adminData, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  const isSuperAdmin = (adminData?.role || "").toUpperCase() === "SUPER_ADMIN";
  const userPermissions = adminData?.permissions || [];
  const hasFullAccess = isSuperAdmin || userPermissions.includes("all") || userPermissions.length === 0;

  // Filter main navigation items based on admin's permissions
  const visibleNavItems = MAIN_NAV_ITEMS.filter((item) => {
    if (hasFullAccess) return true;
    if (item.path === "/dashboard") return true; // Dashboard always visible
    return userPermissions.includes(item.path);
  });

  const pageTitle = getPageTitle(location.pathname);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

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
          <span className="sidebar-title">Palgutta Ashramam</span>
        </div>

        <nav className="sidebar-nav">
          {/* Main Modules */}
          {visibleNavItems.map((item) => (
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

          {/* Super Admin Management Section */}
          {isSuperAdmin && (
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--color-border)" }}>
              <div
                style={{
                  padding: "4px 14px 8px",
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  letterSpacing: "0.08em",
                  color: "#7c3aed",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>👑</span> Super Admin
              </div>

              {ADMIN_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? "nav-item-active" : ""}`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? "#6d28d9" : "var(--color-text-secondary)",
                    background: isActive ? "#ede9fe" : undefined,
                    borderLeft: isActive ? "3px solid #7c3aed" : undefined,
                  })}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span
              className="user-avatar"
              style={{
                background: isSuperAdmin ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : undefined,
                color: isSuperAdmin ? "#fff" : undefined,
              }}
            >
              {adminData?.name?.charAt(0)?.toUpperCase() || "A"}
            </span>
            <div className="user-info">
              <span className="user-name">
                {adminData?.name || "Admin"}
              </span>
              <span
                className="user-role"
                style={{
                  color: isSuperAdmin ? "#7c3aed" : undefined,
                  fontWeight: isSuperAdmin ? "700" : undefined,
                }}
              >
                {adminData?.role || "admin"}
              </span>
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
            {currentTime && (
              <span style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
                {currentTime}
              </span>
            )}

            <div className="header-portal-status">
              <span className="status-dot-pulse" />
              <span>Live Portal</span>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-logout"
              disabled={loggingOut}
            >
              {loggingOut ? "Signing out..." : "🚪 Logout"}
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
