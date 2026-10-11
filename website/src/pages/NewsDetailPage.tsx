import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import { getNewsById } from "../services/newsService";
import type { News } from "../types";

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getNewsById(id)
      .then((data) => {
        if (data) {
          setNews(data);
        } else {
          setError("The requested article could not be found.");
        }
      })
      .catch((err) => {
        console.error("Error loading article:", err);
        setError("Unable to load article. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, [id]);

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
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <SEOHead
        title={news ? `${news.title} | Sri Kedareshwara Ashramam` : "News Article | Sri Kedareshwara Ashramam"}
        description={news?.content?.slice(0, 150) || "News update from Sri Kedareshwara Ashramam."}
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
              <div className="skeleton" style={{ height: "18px", width: "40%", marginBottom: "1.5rem" }} />
              <div className="skeleton" style={{ height: "16px", width: "100%", marginBottom: "0.5rem" }} />
              <div className="skeleton" style={{ height: "16px", width: "90%", marginBottom: "0.5rem" }} />
              <div className="skeleton" style={{ height: "16px", width: "95%" }} />
            </div>
          ) : error || !news ? (
            <div className="empty-state">
              <div className="empty-state-icon">📰</div>
              <h3>Article Not Found</h3>
              <p>{error || "This article may have been unpublished or removed."}</p>
              <div style={{ marginTop: "1.5rem" }}>
                <Link to="/news" className="btn btn-primary">
                  Return to News Page
                </Link>
              </div>
            </div>
          ) : (
            <article className="card" style={{ overflow: "hidden", padding: 0 }}>
              {news.imageUrl && (
                <img
                  src={news.imageUrl}
                  alt={news.title}
                  style={{ width: "100%", maxHeight: "420px", objectFit: "cover" }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              )}

              <div style={{ padding: "2.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <span className="badge badge-price">Ashram News</span>
                  {(news.publishedAt || news.createdAt) && (
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      {formatDate(news.publishedAt || news.createdAt)}
                    </span>
                  )}
                </div>

                <h1 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.35rem)", marginBottom: "1.5rem", color: "var(--color-maroon-dark)" }}>
                  {news.title}
                </h1>

                <div
                  style={{
                    fontSize: "1.05rem",
                    lineHeight: "1.8",
                    color: "var(--text-secondary)",
                    whiteSpace: "pre-line",
                  }}
                >
                  {news.content}
                </div>
              </div>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
