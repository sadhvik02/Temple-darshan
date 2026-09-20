import { useState, useEffect } from "react";
import SEOHead from "../components/SEOHead";
import DonationCard from "../components/DonationCard";
import AppPromoSection from "../components/AppPromoSection";
import { CardsGridSkeleton } from "../components/Skeletons";
import { getActiveDonationTypes, subscribeToActiveDonationTypes } from "../services/donationService";
import type { DonationType } from "../types";

export default function DonationsPage() {
  const [donationTypes, setDonationTypes] = useState<DonationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getActiveDonationTypes()
      .then((data) => {
        setDonationTypes(data);
      })
      .catch((err) => {
        console.error("Error loading donation types:", err);
        setError("Unable to load donation funds at this moment. Please try again later.");
      })
      .finally(() => setLoading(false));

    const unsubscribe = subscribeToActiveDonationTypes((data) => {
      setDonationTypes(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <SEOHead
        title="Spiritual Donations & Seva Funds | Sri Kedareshwara Ashramam"
        description="Support Sri Kedareshwara Ashramam. Explore Annadanam seva, temple renovation, and sacred contributions."
      />

      {/* Page Banner Header */}
      <section style={{ background: "linear-gradient(180deg, #F9F4EB 0%, #FAF7F2 100%)", padding: "3.5rem 0 2.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: "760px" }}>
          <span className="section-badge">Selfless Giving</span>
          <h1 style={{ marginBottom: "0.85rem" }}>Spiritual Donations &amp; Seva Funds</h1>
          <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)" }}>
            Contributions to the Ashramam nurture daily Annadanam, maintain the sanctity of the temple grounds, and support religious ceremonies.
          </p>
        </div>
      </section>

      {/* Donation Transparency Notice */}
      <section className="container" style={{ marginTop: "2.5rem" }}>
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem 2rem",
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <span style={{ fontSize: "2.2rem" }}>🙏</span>
          <div>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "0.25rem", color: "var(--color-maroon)" }}>
              Contribution Guidance
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
              Devotees can make contributions in person at the Ashramam office counter or digitally via our official Android Mobile App. All offerings are respectfully allocated to the designated seva funds.
            </p>
          </div>
        </div>
      </section>

      {/* Donation Types Grid */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Active Seva Funds</h2>
            <p className="section-subtitle">
              Choose the sacred cause you wish to support. Every contribution, small or large, is received with divine reverence.
            </p>
          </div>

          {loading ? (
            <CardsGridSkeleton count={3} />
          ) : error ? (
            <div className="error-banner">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          ) : donationTypes.length > 0 ? (
            <div className="cards-grid">
              {donationTypes.map((donationType) => (
                <DonationCard key={donationType.id} donationType={donationType} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🙏</div>
              <h3>Donation Funds Available In Person</h3>
              <p>Please contact the temple office or visit the Ashramam to offer donations for Annadanam and temple sevas.</p>
            </div>
          )}
        </div>
      </section>

      <AppPromoSection />
    </>
  );
}
