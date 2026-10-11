import { useState } from "react";
import { Link } from "react-router-dom";
import type { Event } from "../types";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Format event date (YYYY-MM-DD to readable date)
  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formattedDate = formatEventDate(event.eventDate) || "Upcoming Date";

  return (
    <>
      <div className="event-card">
        {/* Consecrated Imagery Frame */}
        <div className="event-img-frame">
          {event.imageUrl && !imgError ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="event-img"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="card-img-placeholder" style={{ height: "100%" }}>
              <span>🎉 Holy Utsavam</span>
            </div>
          )}
          <div className="event-img-vignette" />

          {/* Top-Left Event Badge */}
          <div className="event-badge-container">
            <span className="event-glass-badge">🎉 Sacred Utsavam</span>
          </div>

          {/* Top-Right Date Badge */}
          <div className="event-date-badge">
            <span>📅</span>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="event-card-body">
          <h3 className="event-card-title">{event.title}</h3>

          {/* Event Time & Venue Meta */}
          <div className="event-meta-row">
            {(event.startTime || event.endTime) && (
              <div className="event-meta-item">
                <span>⏰</span>
                <span>
                  {event.startTime || "Morning"} {event.endTime ? `– ${event.endTime}` : ""}
                </span>
              </div>
            )}
            {event.location && (
              <div className="event-meta-item">
                <span>📍</span>
                <span>{event.location}</span>
              </div>
            )}
          </div>

          <p className="event-card-desc">{event.description}</p>

          <div className="event-card-footer">
            <span style={{ fontSize: "0.78rem", color: "var(--color-spiritual-green)", fontWeight: 700 }}>
              ✓ Open for All Devotees
            </span>
            <button
              type="button"
              className="btn-event-cta"
              onClick={() => setShowModal(true)}
              aria-label={`View details for ${event.title}`}
            >
              <span>Event Details</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setShowModal(false)}
              aria-label="Close modal"
            >
              ✕
            </button>

            {event.imageUrl && !imgError && (
              <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
                <img
                  src={event.imageUrl}
                  alt={event.title}
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
                  <span className="event-glass-badge">🎉 Sacred Utsavam</span>
                </div>
              </div>
            )}

            <div className="modal-content">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", fontSize: "0.85rem", color: "var(--color-saffron-hover)", fontWeight: 700 }}>
                <span>📅 {formattedDate}</span>
                <span>&bull;</span>
                <span>{event.startTime || "All Day"} {event.endTime ? `– ${event.endTime}` : ""}</span>
              </div>

              <h2 style={{ fontSize: "1.5rem", color: "var(--color-maroon)", marginBottom: "0.85rem", lineHeight: "1.3" }}>
                {event.title}
              </h2>

              {event.location && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem", color: "var(--color-maroon)", fontWeight: 600, fontSize: "0.9rem" }}>
                  <span>📍</span>
                  <span>{event.location}</span>
                </div>
              )}

              <p style={{ color: "var(--text-secondary)", lineHeight: "1.7", fontSize: "0.98rem", marginBottom: "1.5rem", whiteSpace: "pre-line" }}>
                {event.description}
              </p>

              <div
                style={{
                  background: "var(--bg-warm-tint)",
                  padding: "1rem 1.25rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(197, 155, 39, 0.25)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <strong style={{ display: "block", fontSize: "0.9rem", color: "var(--color-maroon)" }}>
                    Attending the Event?
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    No prior tickets needed for public utsavam ceremonies. Plan your visit to Navasiddula Gutta.
                  </span>
                </div>
                <Link
                  to="/contact"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowModal(false)}
                >
                  Visit Guidelines
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
