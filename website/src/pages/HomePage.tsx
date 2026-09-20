import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import BannerCarousel from "../components/BannerCarousel";
import SevaCard from "../components/SevaCard";
import DarshanCard from "../components/DarshanCard";
import DonationCard from "../components/DonationCard";
import NewsCard from "../components/NewsCard";
import EventCard from "../components/EventCard";
import AppPromoSection from "../components/AppPromoSection";
import SEOHead from "../components/SEOHead";
import { CardsGridSkeleton } from "../components/Skeletons";

import { getTempleInfo } from "../services/templeService";
import { getActiveBanners } from "../services/bannerService";
import { getActiveServices } from "../services/serviceService";
import { getActiveDarshans } from "../services/darshanService";
import { getActiveDonationTypes } from "../services/donationService";
import { getPublishedNews } from "../services/newsService";
import { getPublishedEvents } from "../services/eventService";

import type {
  TempleInfo,
  Banner,
  Service,
  Darshan,
  DonationType,
  News,
  Event as TempleEvent,
} from "../types";

export default function HomePage() {
  const [templeInfo, setTempleInfo] = useState<TempleInfo | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [darshans, setDarshans] = useState<Darshan[]>([]);
  const [donationTypes, setDonationTypes] = useState<DonationType[]>([]);
  const [newsList, setNewsList] = useState<News[]>([]);
  const [eventsList, setEventsList] = useState<TempleEvent[]>([]);

  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingDarshans, setLoadingDarshans] = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [loadingNewsEvents, setLoadingNewsEvents] = useState(true);

  useEffect(() => {
    // Load Temple Info & Banners
    getTempleInfo().then(setTempleInfo);
    getActiveBanners().then(setBanners);

    // Load Services
    getActiveServices()
      .then(setServices)
      .finally(() => setLoadingServices(false));

    // Load Darshans
    getActiveDarshans()
      .then(setDarshans)
      .finally(() => setLoadingDarshans(false));

    // Load Donations
    getActiveDonationTypes()
      .then(setDonationTypes)
      .finally(() => setLoadingDonations(false));

    // Load News & Events
    Promise.all([getPublishedNews(), getPublishedEvents()])
      .then(([news, events]) => {
        setNewsList(news.slice(0, 3));
        setEventsList(events.slice(0, 3));
      })
      .finally(() => setLoadingNewsEvents(false));
  }, []);

  return (
    <>
      <SEOHead
        title="Sri Kedareshwara Ashramam | Sacred Space for Devotion & Peace"
        description="Welcome to Sri Kedareshwara Ashramam. Explore daily darshan timings, Ashrama Seva (Free), Arjita Seva, spiritual donations, upcoming temple festivals, and news."
      />

      {/* Hero Section */}
      <Hero templeInfo={templeInfo} />

      {/* Quick Access Section */}
      <section className="section" style={{ paddingTop: "3.5rem", paddingBottom: "3.5rem" }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: "2.5rem" }}>
            <span className="section-badge">Direct Access</span>
            <h2 className="section-title">Sacred Offerings &amp; Darshan</h2>
            <p className="section-subtitle">
              Choose your path of devotion. Access daily darshan, traditional pujas, and charitable seva.
            </p>
          </div>

          <div className="quick-access-grid">
            {/* Quick Access 1: Ashrama Seva */}
            <div className="quick-card">
              <div className="quick-card-top">
                <div className="quick-card-icon">🕉️</div>
                <span className="badge badge-free">Free Seva</span>
              </div>
              <h3 className="quick-card-title">Ashrama Seva</h3>
              <p className="quick-card-desc">
                Sacred daily offerings and traditional community seva performed with devotion. Open and free for all devotees.
              </p>
              <Link to="/sevas" className="btn btn-secondary btn-sm quick-card-btn">
                <span>View Free Sevas</span>
                <span>→</span>
              </Link>
            </div>

            {/* Quick Access 2: Arjita Seva */}
            <div className="quick-card">
              <div className="quick-card-top">
                <div className="quick-card-icon">🪔</div>
                <span className="badge badge-price">Pujas &amp; Homam</span>
              </div>
              <h3 className="quick-card-title">Arjita Seva</h3>
              <p className="quick-card-desc">
                Special pujas, archana, and abhishekam performed with prescribed Vedic rituals and personal sankalpam.
              </p>
              <Link to="/sevas" className="btn btn-secondary btn-sm quick-card-btn">
                <span>Explore Pujas</span>
                <span>→</span>
              </Link>
            </div>

            {/* Quick Access 3: Darshan */}
            <div className="quick-card">
              <div className="quick-card-top">
                <div className="quick-card-icon">🛕</div>
                <span className="badge badge-available">Daily Darshan</span>
              </div>
              <h3 className="quick-card-title">Darshan</h3>
              <p className="quick-card-desc">
                Experience the divine presence. Check morning and evening darshan timings and general entry guidelines.
              </p>
              <Link to="/darshan" className="btn btn-secondary btn-sm quick-card-btn">
                <span>Darshan Timings</span>
                <span>→</span>
              </Link>
            </div>

            {/* Quick Access 4: Donation */}
            <div className="quick-card">
              <div className="quick-card-top">
                <div className="quick-card-icon">🙏</div>
                <span className="badge badge-info">Annadanam</span>
              </div>
              <h3 className="quick-card-title">Donations</h3>
              <p className="quick-card-desc">
                Participate in Annadanam (free food distribution), temple renovation, and sacred maintenance funds.
              </p>
              <Link to="/donations" className="btn btn-secondary btn-sm quick-card-btn">
                <span>Support Seva</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements / Banners Section (gracefully hidden if empty) */}
      {banners && banners.length > 0 && (
        <section className="container">
          <BannerCarousel banners={banners} />
        </section>
      )}

      {/* Temple Information Section */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Sacred Abode</span>
            <h2 className="section-title">Temple &amp; Ashram Information</h2>
            <p className="section-subtitle">
              Plan your holy pilgrimage with essential information on timings, location, and temple decorum.
            </p>
          </div>

          <div className="temple-info-grid">
            {/* Left: About Details */}
            <div className="temple-info-card">
              <span className="badge badge-price" style={{ marginBottom: "1rem" }}>
                Spiritual Presence
              </span>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>
                {templeInfo?.name || "Sri Kedareshwara Ashramam"}
              </h3>
              <p style={{ lineHeight: "1.7", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                {templeInfo?.description ||
                  "Sri Kedareshwara Ashramam is an authentic sanctuary consecrated to provide a serene refuge for spiritual reflection, worship, and selfless community seva. Visitors from all walks of life are invited to receive divine blessings in an atmosphere of tranquility and Vedic reverence."}
              </p>

              <div className="contact-mini-list">
                <div className="contact-mini-item">
                  <span className="contact-mini-icon">📍</span>
                  <div className="contact-mini-details">
                    <h4>Ashram Location</h4>
                    <p>
                      Sri Kedareshwara Ashramam, Navasiddula Gutta, Nandipet, Nizamabad
                    </p>
                  </div>
                </div>
                <div className="contact-mini-item">
                  <span className="contact-mini-icon">📞</span>
                  <div className="contact-mini-details">
                    <h4>Contact Phone</h4>
                    <p>
                      <a href="tel:+918462271418">+918462-271418</a>
                    </p>
                  </div>
                </div>
                <div className="contact-mini-item">
                  <span className="contact-mini-icon">✉️</span>
                  <div className="contact-mini-details">
                    <h4>Email Inquiries</h4>
                    <p>
                      <a href="mailto:services@kedari.org">services@kedari.org</a>
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "2rem" }}>
                <Link to="/about" className="btn btn-secondary">
                  Read Full Ashram Story →
                </Link>
              </div>
            </div>

            {/* Right: Timings Schedule */}
            <div className="timings-card">
              <div className="timings-header">
                <span style={{ fontSize: "1.75rem" }}>🪔</span>
                <div>
                  <h3>Daily Darshan &amp; Temple Timings</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Prescribed hours for prayer and public entry
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div className="timing-row">
                  <span className="timing-label">
                    <span>🌅</span>
                    <span>Morning Session</span>
                  </span>
                  <span className="timing-value">
                    {templeInfo?.timings?.morning || "6:00 AM – 3:00 PM"}
                  </span>
                </div>

                <div className="timing-row">
                  <span className="timing-label">
                    <span>🌇</span>
                    <span>Evening Session</span>
                  </span>
                  <span className="timing-value">
                    {templeInfo?.timings?.evening || "4:00 PM – 11:00 PM"}
                  </span>
                </div>

                <div className="timing-row">
                  <span className="timing-label">
                    <span>✨</span>
                    <span>Maharaj Special Darshan</span>
                  </span>
                  <span className="timing-value">
                    {templeInfo?.timings?.maharajSpecial || "Pournami & Amavasya night"}
                  </span>
                </div>

                <div className="timing-row">
                  <span className="timing-label">
                    <span>🍲</span>
                    <span>Annadanam (Prasadam)</span>
                  </span>
                  <span className="timing-value">12:30 PM – 2:00 PM</span>
                </div>

                <div className="timing-row">
                  <span className="timing-label">
                    <span>🔔</span>
                    <span>Maha Deeparadhana</span>
                  </span>
                  <span className="timing-value">7:00 PM Daily</span>
                </div>
              </div>

              <div style={{ marginTop: "auto", paddingTop: "1.75rem" }}>
                <div style={{ background: "rgba(217, 119, 6, 0.08)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-accent)" }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-maroon)", margin: 0, lineHeight: "1.5" }}>
                    ℹ️ Special festival timings and auspicious puja slots are updated regularly in our mobile app and announcements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Sevas Section */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Sacred Services</span>
            <h2 className="section-title">Ashrama &amp; Arjita Sevas</h2>
            <p className="section-subtitle">
              Participate in sacred rituals and offerings consecrated for spiritual wellbeing, family prosperity, and inner peace.
            </p>
          </div>

          {loadingServices ? (
            <CardsGridSkeleton count={3} />
          ) : services.length > 0 ? (
            <>
              <div className="cards-grid">
                {services.slice(0, 6).map((service) => (
                  <SevaCard key={service.id} service={service} />
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
                <Link to="/sevas" className="btn btn-secondary btn-lg">
                  View All Sevas &amp; Pujas →
                </Link>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🪔</div>
              <h3>Sevas Scheduled Soon</h3>
              <p>Active seva listings are being refreshed. Please check back shortly or visit the Ashramam.</p>
            </div>
          )}
        </div>
      </section>

      {/* Darshan Overview Section */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Divine Grace</span>
            <h2 className="section-title">Darshan Offerings</h2>
            <p className="section-subtitle">
              Sacred sight of the presiding deity. Everyone is welcome for general darshan without any fee.
            </p>
          </div>

          {loadingDarshans ? (
            <CardsGridSkeleton count={3} />
          ) : darshans.length > 0 ? (
            <div className="cards-grid">
              {darshans.map((darshan) => (
                <DarshanCard key={darshan.id} darshan={darshan} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🛕</div>
              <h3>General Darshan Open Daily</h3>
              <p>Darshan is open every morning and evening during scheduled temple hours.</p>
            </div>
          )}
        </div>
      </section>

      {/* Sacred Donations Section */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Selfless Giving</span>
            <h2 className="section-title">Sacred Donations &amp; Seva Funds</h2>
            <p className="section-subtitle">
              Support the noble mission of Sri Kedareshwara Ashramam. Your voluntary contributions nurture daily Annadanam and temple rituals.
            </p>
          </div>

          {loadingDonations ? (
            <CardsGridSkeleton count={3} />
          ) : donationTypes.length > 0 ? (
            <>
              <div className="cards-grid">
                {donationTypes.slice(0, 3).map((donationType) => (
                  <DonationCard key={donationType.id} donationType={donationType} />
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
                <Link to="/donations" className="btn btn-secondary btn-lg">
                  Explore All Donation Funds →
                </Link>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🙏</div>
              <h3>Donation Funds</h3>
              <p>Donation categories will be updated soon. In-person contributions can be made at the temple counter.</p>
            </div>
          )}
        </div>
      </section>

      {/* Latest News & Upcoming Events Section */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Ashram Updates</span>
            <h2 className="section-title">Latest News &amp; Upcoming Events</h2>
            <p className="section-subtitle">
              Stay informed with holy festival dates, spiritual discourses, and auspicious temple ceremonies.
            </p>
          </div>

          {loadingNewsEvents ? (
            <CardsGridSkeleton count={3} />
          ) : (
            <div>
              {/* Events Row if available */}
              {eventsList.length > 0 && (
                <div style={{ marginBottom: "3rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                    <h3 style={{ fontSize: "1.35rem" }}>🎉 Upcoming Events &amp; Utsavams</h3>
                    <Link to="/news" style={{ color: "var(--color-saffron-hover)", fontWeight: 600, fontSize: "0.9rem" }}>
                      View All Events →
                    </Link>
                  </div>
                  <div className="cards-grid">
                    {eventsList.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}

              {/* News Row if available */}
              {newsList.length > 0 && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                    <h3 style={{ fontSize: "1.35rem" }}>📰 Recent Announcements</h3>
                    <Link to="/news" style={{ color: "var(--color-saffron-hover)", fontWeight: 600, fontSize: "0.9rem" }}>
                      View All News →
                    </Link>
                  </div>
                  <div className="cards-grid">
                    {newsList.map((news) => (
                      <NewsCard key={news.id} news={news} />
                    ))}
                  </div>
                </div>
              )}

              {eventsList.length === 0 && newsList.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">🔔</div>
                  <h3>No Updates At This Moment</h3>
                  <p>Check back soon for new festival announcements and ashram updates.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Android Mobile App Promotion CTA */}
      <AppPromoSection />
    </>
  );
}
