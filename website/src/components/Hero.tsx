import { Link } from "react-router-dom";
import type { TempleInfo } from "../types";

interface HeroProps {
  templeInfo?: TempleInfo | null;
}

export default function Hero({ templeInfo }: HeroProps) {
  const templeName = templeInfo?.name || "Sri Kedareshwara Ashramam";

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
              <Link to="/about" className="btn btn-primary btn-lg">
                <span>Plan Your Visit</span>
              </Link>
            </div>
          </div>

          {/* Right: Sacred Visual Display featuring Guruji */}
          <div className="hero-visual">
            <div className="hero-image-card">
              <div className="hero-img-frame">
                <img
                  src="/guruji.png"
                  alt="Poojya Sri Kedarananda Maharaj"
                  className="hero-main-img"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (templeInfo?.imageUrl && target.src !== templeInfo.imageUrl) {
                      target.src = templeInfo.imageUrl;
                    }
                  }}
                />
                <span
                  className="badge badge-price"
                  style={{
                    position: "absolute",
                    top: "0.75rem",
                    left: "0.75rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                    zIndex: 2,
                  }}
                >
                  🕉️ Poojya Guruji
                </span>
              </div>
              <div className="hero-card-caption">
                <div className="hero-badge-icon">🙏</div>
                <div className="hero-badge-text">
                  <h4>Poojya Sri Kedarananda Maharaj</h4>
                  <p>Spiritual Guide &bull; Sri Kedareshwara Ashramam</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sacred Full-Width Pilgrim Info Ribbon */}
        {templeInfo?.timings && (
          <div className="hero-info-ribbon">
            <div className="hero-ribbon-item">
              <span className="hero-ribbon-icon">🌅</span>
              <div className="hero-ribbon-text">
                <span className="hero-ribbon-label">Morning Darshan</span>
                <span className="hero-ribbon-val">{templeInfo.timings.morning}</span>
              </div>
            </div>

            <div className="hero-ribbon-item">
              <span className="hero-ribbon-icon">🌇</span>
              <div className="hero-ribbon-text">
                <span className="hero-ribbon-label">Evening Darshan</span>
                <span className="hero-ribbon-val">{templeInfo.timings.evening}</span>
              </div>
            </div>

            <div className="hero-ribbon-item">
              <span className="hero-ribbon-icon">✨</span>
              <div className="hero-ribbon-text">
                <span className="hero-ribbon-label">Maharaj Darshan</span>
                <span className="hero-ribbon-val">{templeInfo?.timings?.maharajSpecial || "Pournami & Amavasya Night"}</span>
              </div>
            </div>

            <div className="hero-ribbon-item">
              <span className="hero-ribbon-icon">📍</span>
              <div className="hero-ribbon-text">
                <span className="hero-ribbon-label">Ashram Location</span>
                <span className="hero-ribbon-val">{templeInfo.city ? `${templeInfo.city}, ${templeInfo.state}` : "Nandipet, Nizamabad"}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
