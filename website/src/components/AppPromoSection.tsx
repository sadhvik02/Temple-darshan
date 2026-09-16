export default function AppPromoSection() {
  return (
    <section id="download-app" className="section" style={{ paddingTop: "2rem" }}>
      <div className="container">
        <div className="app-promo-card">
          <div className="app-promo-grid">
            <div className="app-promo-content">
              <span className="badge" style={{ backgroundColor: "rgba(255, 255, 255, 0.2)", color: "#FFFFFF", marginBottom: "1rem" }}>
                📱 Official Android Mobile App
              </span>
              <h2>Experience Sri Kedareshwara Ashramam on the App</h2>
              <p>
                Stay spiritually connected wherever you are. Book ashrama &amp; arjita sevas, view live darshan timings, receive temple festival announcements, and contribute donations directly from your mobile device.
              </p>

              <div className="app-features-list">
                <div className="app-feature-item">
                  <span className="app-feature-check">✓</span>
                  <span>Instant Seva &amp; Darshan Booking</span>
                </div>
                <div className="app-feature-item">
                  <span className="app-feature-check">✓</span>
                  <span>Secure In-App UPI Offerings</span>
                </div>
                <div className="app-feature-item">
                  <span className="app-feature-check">✓</span>
                  <span>Festival &amp; Puja Push Notifications</span>
                </div>
                <div className="app-feature-item">
                  <span className="app-feature-check">✓</span>
                  <span>Digital Booking Passes &amp; Receipts</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <a
                  href="#contact"
                  className="btn btn-lg"
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: "var(--color-maroon)",
                    fontWeight: 700,
                    boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Sri Kedareshwara Ashramam Android App release: The APK is available through the Ashramam office and Google Play Store rollout. Please contact the temple office for direct access.");
                  }}
                >
                  <span>▶ Get on Google Play</span>
                </a>
                <span style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.8)" }}>
                  Available for Android 8.0+
                </span>
              </div>
            </div>

            <div className="app-visual-wrap">
              <div className="app-phone-mockup">
                <img
                  src="/feature_graphic_1024x500.png"
                  alt="Sri Kedareshwara Ashramam Mobile App Preview"
                  style={{ width: "100%", height: "260px", objectFit: "cover" }}
                />
                <div style={{ padding: "1rem 0.5rem 0.5rem 0.5rem", textAlign: "center" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-maroon-dark)", display: "block" }}>
                    Sri Kedareshwara Ashramam
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Digital Platform for Devotees
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
