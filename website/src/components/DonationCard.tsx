import { useState } from "react";
import type { DonationType } from "../types";

interface DonationCardProps {
  donationType: DonationType;
}

export default function DonationCard({ donationType }: DonationCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <>
      <div className="card">
        <div className="card-img-wrapper">
          {donationType.imageUrl && !imgError ? (
            <img
              src={donationType.imageUrl}
              alt={donationType.title}
              className="card-img"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="card-img-placeholder">
              <span>🙏 Sacred Donation</span>
            </div>
          )}
          <div style={{ position: "absolute", top: "0.85rem", left: "0.85rem" }}>
            <span className="badge badge-price">
              {donationType.category ? donationType.category.toUpperCase() : "SEVA FUND"}
            </span>
          </div>
        </div>

        <div className="card-body">
          <h3 className="card-title">{donationType.title}</h3>
          <p className="card-desc">
            {donationType.description || "Support the spiritual activities and temple maintenance of Sri Kedareshwara Ashramam."}
          </p>

          {/* Suggested Contribution Amounts */}
          {donationType.suggestedAmounts && donationType.suggestedAmounts.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                Suggested Offerings:
              </span>
              <div className="amount-chips">
                {donationType.suggestedAmounts.map((amt) => (
                  <span key={amt} className="amount-chip">
                    ₹{amt.toLocaleString("en-IN")}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="card-footer">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowInfoModal(true)}
            >
              Contribute
            </button>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Direct &bull; Transparent
            </span>
          </div>
        </div>
      </div>

      {/* Donation Information Modal */}
      {showInfoModal && (
        <div className="modal-backdrop" onClick={() => setShowInfoModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowInfoModal(false)}
              aria-label="Close modal"
            >
              ✕
            </button>
            <div className="modal-content">
              <span className="badge badge-price" style={{ marginBottom: "0.75rem" }}>
                Sacred Donation
              </span>
              <h2 style={{ fontSize: "1.45rem", marginBottom: "0.75rem" }}>{donationType.title}</h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "1.25rem" }}>
                {donationType.description}
              </p>

              <div style={{ background: "var(--bg-warm-tint)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", marginBottom: "1.25rem" }}>
                <h4 style={{ fontSize: "0.95rem", color: "var(--color-maroon)", marginBottom: "0.5rem" }}>
                  💳 How to Donate Safely
                </h4>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                  Devotees can offer contributions directly at the Ashramam office counter or use the secure in-app UPI payment feature available in the Sri Kedareshwara Ashramam Android App.
                </p>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <a href="#download-app" className="btn btn-primary btn-sm" onClick={() => setShowInfoModal(false)}>
                    Open in Mobile App
                  </a>
                  <a href="/contact" className="btn btn-secondary btn-sm" onClick={() => setShowInfoModal(false)}>
                    Contact Temple Office
                  </a>
                </div>
              </div>

              <p style={{ fontSize: "0.785rem", color: "var(--text-muted)", margin: 0, textAlign: "center" }}>
                All donations support the daily rituals, sacred festivals, and ashram welfare activities.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
