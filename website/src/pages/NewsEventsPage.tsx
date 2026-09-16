import { useState, useEffect } from "react";
import SEOHead from "../components/SEOHead";
import NewsCard from "../components/NewsCard";
import EventCard from "../components/EventCard";
import AppPromoSection from "../components/AppPromoSection";
import { CardsGridSkeleton } from "../components/Skeletons";
import { getPublishedNews } from "../services/newsService";
import { getPublishedEvents } from "../services/eventService";
import type { News, Event as TempleEvent } from "../types";

export default function NewsEventsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "news" | "events">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newsList, setNewsList] = useState<News[]>([]);
  const [eventsList, setEventsList] = useState<TempleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPublishedNews(), getPublishedEvents()])
      .then(([news, events]) => {
        setNewsList(news);
        setEventsList(events);
      })
      .catch((err) => {
        console.error("Error loading news and events:", err);
        setError("Unable to load news and events right now. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtered lists based on search
  const filteredNews = newsList.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = eventsList.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <SEOHead
        title="News & Events | Sri Kedareshwara Ashramam"
        description="Stay updated with festival announcements, special pujas, and holy events at Sri Kedareshwara Ashramam."
      />

      {/* Page Banner Header */}
      <section style={{ background: "linear-gradient(180deg, #F9F4EB 0%, #FAF7F2 100%)", padding: "3.5rem 0 2.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: "760px" }}>
          <span className="section-badge">Ashram Chronicles</span>
          <h1 style={{ marginBottom: "0.85rem" }}>News &amp; Holy Events</h1>
          <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)" }}>
            Discover upcoming temple festivals, spiritual discourses, and auspicious announcements from Sri Kedareshwara Ashramam.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {/* Controls: Tabs & Search */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1.5rem", marginBottom: "2.5rem" }}>
            <div className="filter-tabs" style={{ margin: 0 }}>
              <button
                type="button"
                className={`filter-tab ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                All Updates ({newsList.length + eventsList.length})
              </button>
              <button
                type="button"
                className={`filter-tab ${activeTab === "events" ? "active" : ""}`}
                onClick={() => setActiveTab("events")}
              >
                🎉 Events ({eventsList.length})
              </button>
              <button
                type="button"
                className={`filter-tab ${activeTab === "news" ? "active" : ""}`}
                onClick={() => setActiveTab("news")}
              >
                📰 News ({newsList.length})
              </button>
            </div>

            {/* Search Input */}
            <div style={{ minWidth: "260px", flex: "1", maxWidth: "340px" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search news or events..."
                style={{
                  width: "100%",
                  padding: "0.65rem 1rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-medium)",
                  backgroundColor: "var(--bg-surface)",
                  fontSize: "0.9rem",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>
          </div>

          {loading ? (
            <CardsGridSkeleton count={6} />
          ) : error ? (
            <div className="error-banner">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
              {/* Events Section */}
              {(activeTab === "all" || activeTab === "events") && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>🎉</span>
                    <h2 style={{ fontSize: "1.5rem" }}>Upcoming Events &amp; Utsavams</h2>
                  </div>

                  {filteredEvents.length > 0 ? (
                    <div className="cards-grid">
                      {filteredEvents.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ margin: "1rem 0" }}>
                      <p>No upcoming events match your search.</p>
                    </div>
                  )}
                </div>
              )}

              {/* News Section */}
              {(activeTab === "all" || activeTab === "news") && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                    <span style={{ fontSize: "1.5rem" }}>📰</span>
                    <h2 style={{ fontSize: "1.5rem" }}>Ashram News &amp; Bulletins</h2>
                  </div>

                  {filteredNews.length > 0 ? (
                    <div className="cards-grid">
                      {filteredNews.map((news) => (
                        <NewsCard key={news.id} news={news} />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ margin: "1rem 0" }}>
                      <p>No news articles match your search.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <AppPromoSection />
    </>
  );
}
