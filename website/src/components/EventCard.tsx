import { useState } from "react";
import { Link } from "react-router-dom";
import type { Event } from "../types";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const [imgError, setImgError] = useState(false);

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

  const formattedDate = formatEventDate(event.eventDate);

  return (
    <div className="card">
      <div className="card-img-wrapper" style={{ height: "180px" }}>
        {event.imageUrl && !imgError ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="card-img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="card-img-placeholder">
            <span>🎉 Ashram Event</span>
          </div>
        )}
        {formattedDate && (
          <div style={{ position: "absolute", top: "0.85rem", left: "0.85rem" }}>
            <span className="badge badge-price">
              📅 {formattedDate}
            </span>
          </div>
        )}
      </div>

      <div className="card-body">
        <h3 className="card-title" style={{ fontSize: "1.15rem" }}>{event.title}</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.85rem", fontSize: "0.85rem", color: "var(--color-maroon)" }}>
          {(event.startTime || event.endTime) && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>⏰</span>
              <span>
                {event.startTime || "Start"} {event.endTime ? ` - ${event.endTime}` : ""}
              </span>
            </div>
          )}
          {event.location && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>📍</span>
              <span>{event.location}</span>
            </div>
          )}
        </div>

        <p className="card-desc">
          {event.description}
        </p>

        <div className="card-footer">
          <Link to={`/events/${event.id}`} className="btn btn-outline btn-sm">
            Event Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
