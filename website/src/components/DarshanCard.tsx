import { useState } from "react";
import type { Darshan } from "../types";

interface DarshanCardProps {
  darshan: Darshan;
}

export default function DarshanCard({ darshan }: DarshanCardProps) {
  const [imgError, setImgError] = useState(false);
  const isFree = darshan.price === 0;

  return (
    <div className="card">
      <div className="card-img-wrapper">
        {darshan.imageUrl && !imgError ? (
          <img
            src={darshan.imageUrl}
            alt={darshan.name}
            className="card-img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="card-img-placeholder">
            <span>🛕 Darshan</span>
          </div>
        )}
        <div style={{ position: "absolute", top: "0.85rem", left: "0.85rem" }}>
          {isFree ? (
            <span className="badge badge-free">Free Darshan</span>
          ) : (
            <span className="badge badge-price">Special Darshan</span>
          )}
        </div>
      </div>

      <div className="card-body">
        <h3 className="card-title">{darshan.name}</h3>
        <p className="card-desc">
          {darshan.description || "Divine darshan at Sri Kedareshwara Ashramam."}
        </p>

        <div className="card-footer">
          <div>
            {isFree ? (
              <span style={{ fontWeight: 700, color: "var(--color-spiritual-green)", fontSize: "1.05rem" }}>
                Free Entry
              </span>
            ) : (
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Token:</span>
                <span style={{ fontWeight: 700, color: "var(--color-maroon)", fontSize: "1.2rem" }}>
                  ₹{darshan.price.toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>

          <div>
            {darshan.bookingEnabled ? (
              <a href="#download-app" className="btn btn-outline btn-sm">
                Book on App
              </a>
            ) : (
              <span className="badge badge-info" style={{ textTransform: "none", fontSize: "0.785rem" }}>
                Direct Walk-in
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
