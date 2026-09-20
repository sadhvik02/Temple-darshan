import { useState } from "react";
import type { Darshan } from "../types";

interface DarshanCardProps {
  darshan: Darshan;
}

function getDarshanFallbackImage(name: string): string {
  const upper = (name || "").toUpperCase();
  if (upper.includes("VIP")) return "/darshan_vip.jpg";
  if (upper.includes("SPECIAL")) return "/darshan_special.jpg";
  return "/darshan_general.jpg";
}

export default function DarshanCard({ darshan }: DarshanCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isFree = darshan.price === 0;
  const isVip = darshan.name.toUpperCase().includes("VIP") || darshan.price >= 1000;
  const displayImage = darshan.imageUrl && !imgError ? darshan.imageUrl : getDarshanFallbackImage(darshan.name);

  return (
    <>
      <div className="card darshan-card">
        {/* Card Header Visual Frame */}
        <div className="card-img-wrapper darshan-img-frame">
          <img
            src={displayImage}
            alt={darshan.name}
            className="card-img"
            loading="lazy"
            onError={() => setImgError(true)}
          />

          {/* Gentle vignette overlay */}
          <div className="darshan-img-vignette" />

          {/* Top Glassmorphic Category Badge */}
          <div className="darshan-badge-container">
            {isFree ? (
              <span className="darshan-glass-badge badge-free-glass">
                <span className="badge-glow-dot" />
                <span>Free Walk-in Darshan</span>
              </span>
            ) : isVip ? (
              <span className="darshan-glass-badge badge-vip-glass">
                <span>👑 VIP Divya Darshan</span>
              </span>
            ) : (
              <span className="darshan-glass-badge badge-special-glass">
                <span>🪔 Special Entry Darshan</span>
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="card-body darshan-card-body">
          <div className="darshan-category-hint">
            {isFree ? "General Public Entry" : isVip ? "Priority Sanctum Access" : "Expedited Sanctum Darshan"}
          </div>

          <h3 className="card-title darshan-card-title">{darshan.name}</h3>
          <p className="card-desc darshan-card-desc">
            {darshan.description || "Divine darshan at Sri Kedareshwara Ashramam."}
          </p>

          {/* Card Footer: Pricing / Token & Action Button */}
          <div className="card-footer darshan-card-footer">
            <div className="darshan-pricing">
              {isFree ? (
                <div className="darshan-free-indicator">
                  <span className="darshan-free-symbol">🪷</span>
                  <span className="darshan-free-text">Free Walk-in</span>
                </div>
              ) : (
                <div className="darshan-token-block">
                  <span className="darshan-token-label">Token Offering</span>
                  <span className="darshan-token-val">
                    ₹{darshan.price.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-darshan-cta"
              onClick={() => setShowModal(true)}
              aria-label={`View details for ${darshan.name}`}
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
          <div className="modal-card darshan-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowModal(false)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="modal-img-wrapper">
              <img src={displayImage} alt={darshan.name} className="modal-img-top" />
              <div className="modal-img-vignette" />
            </div>

            <div className="modal-content">
              <div className="modal-badges-row">
                {isFree ? (
                  <span className="badge badge-free">Free Public Darshan</span>
                ) : (
                  <span className="badge badge-price">
                    Token: ₹{darshan.price.toLocaleString("en-IN")}
                  </span>
                )}
                {darshan.bookingEnabled ? (
                  <span className="badge badge-available">📱 Booking on Mobile App</span>
                ) : (
                  <span className="badge badge-info">Direct Walk-in Open Daily</span>
                )}
              </div>

              <h2 className="modal-title">{darshan.name}</h2>
              <p className="modal-description">{darshan.description}</p>

              <div className="modal-booking-box">
                <div className="modal-booking-header">
                  <span className="modal-booking-icon">🛕</span>
                  <h4>Prescribed Darshan Timings</h4>
                </div>
                <p className="modal-booking-text">
                  <strong>Morning Session:</strong> 6:00 AM – 3:00 PM<br />
                  <strong>Evening Session:</strong> 4:00 PM – 11:00 PM<br />
                  <strong>Maharaj Special Darshan:</strong> Pournami &amp; Amavasya night
                </p>

                {darshan.bookingEnabled ? (
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
                      <span>Reserve Token via Mobile App</span>
                      <span>→</span>
                    </a>
                  </div>
                ) : (
                  <div className="modal-booking-action">
                    <span style={{ fontSize: "0.85rem", color: "var(--color-spiritual-green)", fontWeight: 600 }}>
                      ✓ No prior booking needed. Devotees may enter directly during temple hours.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
