import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { getEventById } from "../services/eventService";
import type { Event as TempleEvent } from "../types";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<TempleEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getEventById(id)
      .then((data) => {
        if (data) {
          setEvent(data);
        } else {
          setError("The requested event could not be found.");
        }
      })
      .catch((err) => {
        console.error("Error loading event:", err);
        setError("Unable to load event details. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <SEOHead
        title={event ? `${event.title} | Sri Kedareshwara Ashramam` : "Event Details | Sri Kedareshwara Ashramam"}
        description={event?.description?.slice(0, 150) || "Sacred event details from Sri Kedareshwara Ashramam."}
      />

      <section className="section">
        <div className="container" style={{ maxWidth: "800px" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <Link to="/news" className="btn btn-secondary btn-sm">
              ← Back to News &amp; Events
            </Link>
          </div>

          {loading ? (
            <div className="card" style={{ padding: "2rem" }}>
              <div className="skeleton" style={{ height: "300px", width: "100%", marginBottom: "1.5rem" }} />
              <div className="skeleton" style={{ height: "32px", width: "80%", marginBottom: "1rem" }} />
              <div className="skeleton" style={{ height: "24px", width: "50%", marginBottom: "1.5rem" }} />
              <div className="skeleton" style={{ height: "16px", width: "100%", marginBottom: "0.5rem" }} />
              <div className="skeleton" style={{ height: "16px", width: "95%" }} />
            </div>
          ) : error || !event ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎉</div>
              <h3>Event Not Found</h3>
              <p>{error || "This event may have concluded or been removed."}</p>
              <div style={{ marginTop: "1.5rem" }}>
                <Link to="/news" className="btn btn-primary">
                  Return to News &amp; Events
                </Link>
              </div>
            </div>
          ) : (
            <article className="card" style={{ overflow: "hidden", padding: 0 }}>
              {event.imageUrl && (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  style={{ width: "100%", maxHeight: "420px", objectFit: "cover" }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              )}

              <div style={{ padding: "2.5rem" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
                  <span className="badge badge-price">Temple Event</span>
                  {event.eventDate && (
                    <span className="badge badge-info">
                      📅 {formatEventDate(event.eventDate)}
                    </span>
                  )}
                </div>

                <h1 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.35rem)", marginBottom: "1.5rem", color: "var(--color-maroon-dark)" }}>
                  {event.title}
                </h1>

                {/* Event Highlights Info Box */}
                <div style={{ background: "var(--bg-warm-tint)", padding: "1.25rem 1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", marginBottom: "2rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.85rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "1.1rem" }}>📅</span>
                      <span style={{ fontWeight: 600, color: "var(--color-maroon)" }}>Date:</span>
                      <span>{formatEventDate(event.eventDate)}</span>
                    </div>
                    {(event.startTime || event.endTime) && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.1rem" }}>⏰</span>
                        <span style={{ fontWeight: 600, color: "var(--color-maroon)" }}>Time:</span>
                        <span>
                          {event.startTime || "Start"} {event.endTime ? ` - ${event.endTime}` : ""}
                        </span>
                      </div>
                    )}
                    {event.location && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.1rem" }}>📍</span>
                        <span style={{ fontWeight: 600, color: "var(--color-maroon)" }}>Venue:</span>
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "1.05rem",
                    lineHeight: "1.8",
                    color: "var(--text-secondary)",
                    whiteSpace: "pre-line",
                  }}
                >
                  {event.description}
                </div>

                <div style={{ marginTop: "2.5rem", padding: "1.25rem", background: "rgba(217, 119, 6, 0.08)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-accent)" }}>
                  <h4 style={{ fontSize: "0.95rem", color: "var(--color-maroon)", marginBottom: "0.35rem" }}>
                    Pilgrim Information
                  </h4>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>
                    Devotees are cordially invited to participate in this auspicious event. For special seating or puja sponsorships, kindly contact the Ashramam administrative office.
                  </p>
                </div>
              </div>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
