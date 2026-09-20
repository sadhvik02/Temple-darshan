import { useState } from "react";
import type { DonationType } from "../types";

interface DonationCardProps {
  donationType: DonationType;
}

export default function DonationCard({ donationType }: DonationCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(
    donationType.suggestedAmounts && donationType.suggestedAmounts.length > 1
      ? donationType.suggestedAmounts[1]
      : donationType.suggestedAmounts?.[0] || 1116
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Determine badge label and styling class
  const getBadgeInfo = () => {
    const combined = (donationType.title + " " + (donationType.category || "")).toUpperCase();
    if (combined.includes("ANNADANAM") || combined.includes("FOOD")) {
      return {
        label: "🍲 Nitya Annadanam",
        className: "badge-annadanam-glass",
      };
    }
    if (combined.includes("GOSHALA") || combined.includes("COW")) {
      return {
        label: "🐄 Go-Samrakshana",
        className: "badge-goshala-glass",
      };
    }
    if (combined.includes("MANDIR") || combined.includes("CONSTRUCTION") || combined.includes("TEMPLE")) {
      return {
        label: "🛕 Mandir Nirman",
        className: "badge-mandir-glass",
      };
    }
    return {
      label: "✨ Sacred Seva",
      className: "badge-annadanam-glass",
    };
  };

  const badgeInfo = getBadgeInfo();
  const amounts = donationType.suggestedAmounts && donationType.suggestedAmounts.length > 0
    ? donationType.suggestedAmounts
    : [501, 1116, 2500, 5000];

  return (
    <>
      <div className="donation-card">
        {/* Consecrated Imagery Frame */}
        <div className="donation-img-frame">
          {donationType.imageUrl && !imgError ? (
            <img
              src={donationType.imageUrl}
              alt={donationType.title}
              className="donation-img"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="card-img-placeholder" style={{ height: "100%" }}>
              <span>🙏 Sacred Ashram Seva</span>
            </div>
          )}
          <div className="donation-img-vignette" />

          {/* Top-Left Category Glass Badge */}
          <div className="donation-badge-container">
            <span className={`donation-glass-badge ${badgeInfo.className}`}>
              {badgeInfo.label}
            </span>
          </div>

          {/* Top-Right Tax / Sacred Exemption Pill */}
          <div className="donation-tax-badge">
            <span>📜</span>
            <span>80G Eligible</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="donation-card-body">
          <h3 className="donation-card-title">{donationType.title}</h3>
          <p className="donation-card-desc">
            {donationType.description ||
              "Support the noble spiritual mission, sacred feeding, and temple preservation of Sri Kedareshwara Ashramam."}
          </p>

          {/* Interactive Suggested Offerings Box */}
          <div className="donation-offerings-box">
            <div className="donation-offerings-header">
              <span className="donation-offerings-title">
                <span>🪷</span> Suggested Offerings:
              </span>
              {selectedAmount && (
                <span className="donation-selected-pill">
                  Chosen: ₹{selectedAmount.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            <div className="donation-chips-grid">
              {amounts.map((amt) => {
                const isSelected = selectedAmount === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    className={`donation-chip-btn ${isSelected ? "active" : ""}`}
                    onClick={() => setSelectedAmount(amt)}
                    title={`Select ₹${amt.toLocaleString("en-IN")}`}
                  >
                    ₹{amt.toLocaleString("en-IN")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card Footer CTA */}
          <div className="donation-card-footer">
            <div className="donation-trust-note">
              <span>🔒</span>
              <span>Direct Ashram Transfer</span>
            </div>
            <button
              type="button"
              className="btn-donation-cta"
              onClick={() => setShowInfoModal(true)}
              aria-label={`Contribute to ${donationType.title}`}
            >
              <span>Contribute Seva</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sacred Donation Details & Payment Modal */}
      {showInfoModal && (
        <div className="modal-backdrop" onClick={() => setShowInfoModal(false)}>
          <div className="modal-card donation-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowInfoModal(false)}
              aria-label="Close modal"
            >
              ✕
            </button>

            {/* Modal Image Top Banner */}
            {donationType.imageUrl && !imgError && (
              <div style={{ position: "relative", height: "180px", overflow: "hidden" }}>
                <img
                  src={donationType.imageUrl}
                  alt={donationType.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, transparent 40%, rgba(28, 10, 14, 0.85) 100%)",
                  }}
                />
                <div style={{ position: "absolute", bottom: "1rem", left: "1.5rem" }}>
                  <span className={`donation-glass-badge ${badgeInfo.className}`}>
                    {badgeInfo.label}
                  </span>
                </div>
              </div>
            )}

            <div className="modal-content">
              <h2 style={{ fontSize: "1.45rem", color: "var(--color-maroon)", marginBottom: "0.5rem" }}>
                {donationType.title}
              </h2>
              <p style={{ color: "var(--text-secondary)", lineHeight: "1.55", fontSize: "0.92rem", marginBottom: "1.25rem" }}>
                {donationType.description}
              </p>

              {/* Selected Amount Spotlight */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(217, 119, 6, 0.08)",
                  border: "1px solid rgba(217, 119, 6, 0.3)",
                  padding: "0.85rem 1.25rem",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "1.25rem",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 700, display: "block" }}>
                    Your Selected Offering
                  </span>
                  <strong style={{ fontSize: "1.35rem", color: "var(--color-maroon)" }}>
                    ₹{selectedAmount ? selectedAmount.toLocaleString("en-IN") : "Open Daana"}
                  </strong>
                </div>
                <div style={{ display: "flex", gap: "0.35rem" }}>
                  {amounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSelectedAmount(amt)}
                      style={{
                        padding: "0.3rem 0.6rem",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        borderRadius: "var(--radius-sm)",
                        border: selectedAmount === amt ? "1px solid var(--color-saffron)" : "1px solid var(--border-medium)",
                        background: selectedAmount === amt ? "var(--color-saffron)" : "#FFFFFF",
                        color: selectedAmount === amt ? "#FFFFFF" : "var(--color-maroon)",
                        cursor: "pointer",
                      }}
                    >
                      ₹{amt.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Official Ashram Trust Bank Transfer */}
              <div className="bank-details-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h4 style={{ fontSize: "0.95rem", color: "var(--color-maroon)", margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>🏛️</span> Official Ashram Trust Account
                  </h4>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-spiritual-green)", fontWeight: 700 }}>
                    ✓ Verified Trust
                  </span>
                </div>

                <div className="bank-field-row">
                  <span className="bank-field-label">Beneficiary:</span>
                  <span className="bank-field-value">Sri Kedareshwara Ashramam Trust</span>
                </div>

                <div className="bank-field-row">
                  <span className="bank-field-label">Bank Name:</span>
                  <span className="bank-field-value">State Bank of India (SBI)</span>
                </div>

                <div className="bank-field-row">
                  <span className="bank-field-label">Account Number:</span>
                  <span className="bank-field-value">
                    39824100918
                    <button
                      type="button"
                      className="btn-copy-mini"
                      onClick={() => handleCopy("39824100918", "acc")}
                    >
                      {copiedField === "acc" ? "Copied!" : "Copy"}
                    </button>
                  </span>
                </div>

                <div className="bank-field-row">
                  <span className="bank-field-label">IFSC Code:</span>
                  <span className="bank-field-value">
                    SBIN0001234
                    <button
                      type="button"
                      className="btn-copy-mini"
                      onClick={() => handleCopy("SBIN0001234", "ifsc")}
                    >
                      {copiedField === "ifsc" ? "Copied!" : "Copy"}
                    </button>
                  </span>
                </div>

                <div className="bank-field-row">
                  <span className="bank-field-label">Branch:</span>
                  <span className="bank-field-value">Nandipet, Nizamabad, Telangana</span>
                </div>

                <div className="bank-field-row">
                  <span className="bank-field-label">Trust UPI VPA:</span>
                  <span className="bank-field-value">
                    kedariashramam@sbi
                    <button
                      type="button"
                      className="btn-copy-mini"
                      onClick={() => handleCopy("kedariashramam@sbi", "upi")}
                    >
                      {copiedField === "upi" ? "Copied!" : "Copy"}
                    </button>
                  </span>
                </div>
              </div>

              {/* In-person & Mobile App Options */}
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--bg-warm-tint)",
                  padding: "1rem 1.25rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-maroon)", display: "block" }}>
                    📲 Instant In-App UPI &amp; E-Receipt
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                    Download our mobile app to track your seva contribution and receive your official digital 80G receipt.
                  </span>
                </div>
                <a
                  href="#download-app"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowInfoModal(false)}
                >
                  Open Mobile App
                </a>
              </div>

              <div style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                🙏 Cash and Cheque contributions are also accepted directly at the Ashram Office Counter on Navasiddula Gutta.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
