import { useState } from "react";
import type { Service } from "../types";

interface SevaCardProps {
  service: Service;
}

function getServiceImage(service: Service): string {
  if (service.imageUrl && service.imageUrl.trim() !== "") {
    return service.imageUrl;
  }
  const upper = (service.name || "").toUpperCase();
  if (upper.includes("SHIVA") || upper.includes("SIVA") || upper.includes("RUDRA") || upper.includes("BILVA")) {
    return "/shiva_seva.jpg";
  }
  if (upper.includes("GANESH") || upper.includes("VINAYAKA") || upper.includes("MODAK")) {
    return "/ganesh_seva.jpg";
  }
  if (upper.includes("ANNADAN") || upper.includes("PRASAD")) {
    return "/annadanam_seva.jpg";
  }
  if (upper.includes("GOSHALA") || upper.includes("COW")) {
    return "/goshala_seva.jpg";
  }
  return "";
}

function getEnhancedDescription(name: string, desc?: string): string {
  const upper = (name || "").toUpperCase();
  if (upper.includes("GANESH")) {
    return desc && desc.length > 25
      ? desc
      : "Auspicious Lord Ganesha Puja performed with sacred modak offerings, durva grass, and Vedic chants to remove obstacles and invite prosperity.";
  }
  if (upper.includes("SHIVA")) {
    return desc && desc.length > 25
      ? desc
      : "Devotional seva dedicated to Lord Shiva with holy bilva patra offerings, deepa aradhana, and sacred Rudra chanting for peace and wellbeing.";
  }
  if (upper.includes("ABISHEK")) {
    return desc && desc.length > 25
      ? desc
      : "Sacred morning bath ritual consecrated with holy panchamritam, fresh fragrant flowers, and Vedic hymns for spiritual upliftment.";
  }
  return desc || "Sacred traditional ritual consecrated for spiritual wellbeing, family prosperity, and inner peace.";
}

export default function SevaCard({ service }: SevaCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isAshramaSeva = service.category === "ashrama_seva" || service.price === 0;
  const displayImage = getServiceImage(service);
  const description = getEnhancedDescription(service.name, service.description);

  return (
    <>
      <div className="card seva-card">
        {/* Card Header Visual Frame */}
        <div className="card-img-wrapper seva-img-frame">
          {displayImage && !imgError ? (
            <img
              src={displayImage}
              alt={service.name}
              className="card-img"
              loading="lazy"
              style={{ objectPosition: "center top" }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="card-img-placeholder seva-img-fallback">
              <span className="seva-fallback-icon">{isAshramaSeva ? "🕉️" : "🪔"}</span>
              <span className="seva-fallback-tag">{isAshramaSeva ? "Ashrama Seva" : "Arjita Seva"}</span>
            </div>
          )}

          {/* Gentle vignette overlay */}
          <div className="seva-img-vignette" />

          {/* Top Glassmorphic Category Badge */}
          <div className="seva-badge-container">
            {isAshramaSeva ? (
              <span className="seva-glass-badge badge-free-glass">
                <span className="badge-glow-dot" />
                <span>Ashrama Seva • Free</span>
              </span>
            ) : (
              <span className="seva-glass-badge badge-arjita-glass">
                <span>🪔 Arjita Seva</span>
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="card-body seva-card-body">
          <div className="seva-category-hint">
            {isAshramaSeva ? "Daily Ashram Offering" : "Special Arjita Puja"}
          </div>

          <h3 className="card-title seva-card-title">{service.name}</h3>
          <p className="card-desc seva-card-desc">{description}</p>

          {/* Card Footer: Price / Free Indicator & Action Button */}
          <div className="card-footer seva-card-footer">
            <div className="seva-pricing">
              {isAshramaSeva ? (
                <div className="seva-free-indicator">
                  <span className="seva-free-symbol">🪷</span>
                  <span className="seva-free-text">Free Offering</span>
                </div>
              ) : (
                <div className="seva-dakshina-block">
                  <span className="seva-dakshina-label">Dakshina</span>
                  <span className="seva-dakshina-val">
                    ₹{service.price.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-seva-cta"
              onClick={() => setShowModal(true)}
              aria-label={`View details for ${service.name}`}
            >
              <span>View Details</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Devotional Details Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card seva-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowModal(false)}
              aria-label="Close modal"
            >
              ✕
            </button>

            {displayImage && !imgError ? (
              <div className="modal-img-wrapper">
                <img
                  src={displayImage}
                  alt={service.name}
                  className="modal-img-top"
                  style={{ objectPosition: "center top" }}
                />
                <div className="modal-img-vignette" />
              </div>
            ) : (
              <div className="modal-fallback-header">
                <span>🪔</span>
              </div>
            )}

            <div className="modal-content">
              <div className="modal-badges-row">
                {isAshramaSeva ? (
                  <span className="badge badge-free">Ashrama Seva (Free Offering)</span>
                ) : (
                  <span className="badge badge-price">
                    Arjita Seva • ₹{service.price.toLocaleString("en-IN")}
                  </span>
                )}
                {service.bookingEnabled ? (
                  <span className="badge badge-available">📱 Book on Android App</span>
                ) : (
                  <span className="badge badge-info">Direct Ashram Entry</span>
                )}
              </div>

              <h2 className="modal-title">{service.name}</h2>
              <p className="modal-description">{description}</p>

              <div className="modal-booking-box">
                <div className="modal-booking-header">
                  <span className="modal-booking-icon">📱</span>
                  <h4>How to Participate &amp; Book</h4>
                </div>
                <p className="modal-booking-text">
                  Devotees are cordially welcome to participate in person at Sri Kedareshwara Ashramam. For designated family dates and advance sankalpam booking, please use our official Android app.
                </p>
                <div className="modal-booking-action">
                  <a
                    href="#mobile-app"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setShowModal(false);
                      const el = document.getElementById("mobile-app");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <span>Download Mobile App for Booking</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
