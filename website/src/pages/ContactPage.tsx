import { useState, useEffect, type FormEvent } from "react";
import SEOHead from "../components/SEOHead";
import AppPromoSection from "../components/AppPromoSection";
import { getTempleInfo } from "../services/templeService";
import type { TempleInfo } from "../types";

export default function ContactPage() {
  const [templeInfo, setTempleInfo] = useState<TempleInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // In-memory contact form state that generates a safe mailto: action
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    getTempleInfo()
      .then(setTempleInfo)
      .finally(() => setLoading(false));
  }, []);

  const templeName = templeInfo?.name || "Sri Kedareshwara Ashramam";
  const address = templeInfo
    ? `${templeInfo.address ? `${templeInfo.address}, ` : ""}${templeInfo.city}, ${templeInfo.state}${templeInfo.pincode ? ` - ${templeInfo.pincode}` : ""}`
    : "Sri Kedareshwara Ashramam, Navasiddula Gutta, Nandipet, Nizamabad";
  const phone = templeInfo?.phone || "+918462-271418";
  const email = templeInfo?.email || "services@kedari.org";

  // Maps URL generated directly from actual address
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `Sri Kedareshwara Ashramam, Navasiddula Gutta, Nandipet, Nizamabad`
  )}`;

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formName || !formMessage) return;

    // Use safe client mailto link to avoid insecure public Firestore writes
    const targetEmail = email || "services@kedari.org";
    const mailtoSubject = encodeURIComponent(
      `[Devotee Inquiry] ${formSubject || "General Inquiry"} - from ${formName}`
    );
    const mailtoBody = encodeURIComponent(
      `Name: ${formName}\nEmail: ${formEmail}\n\nMessage:\n${formMessage}`
    );

    window.location.href = `mailto:${targetEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;
    setFormSubmitted(true);
  };

  return (
    <>
      <SEOHead
        title={`Contact & Timings | ${templeName}`}
        description={`Contact ${templeName}. Get temple address, phone number, email, daily darshan timings, and location directions.`}
      />

      {/* Page Banner Header */}
      <section style={{ background: "linear-gradient(180deg, #F9F4EB 0%, #FAF7F2 100%)", padding: "3.5rem 0 2.5rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: "760px" }}>
          <span className="section-badge">Pilgrim Assistance</span>
          <h1 style={{ marginBottom: "0.85rem" }}>Contact &amp; Visit Timings</h1>
          <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)" }}>
            We welcome devotees and seekers. Reach out for seva inquiries, festival schedules, or directions to the holy premises.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                {/* Address Card */}
                <div className="card" style={{ padding: "2rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.85rem", color: "var(--color-saffron)" }}>📍</div>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Ashramam Address</h3>
                  <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: "1.6" }}>
                    {loading ? "Loading address..." : address || "Address details available at Ashramam office."}
                  </p>
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      View on Google Maps ↗
                    </a>
                  )}
                </div>

                {/* Phone Contact Card */}
                <div className="card" style={{ padding: "2rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.85rem", color: "var(--color-saffron)" }}>📞</div>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Phone Assistance</h3>
                  <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: "1.6" }}>
                    Available during temple office hours for general inquiries and booking information.
                  </p>
                  {phone ? (
                    <a href={`tel:${phone}`} className="btn btn-primary btn-sm">
                      Call {phone}
                    </a>
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Contact via temple counter</span>
                  )}
                </div>

                {/* Email Contact Card */}
                <div className="card" style={{ padding: "2rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.85rem", color: "var(--color-saffron)" }}>✉️</div>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Email Inquiries</h3>
                  <p style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: "1.6" }}>
                    Send questions regarding religious services, Annadanam, and ceremonial arrangements.
                  </p>
                  {email ? (
                    <a href={`mailto:${email}`} className="btn btn-outline btn-sm">
                      Send Email
                    </a>
                  ) : (
                    <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Email managed by office</span>
                  )}
                </div>
              </div>

              {/* Timings Details Section */}
              <div className="card" style={{ padding: "2.5rem", background: "linear-gradient(135deg, #FFFDF9 0%, #FAF4EB 100%)", border: "1px solid var(--color-gold-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <span style={{ fontSize: "1.75rem" }}>🔔</span>
                  <h2 style={{ fontSize: "1.45rem" }}>Temple Schedule Summary</h2>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                  <div style={{ background: "var(--bg-surface)", padding: "1.2rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                      Morning Darshan
                    </span>
                    <h4 style={{ color: "var(--color-maroon)", fontSize: "1.1rem", marginTop: "0.35rem" }}>
                      {templeInfo?.timings?.morning || "6:00 AM – 3:00 PM"}
                    </h4>
                  </div>

                  <div style={{ background: "var(--bg-surface)", padding: "1.2rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                      Evening Darshan
                    </span>
                    <h4 style={{ color: "var(--color-maroon)", fontSize: "1.1rem", marginTop: "0.35rem" }}>
                      {templeInfo?.timings?.evening || "4:00 PM – 11:00 PM"}
                    </h4>
                  </div>

                  <div style={{ background: "var(--bg-surface)", padding: "1.2rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                      Maharaj Special Darshan
                    </span>
                    <h4 style={{ color: "var(--color-saffron)", fontSize: "1.05rem", marginTop: "0.35rem" }}>
                      {templeInfo?.timings?.maharajSpecial || "Pournami & Amavasya night"}
                    </h4>
                  </div>

                  <div style={{ background: "var(--bg-surface)", padding: "1.2rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                      Prasadam (Annadanam)
                    </span>
                    <h4 style={{ color: "var(--color-maroon)", fontSize: "1.1rem", marginTop: "0.35rem" }}>
                      12:30 PM – 2:00 PM
                    </h4>
                  </div>
                </div>
              </div>

              {/* Inquiry Form Card (Client mailto dispatcher) */}
              <div className="card" style={{ padding: "2.5rem" }}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <h2 style={{ fontSize: "1.45rem", marginBottom: "0.35rem" }}>Send a Devotee Inquiry</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.925rem" }}>
                    Fill out your message below to send an email inquiry directly to the Ashramam office.
                  </p>
                </div>

                {formSubmitted ? (
                  <div style={{ background: "var(--color-spiritual-green-light)", border: "1px solid rgba(46, 125, 50, 0.3)", padding: "1.5rem", borderRadius: "var(--radius-md)", textAlign: "center" }}>
                    <span style={{ fontSize: "2rem" }}>🙏</span>
                    <h4 style={{ color: "var(--color-spiritual-green)", marginTop: "0.5rem" }}>Email Client Opened</h4>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: "0.5rem 0 1rem 0" }}>
                      Thank you. Your email draft has been generated. Send it through your email client to reach the temple administration.
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setFormSubmitted(false)}
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                          Devotee Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Your full name"
                          style={{
                            width: "100%",
                            padding: "0.65rem 0.85rem",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-medium)",
                            fontFamily: "var(--font-sans)",
                            fontSize: "0.925rem",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          style={{
                            width: "100%",
                            padding: "0.65rem 0.85rem",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-medium)",
                            fontFamily: "var(--font-sans)",
                            fontSize: "0.925rem",
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                        Inquiry Subject
                      </label>
                      <input
                        type="text"
                        value={formSubject}
                        onChange={(e) => setFormSubject(e.target.value)}
                        placeholder="e.g., Seva Booking, Annadanam contribution"
                        style={{
                          width: "100%",
                          padding: "0.65rem 0.85rem",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-medium)",
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.925rem",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                        Your Message *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formMessage}
                        onChange={(e) => setFormMessage(e.target.value)}
                        placeholder="Write your question or request here..."
                        style={{
                          width: "100%",
                          padding: "0.65rem 0.85rem",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-medium)",
                          fontFamily: "var(--font-sans)",
                          fontSize: "0.925rem",
                          resize: "vertical",
                        }}
                      />
                    </div>

                    <div>
                      <button type="submit" className="btn btn-primary">
                        Submit Inquiry (via Email) →
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <AppPromoSection />
    </>
  );
}
