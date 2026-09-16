import { useState, useEffect } from "react";
import SEOHead from "../components/SEOHead";
import DarshanCard from "../components/DarshanCard";
import AppPromoSection from "../components/AppPromoSection";
import { CardsGridSkeleton } from "../components/Skeletons";
import { getActiveDarshans } from "../services/darshanService";
import { getTempleInfo } from "../services/templeService";
import type { Darshan, TempleInfo } from "../types";

export default function DarshanPage() {
  const [darshans, setDarshans] = useState<Darshan[]>([]);
  const [templeInfo, setTempleInfo] = useState<TempleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getActiveDarshans(), getTempleInfo()])
      .then(([darshanData, infoData]) => {
        setDarshans(darshanData);
        setTempleInfo(infoData);
      })
      .catch((err) => {
        console.error("Error loading darshan details:", err);
        setError("Unable to load darshan details right now. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEOHead
        title="Darshan Timings & Offerings | Sri Kedareshwara Ashramam"
        description="View daily darshan timings, sacred darshan offerings, and visiting schedules at Sri Kedareshwara Ashramam."
      />

      {/* Page Banner Header */}
      <section style={{ background: "linear-gradient(180deg, #F9F4EB 0%, #FAF7F2 100%)", padding: "3.5rem 0 2.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: "760px" }}>
          <span className="section-badge">Sacred Presence</span>
          <h1 style={{ marginBottom: "0.85rem" }}>Darshan Information</h1>
          <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)" }}>
            Seek the divine presence. Darshan is open every day for devotees to pray, meditate, and absorb the spiritual energy of the sacred shrine.
          </p>
        </div>
      </section>

      {/* Darshan Timings Summary Card */}
      <section className="container" style={{ marginTop: "2.5rem" }}>
        <div className="card" style={{ padding: "2rem", background: "linear-gradient(135deg, #FFFDF9 0%, #F8F3EB 100%)", border: "1px solid var(--color-gold-border)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1.5rem" }}>
            <div>
              <span className="badge badge-price" style={{ marginBottom: "0.5rem" }}>Daily Darshan Hours</span>
              <h2 style={{ fontSize: "1.45rem", marginBottom: "0.35rem" }}>General Public Darshan</h2>
              <p style={{ fontSize: "0.925rem", color: "var(--text-secondary)", margin: 0 }}>
                Open to all visitors without any prior reservation or ticket.
              </p>
            </div>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ background: "var(--bg-surface)", padding: "0.75rem 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "0.785rem", color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>Morning</span>
                <span style={{ fontWeight: 700, color: "var(--color-maroon)", fontSize: "1.1rem" }}>
                  {templeInfo?.timings?.morning || "6:00 AM - 12:00 PM"}
                </span>
              </div>
              <div style={{ background: "var(--bg-surface)", padding: "0.75rem 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "0.785rem", color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>Evening</span>
                <span style={{ fontWeight: 700, color: "var(--color-maroon)", fontSize: "1.1rem" }}>
                  {templeInfo?.timings?.evening || "4:00 PM - 9:00 PM"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Darshan Offerings Grid */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Active Darshan Offerings</h2>
            <p className="section-subtitle">
              Choose from general or special darshan arrangements. Online slot reservations are handled via the official Android mobile app.
            </p>
          </div>

          {loading ? (
            <CardsGridSkeleton count={3} />
          ) : error ? (
            <div className="error-banner">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          ) : darshans.length > 0 ? (
            <div className="cards-grid">
              {darshans.map((darshan) => (
                <DarshanCard key={darshan.id} darshan={darshan} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🛕</div>
              <h3>General Darshan Active</h3>
              <p>Darshan is available during all morning and evening temple hours.</p>
            </div>
          )}
        </div>
      </section>

      <AppPromoSection />
    </>
  );
}
