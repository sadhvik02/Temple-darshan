import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import AppPromoSection from "../components/AppPromoSection";
import { getTempleInfo } from "../services/templeService";
import type { TempleInfo } from "../types";

export default function AboutPage() {
  const [templeInfo, setTempleInfo] = useState<TempleInfo | null>(null);

  useEffect(() => {
    getTempleInfo().then(setTempleInfo);
  }, []);

  const templeName = templeInfo?.name || "Sri Kedareshwara Ashramam";

  return (
    <>
      <SEOHead
        title={`About | ${templeName}`}
        description={`Learn about ${templeName}, our spiritual environment, daily worship timings, and guidelines for visiting devotees.`}
      />

      {/* Page Banner Header */}
      <section style={{ background: "linear-gradient(180deg, #F9F4EB 0%, #FAF7F2 100%)", padding: "3.5rem 0 2.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: "720px" }}>
          <span className="section-badge">Spiritual Sanctuary</span>
          <h1 style={{ marginBottom: "0.85rem" }}>About {templeName}</h1>
          <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)" }}>
            A sacred abode consecrated for peaceful worship, spiritual devotion, and selfless ashram seva.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "3rem" }}>
            {/* Overview / Introduction Card */}
            <div className="card" style={{ padding: "2.5rem", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <span style={{ fontSize: "2rem" }}>🛕</span>
                <h2 style={{ fontSize: "1.6rem" }}>Sacred Abode &amp; Purpose</h2>
              </div>

              <p style={{ fontSize: "1.05rem", lineHeight: "1.8", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                {templeInfo?.description ||
                  "Sri Kedareshwara Ashramam serves as a spiritual refuge where devotees can transcend the busyness of everyday life to experience peace, contemplation, and authentic devotional worship. The Ashramam upholds traditional Vedic rites, daily darshan, and sacred community sevas."}
              </p>

              <div style={{ background: "var(--bg-warm-tint)", borderLeft: "4px solid var(--color-saffron)", padding: "1.25rem 1.5rem", borderRadius: "0 var(--radius-md) var(--radius-md) 0" }}>
                <p style={{ margin: 0, fontStyle: "italic", color: "var(--color-maroon)", fontWeight: 500 }}>
                  "Devotion brings inner tranquility; selfless service awakens the divine within."
                </p>
              </div>
            </div>

            {/* Daily Schedule & Timings */}
            <div className="card" style={{ padding: "2.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "2rem" }}>⏰</span>
                <h2 style={{ fontSize: "1.6rem" }}>Daily Darshan &amp; Ashram Schedule</h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "var(--bg-warm-tint)", borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontWeight: 600, color: "var(--color-maroon)" }}>🌅 Morning Darshan</span>
                  <span style={{ fontWeight: 700 }}>{templeInfo?.timings?.morning || "6:00 AM - 12:00 PM"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "var(--bg-warm-tint)", borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontWeight: 600, color: "var(--color-maroon)" }}>🍲 Annadanam / Holy Prasadam</span>
                  <span style={{ fontWeight: 700 }}>12:30 PM - 2:00 PM</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "var(--bg-warm-tint)", borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontWeight: 600, color: "var(--color-maroon)" }}>🌇 Evening Darshan</span>
                  <span style={{ fontWeight: 700 }}>{templeInfo?.timings?.evening || "4:00 PM - 9:00 PM"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "var(--bg-warm-tint)", borderRadius: "var(--radius-md)" }}>
                  <span style={{ fontWeight: 600, color: "var(--color-maroon)" }}>🔔 Evening Maha Mangala Harathi</span>
                  <span style={{ fontWeight: 700 }}>7:00 PM</span>
                </div>
              </div>
            </div>

            {/* Pilgrim Guidelines & Decorum */}
            <div className="card" style={{ padding: "2.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <span style={{ fontSize: "2rem" }}>📋</span>
                <h2 style={{ fontSize: "1.6rem" }}>Pilgrim Guidelines &amp; Code of Conduct</h2>
              </div>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                To maintain the spiritual sanctity and peaceful ambience of Sri Kedareshwara Ashramam, we kindly request all visiting pilgrims to observe the following:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
                <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--color-saffron)", fontSize: "1.2rem" }}>•</span>
                  <div>
                    <h4 style={{ fontSize: "1rem", marginBottom: "0.2rem" }}>Traditional Attire</h4>
                    <p style={{ fontSize: "0.925rem" }}>Devotees are encouraged to wear modest, traditional Indian clothing when entering the sacred sanctum.</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--color-saffron)", fontSize: "1.2rem" }}>•</span>
                  <div>
                    <h4 style={{ fontSize: "1rem", marginBottom: "0.2rem" }}>Footwear Regulation</h4>
                    <p style={{ fontSize: "0.925rem" }}>Please deposit footwear at the designated counter outside the ashram main entrance.</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--color-saffron)", fontSize: "1.2rem" }}>•</span>
                  <div>
                    <h4 style={{ fontSize: "1rem", marginBottom: "0.2rem" }}>Silence &amp; Mobile Phone Etiquette</h4>
                    <p style={{ fontSize: "0.925rem" }}>Kindly switch mobile phones to silent mode inside the prayer halls and avoid photography where restricted.</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--color-saffron)", fontSize: "1.2rem" }}>•</span>
                  <div>
                    <h4 style={{ fontSize: "1rem", marginBottom: "0.2rem" }}>Prasadam &amp; Cleanliness</h4>
                    <p style={{ fontSize: "0.925rem" }}>Treat the holy premises with reverence and assist us in preserving a pristine, clean environment.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Visiting Info */}
            <div className="card" style={{ padding: "2.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <span style={{ fontSize: "2rem" }}>📍</span>
                <h2 style={{ fontSize: "1.6rem" }}>Location &amp; Visiting Assistance</h2>
              </div>

              {templeInfo?.address ? (
                <div style={{ marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 500 }}>
                    {templeInfo.address}, {templeInfo.city}, {templeInfo.state} - {templeInfo.pincode}
                  </p>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    {templeInfo.phone ? `Phone: ${templeInfo.phone}` : ""} {templeInfo.email ? `| Email: ${templeInfo.email}` : ""}
                  </p>
                </div>
              ) : (
                <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                  Detailed address is maintained in the Ashramam information directory.
                </p>
              )}

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <Link to="/contact" className="btn btn-primary">
                  View Contact &amp; Directions →
                </Link>
                <Link to="/sevas" className="btn btn-secondary">
                  Explore Sacred Sevas
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AppPromoSection />
    </>
  );
}
