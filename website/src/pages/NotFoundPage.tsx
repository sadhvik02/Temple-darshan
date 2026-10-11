import { Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";

export default function NotFoundPage() {
  return (
    <>
      <SEOHead title="Page Not Found | Sri Kedareshwara Ashramam" />

      <section className="section" style={{ minHeight: "60vh", display: "flex", alignItems: "center" }}>
        <div className="container" style={{ textAlign: "center", maxWidth: "600px" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛕</div>
          <h1 style={{ fontSize: "2.25rem", marginBottom: "0.85rem", color: "var(--color-maroon)" }}>
            Sacred Path Not Found
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", marginBottom: "2rem", lineHeight: "1.6" }}>
            The page you are looking for might have been moved or does not exist. Please return to the homepage to explore Sri Kedareshwara Ashramam.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
            <Link to="/" className="btn btn-primary btn-lg">
              Return Home
            </Link>
            <Link to="/sevas" className="btn btn-secondary btn-lg">
              Explore Sevas
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
