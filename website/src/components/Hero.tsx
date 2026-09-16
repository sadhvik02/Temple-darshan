import { Link } from "react-router-dom";
import type { TempleInfo } from "../types";

interface HeroProps {
  templeInfo?: TempleInfo | null;
}

export default function Hero({ templeInfo }: HeroProps) {
  const templeName = templeInfo?.name || "Sri Kedareshwara Ashramam";
  const heroImage = templeInfo?.imageUrl || "/feature_graphic_1024x500.png";

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-grid">
          {/* Left: Spiritual Welcome Messaging */}
          <div className="hero-content">
            <div className="hero-sloka">
              <span className="hero-sloka-symbol">🕉️</span>
              <span>Om Namah Shivaya &bull; Sacred Abode</span>
            </div>

            <h1 className="hero-title">
              Welcome to <span>{templeName}</span>
            </h1>

            <p className="hero-subtitle">
              {templeInfo?.description || "A sacred space for devotion, peace and spiritual connection. Experience serene worship, participate in traditional ashram sevas, and seek divine blessings."}
            </p>

            <div className="hero-ctas">
              <Link to="/sevas" className="btn btn-primary btn-lg">
                <span>Explore Sevas</span>
                <span>→</span>
              </Link>
              <Link to="/about" className="btn btn-secondary btn-lg">
                <span>Plan Your Visit</span>
              </Link>
            </div>

            {/* Timing highlights banner */}
            {templeInfo?.timings && (
              <div className="hero-stats-banner">
                <div className="hero-stat-item">
                  <span className="hero-stat-val">{templeInfo.timings.morning}</span>
                  <span className="hero-stat-label">Morning Darshan</span>
                </div>
                <div className="hero-stat-item">
                  <span className="hero-stat-val">{templeInfo.timings.evening}</span>
                  <span className="hero-stat-label">Evening Darshan</span>
                </div>
                {templeInfo.city && (
                  <div className="hero-stat-item">
                    <span className="hero-stat-val">{templeInfo.city}, {templeInfo.state}</span>
                    <span className="hero-stat-label">Location</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Sacred Visual Display */}
          <div className="hero-visual">
            <div className="hero-image-card">
              <div className="hero-img-frame">
                <img
                  src={heroImage}
                  alt={`${templeName} Sanctuary`}
                  className="hero-main-img"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.endsWith("/feature_graphic_1024x500.png")) {
                      target.src = "/feature_graphic_1024x500.png";
                    }
                  }}
                />
              </div>
              <div className="hero-card-caption">
                <div className="hero-badge-icon">🛕</div>
                <div className="hero-badge-text">
                  <h4>Daily Darshan &amp; Sevas</h4>
                  <p>Open for all devotees and spiritual seekers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
