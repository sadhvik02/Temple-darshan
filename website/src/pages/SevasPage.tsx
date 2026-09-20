import { useState, useEffect } from "react";
import SEOHead from "../components/SEOHead";
import SevaCard from "../components/SevaCard";
import AppPromoSection from "../components/AppPromoSection";
import { CardsGridSkeleton } from "../components/Skeletons";
import { getActiveServices, subscribeToActiveServices } from "../services/serviceService";
import type { Service } from "../types";

export default function SevasPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"all" | "ashrama_seva" | "arjita_seva">("all");

  useEffect(() => {
    getActiveServices()
      .then((data) => {
        setServices(data);
      })
      .catch((err) => {
        console.error("Error loading sevas:", err);
        setError("Unable to load sevas at this moment. Please try again later.");
      })
      .finally(() => setLoading(false));

    const unsubscribe = subscribeToActiveServices((data) => {
      setServices(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter according strictly to the existing Firestore business categories: ashrama_seva vs arjita_seva
  const filteredServices = services.filter((s) => {
    if (selectedTab === "all") return true;
    if (selectedTab === "ashrama_seva") {
      return s.category === "ashrama_seva" || s.price === 0;
    }
    if (selectedTab === "arjita_seva") {
      return s.category === "arjita_seva" && s.price > 0;
    }
    return true;
  });

  return (
    <>
      <SEOHead
        title="Ashrama & Arjita Sevas | Sri Kedareshwara Ashramam"
        description="Explore sacred Ashrama Sevas (Free offerings) and Arjita Sevas (Special Pujas) performed at Sri Kedareshwara Ashramam. Learn how to participate."
      />

      {/* Page Banner Header */}
      <section style={{ background: "linear-gradient(180deg, #F9F4EB 0%, #FAF7F2 100%)", padding: "3.5rem 0 2.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: "760px" }}>
          <span className="section-badge">Divine Offerings</span>
          <h1 style={{ marginBottom: "0.85rem" }}>Ashrama &amp; Arjita Sevas</h1>
          <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)" }}>
            Participate in authentic Vedic rituals and pujas performed according to spiritual traditions. All Ashrama Sevas are offered freely to devotees.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* Category Filter Tabs */}
          <div className="filter-tabs">
            <button
              type="button"
              className={`filter-tab ${selectedTab === "all" ? "active" : ""}`}
              onClick={() => setSelectedTab("all")}
            >
              All Sevas ({services.length})
            </button>
            <button
              type="button"
              className={`filter-tab ${selectedTab === "ashrama_seva" ? "active" : ""}`}
              onClick={() => setSelectedTab("ashrama_seva")}
            >
              🕉️ Ashrama Seva (Free Offerings)
            </button>
            <button
              type="button"
              className={`filter-tab ${selectedTab === "arjita_seva" ? "active" : ""}`}
              onClick={() => setSelectedTab("arjita_seva")}
            >
              🪔 Arjita Seva (Special Pujas)
            </button>
          </div>

          {/* Description banner for selected category */}
          <div
            style={{
              maxWidth: "760px",
              margin: "0 auto 2.5rem auto",
              padding: "1rem 1.5rem",
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              textAlign: "center",
              fontSize: "0.925rem",
              color: "var(--text-secondary)",
            }}
          >
            {selectedTab === "ashrama_seva" && (
              <span>
                <strong>Ashrama Sevas</strong> are devotional offerings conducted daily for universal wellbeing. There is no fee to participate in these community services.
              </span>
            )}
            {selectedTab === "arjita_seva" && (
              <span>
                <strong>Arjita Sevas</strong> are sacred individualized pujas and homams performed with specific devotee sankalpam. The dakshina helps maintain the temple rituals.
              </span>
            )}
            {selectedTab === "all" && (
              <span>
                Browse all available spiritual offerings at Sri Kedareshwara Ashramam. Filter above by Ashrama Seva (Free) or Arjita Seva (Special).
              </span>
            )}
          </div>

          {/* Sevas Grid */}
          {loading ? (
            <CardsGridSkeleton count={6} />
          ) : error ? (
            <div className="error-banner">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="cards-grid">
              {filteredServices.map((service) => (
                <SevaCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🪔</div>
              <h3>No Sevas In This Category</h3>
              <p>There are currently no active seva offerings in this category. Please check other categories or visit the Ashramam.</p>
            </div>
          )}
        </div>
      </section>

      <AppPromoSection />
    </>
  );
}
