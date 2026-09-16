import { useState } from "react";
import { Link } from "react-router-dom";
import type { News } from "../types";

interface NewsCardProps {
  news: News;
}

export default function NewsCard({ news }: NewsCardProps) {
  const [imgError, setImgError] = useState(false);

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

  const dateStr = formatDate(news.publishedAt || news.createdAt);

  return (
    <div className="card">
      <div className="card-img-wrapper" style={{ height: "180px" }}>
        {news.imageUrl && !imgError ? (
          <img
            src={news.imageUrl}
            alt={news.title}
            className="card-img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="card-img-placeholder">
            <span>📰 Ashram News</span>
          </div>
        )}
        {dateStr && (
          <div style={{ position: "absolute", bottom: "0.75rem", right: "0.75rem" }}>
            <span className="badge" style={{ backgroundColor: "rgba(0, 0, 0, 0.75)", color: "#FFFFFF" }}>
              {dateStr}
            </span>
          </div>
        )}
      </div>

      <div className="card-body">
        <h3 className="card-title" style={{ fontSize: "1.15rem" }}>{news.title}</h3>
        <p className="card-desc">
          {news.content}
        </p>

        <div className="card-footer">
          <Link to={`/news/${news.id}`} className="btn btn-outline btn-sm">
            Read More →
          </Link>
        </div>
      </div>
    </div>
  );
}
