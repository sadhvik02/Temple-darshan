import { useState } from "react";
import { Link } from "react-router-dom";
import type { News } from "../types";

interface NewsCardProps {
  news: News;
}

export default function NewsCard({ news }: NewsCardProps) {
  const [imgError, setImgError] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    let d: Date;
    if (timestamp.toDate) {
      d = timestamp.toDate();
    } else if (timestamp.seconds) {
      d = new Date(timestamp.seconds * 1000);
    } else {
      d = new Date(timestamp);
    }
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const dateStr = formatDate(news.publishedAt || news.createdAt) || "Recent";

  // Determine sacred category badge
  const getBadge = () => {
    const text = (news.title + " " + news.content).toUpperCase();
    if (text.includes("GANESH") || text.includes("VINAYAKA")) {
      return "🐘 Holy Mahotsavam";
    }
    if (text.includes("DIWALI") || text.includes("DEEPA")) {
      return "🪔 Deepotsavam";
    }
    if (text.includes("POURNAMI") || text.includes("MAHARAJ") || text.includes("DARSHAN")) {
      return "🙏 Maharaj Satsang";
    }
    return "✨ Ashram Notice";
  };

  return (
    <>
      <div className="news-card">
        {/* Consecrated Imagery Frame */}
        <div className="news-img-frame">
          {news.imageUrl && !imgError ? (
            <img
              src={news.imageUrl}
              alt={news.title}
              className="news-img"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="card-img-placeholder" style={{ height: "100%" }}>
              <span>📰 Ashram Announcement</span>
            </div>
          )}
          <div className="news-img-vignette" />

          {/* Top-Left Category Badge */}
          <div className="news-badge-container">
            <span className="news-glass-badge">{getBadge()}</span>
          </div>

          {/* Top-Right Date Badge */}
          <div className="news-date-badge">
            <span>📅</span>
            <span>{dateStr}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="news-card-body">
          <h3 className="news-card-title">{news.title}</h3>
          <p className="news-card-desc">{news.content}</p>

          <div className="news-card-footer">
            <span className="news-read-time">
              <span>⏱️</span>
              <span>2 min read</span>
            </span>
            <button
              type="button"
              className="btn-news-cta"
              onClick={() => setShowModal(true)}
              aria-label={`Read announcement: ${news.title}`}
            >
              <span>Read Notice</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full News Announcement Modal */}
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

            {news.imageUrl && !imgError && (
              <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
                <img
                  src={news.imageUrl}
                  alt={news.title}
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
                  <span className="news-glass-badge">{getBadge()}</span>
                </div>
              </div>
            )}

            <div className="modal-content">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", fontSize: "0.82rem", color: "var(--color-saffron-hover)", fontWeight: 600 }}>
                <span>📅 Published on {dateStr}</span>
                <span>&bull;</span>
                <span>Sri Kedareshwara Ashramam</span>
              </div>

              <h2 style={{ fontSize: "1.5rem", color: "var(--color-maroon)", marginBottom: "1rem", lineHeight: "1.3" }}>
                {news.title}
              </h2>

              <p style={{ color: "var(--text-secondary)", lineHeight: "1.7", fontSize: "0.98rem", marginBottom: "1.5rem", whiteSpace: "pre-line" }}>
                {news.content}
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
                    Seeking More Details?
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Contact the temple office or visit Navasiddula Gutta, Nandipet.
                  </span>
                </div>
                <Link
                  to="/contact"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowModal(false)}
                >
                  Contact Office
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
