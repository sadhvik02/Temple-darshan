import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

interface HeaderProps {
  templeName?: string;
}

export default function Header({ templeName = "Sri Kedareshwara Ashramam" }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="site-header">
        <div className="container header-container">
          {/* Logo and Brand */}
          <Link to="/" className="header-logo-link" onClick={closeMobileMenu}>
            <img
              src="/app_icon_512x512.png"
              alt={`${templeName} Logo`}
              className="header-logo-img"
              onError={(e) => {
                // Graceful fallback if image cannot load
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="header-title-wrap">
              <span className="header-title">{templeName}</span>
              <span className="header-tagline">Devotion &bull; Peace &bull; Seva</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="header-nav" aria-label="Main Navigation">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              Home
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              About
            </NavLink>
            <NavLink to="/sevas" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              Sevas
            </NavLink>
            <NavLink to="/darshan" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              Darshan
            </NavLink>
            <NavLink to="/donations" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              Donations
            </NavLink>
            <NavLink to="/news" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              News &amp; Events
            </NavLink>
            <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              Contact
            </NavLink>
          </nav>

          {/* Action CTAs */}
          <div className="header-actions">
            <a href="#download-app" className="btn btn-primary btn-sm header-app-btn">
              <span>📱 Get the App</span>
            </a>

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-backdrop" onClick={closeMobileMenu}>
          <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <img src="/app_icon_512x512.png" alt="Logo" style={{ width: "32px", height: "32px", borderRadius: "6px" }} />
                <span className="mobile-nav-title">{templeName}</span>
              </div>
              <button
                type="button"
                className="mobile-menu-btn"
                style={{ width: "36px", height: "36px", fontSize: "1rem" }}
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className="mobile-nav-links">
              <NavLink to="/" end className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`} onClick={closeMobileMenu}>
                <span>Home</span>
                <span>›</span>
              </NavLink>
              <NavLink to="/about" className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`} onClick={closeMobileMenu}>
                <span>About Ashramam</span>
                <span>›</span>
              </NavLink>
              <NavLink to="/sevas" className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`} onClick={closeMobileMenu}>
                <span>Ashrama &amp; Arjita Sevas</span>
                <span>›</span>
              </NavLink>
              <NavLink to="/darshan" className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`} onClick={closeMobileMenu}>
                <span>Darshan Timings</span>
                <span>›</span>
              </NavLink>
              <NavLink to="/donations" className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`} onClick={closeMobileMenu}>
                <span>Spiritual Donations</span>
                <span>›</span>
              </NavLink>
              <NavLink to="/news" className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`} onClick={closeMobileMenu}>
                <span>News &amp; Events</span>
                <span>›</span>
              </NavLink>
              <NavLink to="/contact" className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`} onClick={closeMobileMenu}>
                <span>Contact &amp; Timings</span>
                <span>›</span>
              </NavLink>
            </div>

            <div className="mobile-nav-footer">
              <a href="#download-app" className="btn btn-primary" style={{ width: "100%" }} onClick={closeMobileMenu}>
                📱 Download Android App
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
