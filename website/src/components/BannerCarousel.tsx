import { useState, useEffect } from "react";
import type { Banner } from "../types";

interface BannerCarouselProps {
  banners: Banner[];
}

export default function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // If no banners exist, gracefully hide the section entirely
  if (!banners || banners.length === 0) {
    return null;
  }

  // Auto slide if multiple banners exist
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const currentBanner = banners[currentIndex];

  return (
    <div className="banner-carousel-wrap">
      <div className="banner-slide">
        {currentBanner.imageUrl ? (
          <img
            src={currentBanner.imageUrl}
            alt={currentBanner.title}
            className="banner-img-bg"
            onError={(e) => {
              // Hide broken background image
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <div
            className="banner-img-bg"
            style={{
              background: "linear-gradient(135deg, #7F1D1D 0%, #4C0519 100%)",
            }}
          />
        )}
        <div className="banner-overlay" />

        <div className="banner-content">
          <span className="badge" style={{ backgroundColor: "rgba(255, 255, 255, 0.2)", color: "#FFFFFF", marginBottom: "0.85rem" }}>
            📢 Temple Announcement
          </span>
          <h3>{currentBanner.title}</h3>
          {currentBanner.actionUrl && (
            <a
              href={currentBanner.actionUrl}
              target={currentBanner.actionUrl.startsWith("http") ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ marginTop: "0.75rem" }}
            >
              Learn More →
            </a>
          )}
        </div>

        {/* Carousel indicators if more than one banner */}
        {banners.length > 1 && (
          <div className="banner-nav-dots">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`banner-dot ${idx === currentIndex ? "active" : ""}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
