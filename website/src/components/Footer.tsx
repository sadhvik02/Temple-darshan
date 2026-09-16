import { Link } from "react-router-dom";
import type { TempleInfo } from "../types";

interface FooterProps {
  templeInfo?: TempleInfo | null;
}

export default function Footer({ templeInfo }: FooterProps) {
  const templeName = templeInfo?.name || "Sri Kedareshwara Ashramam";
  const address = templeInfo ? `${templeInfo.address}, ${templeInfo.city}, ${templeInfo.state} - ${templeInfo.pincode}` : "";
  const phone = templeInfo?.phone || "";
  const email = templeInfo?.email || "";

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Col 1: Brand & Sacred Mission */}
          <div className="footer-brand">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <img
                src="/app_icon_512x512.png"
                alt="Ashramam Logo"
                style={{ width: "42px", height: "42px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.2)" }}
              />
              <h3 style={{ margin: 0 }}>{templeName}</h3>
            </div>
            <p>
              A sacred abode dedicated to spiritual peace, selfless seva, and sacred worship. We welcome all devotees and seekers to partake in divine darshan and traditional ashram services.
            </p>
            {templeInfo?.timings && (
              <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(255, 255, 255, 0.05)", borderRadius: "8px", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--color-saffron-light)", fontWeight: 600 }}>Darshan Hours:</span>
                <div style={{ color: "#E7E5E4", marginTop: "0.25rem" }}>
                  {templeInfo.timings.morning} &bull; {templeInfo.timings.evening}
                </div>
              </div>
            )}
          </div>

          {/* Col 2: Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/" className="footer-link">› Home</Link></li>
              <li><Link to="/about" className="footer-link">› About Ashramam</Link></li>
              <li><Link to="/sevas" className="footer-link">› Ashrama &amp; Arjita Sevas</Link></li>
              <li><Link to="/darshan" className="footer-link">› Darshan Information</Link></li>
              <li><Link to="/donations" className="footer-link">› Spiritual Donations</Link></li>
              <li><Link to="/news" className="footer-link">› News &amp; Events</Link></li>
              <li><Link to="/contact" className="footer-link">› Contact &amp; Timings</Link></li>
            </ul>
          </div>

          {/* Col 3: Sacred Sevas */}
          <div className="footer-col">
            <h4>Sevas &amp; Darshan</h4>
            <ul className="footer-links">
              <li><Link to="/sevas" className="footer-link">› Ashrama Seva (Free)</Link></li>
              <li><Link to="/sevas" className="footer-link">› Arjita Seva (Special)</Link></li>
              <li><Link to="/darshan" className="footer-link">› Daily Darshan</Link></li>
              <li><Link to="/donations" className="footer-link">› Annadanam Seva</Link></li>
              <li><a href="#download-app" className="footer-link">› Book via Mobile App</a></li>
            </ul>
          </div>

          {/* Col 4: Contact Information */}
          <div className="footer-col">
            <h4>Reach Us</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.885rem" }}>
              {address && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <span style={{ color: "var(--color-saffron)" }}>📍</span>
                  <span>{address}</span>
                </div>
              )}
              {phone && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <span style={{ color: "var(--color-saffron)" }}>📞</span>
                  <a href={`tel:${phone}`} style={{ color: "#E7E5E4" }}>{phone}</a>
                </div>
              )}
              {email && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <span style={{ color: "var(--color-saffron)" }}>✉️</span>
                  <a href={`mailto:${email}`} style={{ color: "#E7E5E4" }}>{email}</a>
                </div>
              )}
              <div style={{ marginTop: "0.5rem" }}>
                <a href="#download-app" className="btn btn-sm btn-primary" style={{ width: "100%" }}>
                  📱 Get Android App
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} {templeName}. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: "1.25rem" }}>
            <Link to="/about" style={{ color: "#A8A29E" }}>About</Link>
            <Link to="/contact" style={{ color: "#A8A29E" }}>Contact</Link>
            <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: "#A8A29E" }}>Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
