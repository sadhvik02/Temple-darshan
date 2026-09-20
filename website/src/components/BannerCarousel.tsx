import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import type { Banner } from "../types";

interface BannerCarouselProps {
  banners: Banner[];
}

function getBannerMeta(title: string, actionUrl?: string) {
  const upper = (title || "").toUpperCase();

  if (upper.includes("WALLPAPER")) {
    return {
      tag: "✨ Divine Visuals",
      subtitle: "Adorn your phones and desktops with sacred high-resolution wallpapers of Poojya Guruji and temple deities.",
      actionText: "Download via Mobile App 📱",
      actionUrl: actionUrl || "/#mobile-app",
      isExternal: Boolean(actionUrl && actionUrl.startsWith("http")),
      objectPosition: "72% 0%", // Provides full headroom for Guruji's turban, face and blessing hand!
    };
  }

  if (upper.includes("ASHRAM") || upper.includes("KEDARESHWARA")) {
    return {
      tag: "🕉️ Sacred Abode",
      subtitle: "Experience the eternal tranquility, divine worship, and peaceful spiritual ambiance of Sri Kedareshwara Ashramam.",
      actionText: "About the Ashram →",
      actionUrl: actionUrl || "/about",
      isExternal: Boolean(actionUrl && actionUrl.startsWith("http")),
      objectPosition: "50% 25%",
    };
  }

  if (upper.includes("PRAYER") || upper.includes("PROGRAM") || upper.includes("SEVA")) {
    return {
      tag: "🪔 Daily Devotion",
      subtitle: "Participate in auspicious daily pujas, homams, and spiritual satsangs to receive divine blessings and inner peace.",
      actionText: "View Sevas & Pujas →",
      actionUrl: actionUrl || "/sevas",
      isExternal: Boolean(actionUrl && actionUrl.startsWith("http")),
      objectPosition: "center center",
    };
  }

  return {
    tag: "📢 Sacred Announcement",
    subtitle: "Stay connected with Sri Kedareshwara Ashramam's upcoming spiritual ceremonies, festive programs, and divine darshans.",
    actionText: "Learn More →",
    actionUrl: actionUrl || "/news",
    isExternal: Boolean(actionUrl && actionUrl.startsWith("http")),
    objectPosition: "center center",
  };
}

export default function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  if (!banners || banners.length === 0) {
    return null;
  }

  const totalBanners = banners.length;

  useEffect(() => {
    if (totalBanners <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalBanners);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalBanners, isPaused]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalBanners) % totalBanners);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalBanners);
  };

  const currentBanner = banners[currentIndex];
  const meta = getBannerMeta(currentBanner.title, currentBanner.actionUrl);

  const handleActionClick = () => {
    if (meta.actionUrl.includes("#mobile-app")) {
      const el = document.getElementById("mobile-app");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div
      className="banner-carousel-wrap"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Promotional Banners Carousel"
    >
      <div className="banner-slide">
        {/* Background Image with optimized focal position */}
        {currentBanner.imageUrl ? (
          <img
            key={currentBanner.imageUrl}
            src={currentBanner.imageUrl}
            alt={currentBanner.title}
            className="banner-img-bg"
            style={{ objectPosition: meta.objectPosition }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <div className="banner-img-bg fallback-bg" />
        )}

        {/* Cinematic Dual Vignette: Dark on left for text, completely clear on right */}
        <div className="banner-cinematic-overlay" />

        {/* Decorative Golden Corner Accents */}
        <div className="banner-gold-corner corner-tl" />
        <div className="banner-gold-corner corner-br" />

        {/* Content Box */}
        <div className="banner-content" key={currentBanner.id || currentIndex}>
          <div className="banner-tag-pill">
            <span>{meta.tag}</span>
          </div>

          <h3 className="banner-title">{currentBanner.title}</h3>
          <p className="banner-subtitle">{meta.subtitle}</p>

          <div className="banner-action-row">
            {meta.isExternal ? (
              <a
                href={meta.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary banner-action-btn"
              >
                <span>{meta.actionText}</span>
              </a>
            ) : (
              <Link
                to={meta.actionUrl}
                className="btn btn-primary banner-action-btn"
                onClick={handleActionClick}
              >
                <span>{meta.actionText}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Carousel Navigation (Arrows + Counter + Indicators) */}
        {totalBanners > 1 && (
          <div className="banner-controls">
            {/* Prev Button */}
            <button
              type="button"
              className="banner-arrow-btn"
              onClick={prevSlide}
              aria-label="Previous banner"
            >
              ‹
            </button>

            {/* Slide Indicators & Counter */}
            <div className="banner-nav-group">
              <span className="banner-counter">
                {String(currentIndex + 1).padStart(2, "0")} / {String(totalBanners).padStart(2, "0")}
              </span>
              <div className="banner-nav-dots">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`banner-dot ${idx === currentIndex ? "active" : ""}`}
                    onClick={() => goToSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Next Button */}
            <button
              type="button"
              className="banner-arrow-btn"
              onClick={nextSlide}
              aria-label="Next banner"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
