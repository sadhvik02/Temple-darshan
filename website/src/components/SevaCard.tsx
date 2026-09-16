import { useState } from "react";
import type { Service } from "../types";

interface SevaCardProps {
  service: Service;
}

export default function SevaCard({ service }: SevaCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isAshramaSeva = service.category === "ashrama_seva" || service.price === 0;

  return (
    <>
      <div className="card">
        <div className="card-img-wrapper">
          {service.imageUrl && !imgError ? (
            <img
              src={service.imageUrl}
              alt={service.name}
              className="card-img"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="card-img-placeholder">
              <span>{isAshramaSeva ? "🕉️ Ashrama Seva" : "🪔 Arjita Seva"}</span>
            </div>
          )}
          <div style={{ position: "absolute", top: "0.85rem", left: "0.85rem" }}>
            {isAshramaSeva ? (
              <span className="badge badge-free">Ashrama Seva &bull; Free</span>
            ) : (
              <span className="badge badge-price">Arjita Seva</span>
            )}
          </div>
        </div>

        <div className="card-body">
          <h3 className="card-title">{service.name}</h3>
          <p className="card-desc">{service.description || "Traditional seva performed at the Ashramam."}</p>

          <div className="card-footer">
            <div>
              {isAshramaSeva ? (
                <span style={{ fontWeight: 700, color: "var(--color-spiritual-green)", fontSize: "1.05rem" }}>
                  Free Offering
                </span>
              ) : (
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Dakshina:</span>
                  <span style={{ fontWeight: 700, color: "var(--color-maroon)", fontSize: "1.2rem" }}>
                    ₹{service.price.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowModal(true)}
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowModal(false)}
              aria-label="Close modal"
            >
              ✕
            </button>

            {service.imageUrl && !imgError ? (
              <img src={service.imageUrl} alt={service.name} className="modal-img-top" />
            ) : (
              <div
                style={{
                  height: "160px",
                  background: "linear-gradient(135deg, #FDF6E9 0%, #F5E8D3 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "3rem",
                }}
              >
                🪔
              </div>
            )}

            <div className="modal-content">
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                {isAshramaSeva ? (
                  <span className="badge badge-free">Ashrama Seva (Free)</span>
                ) : (
                  <span className="badge badge-price">Arjita Seva (₹{service.price.toLocaleString("en-IN")})</span>
                )}
                {service.bookingEnabled ? (
                  <span className="badge badge-available">Booking on Mobile App</span>
                ) : (
                  <span className="badge badge-info">Informational Seva</span>
                )}
              </div>

              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.85rem" }}>{service.name}</h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.65", marginBottom: "1.5rem" }}>
                {service.description}
              </p>

              <div style={{ background: "var(--bg-warm-tint)", padding: "1.2rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <h4 style={{ fontSize: "0.95rem", color: "var(--color-maroon)", marginBottom: "0.35rem" }}>
                  📱 How to Participate / Book
                </h4>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>
                  Devotees can participate directly at the Ashramam or reserve specific dates through the official Sri Kedareshwara Ashramam Android App.
                </p>
                <div style={{ marginTop: "1rem" }}>
                  <a href="#download-app" className="btn btn-primary btn-sm" onClick={() => setShowModal(false)}>
                    Get Android App for Booking
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
