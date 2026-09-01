import { useState, useEffect, type FormEvent } from "react";
import { getTempleInfo, updateTempleInfo } from "../services/templeService";
import type { TempleInfo } from "../types";

const emptyTempleInfo: Omit<TempleInfo, "updatedAt"> = {
  name: "",
  description: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  email: "",
  website: "",
  timings: {
    morning: "",
    evening: "",
  },
  imageUrl: "",
};

export default function TempleInfoPage() {
  const [formData, setFormData] = useState<Omit<TempleInfo, "updatedAt">>(emptyTempleInfo);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getTempleInfo();
        if (data) {
          setFormData({
            name: data.name || "",
            description: data.description || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            pincode: data.pincode || "",
            phone: data.phone || "",
            email: data.email || "",
            website: data.website || "",
            timings: {
              morning: data.timings?.morning || "",
              evening: data.timings?.evening || "",
            },
            imageUrl: data.imageUrl || "",
          });
        }
      } catch (err) {
        console.error("Error loading temple info:", err);
        setError("Failed to load temple information. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleInputChange = (field: keyof Omit<TempleInfo, "timings" | "updatedAt">, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTimingChange = (timeOfDay: "morning" | "evening", value: string) => {
    setFormData((prev) => ({
      ...prev,
      timings: {
        ...prev.timings,
        [timeOfDay]: value,
      },
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSaving(true);

    try {
      await updateTempleInfo(formData);
      setSuccessMsg("Temple information updated successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Error saving temple info:", err);
      setError("Failed to save temple information. Please check your permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner"></span>
        <p style={{ marginTop: "12px" }}>Loading temple information...</p>
      </div>
    );
  }

  return (
    <div className="temple-info-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a" }}>Temple Profile & Canonical Info</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.92rem", marginTop: "4px" }}>
            Configure temple identity, sacred darshan schedules, and devotee contact channels.
          </p>
        </div>
        <button
          onClick={handleSubmit}
          className="btn btn-primary"
          disabled={saving}
          style={{ padding: "10px 24px", fontSize: "0.95rem" }}
        >
          {saving ? (
            <>
              <span className="spinner spinner-sm" /> Saving...
            </>
          ) : (
            "💾 Save Changes"
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}
      {successMsg && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          {successMsg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "28px", alignItems: "start" }}>
        {/* Left Column: Configuration Forms */}
        <form onSubmit={handleSubmit}>
          {/* 1. General Details */}
          <div className="form-card">
            <div className="form-section">
              <h3>
                <span>🏛️</span> General Temple Details
              </h3>
              <div className="form-grid">
                <div className="form-group span-full">
                  <label>Temple Name *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Sri Venkateswara Swamy Temple"
                  />
                </div>

                <div className="form-group span-full">
                  <label>Description & Sthala Puranam *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Provide a detailed description of the temple..."
                    rows={4}
                  />
                </div>

                <div className="form-group span-full">
                  <label>Temple Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                  />
                  <span className="form-help">
                    Enter a high-resolution temple image URL to display as header hero on mobile & web.
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Contact Information */}
            <div className="form-section">
              <h3>
                <span>📞</span> Devotee Contact Channels
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Official Phone Number *</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="contact@temple.org"
                  />
                </div>
                <div className="form-group span-full">
                  <label>Website URL</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://templedarshan.org"
                  />
                </div>
              </div>
            </div>

            {/* 3. Location */}
            <div className="form-section">
              <h3>
                <span>📍</span> Temple Address & Location
              </h3>
              <div className="form-grid">
                <div className="form-group span-full">
                  <label>Street Address *</label>
                  <input
                    required
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Temple Road, Main Entrance"
                  />
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <input
                    required
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input
                    required
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="State"
                  />
                </div>
                <div className="form-group">
                  <label>PIN Code *</label>
                  <input
                    required
                    value={formData.pincode}
                    onChange={(e) => handleInputChange("pincode", e.target.value)}
                    placeholder="500001"
                  />
                </div>
              </div>
            </div>

            {/* 4. Darshan Timings */}
            <div className="form-section">
              <h3>
                <span>⏰</span> Daily Darshan Schedule
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Morning Darshan Hours *</label>
                  <input
                    required
                    value={formData.timings.morning}
                    onChange={(e) => handleTimingChange("morning", e.target.value)}
                    placeholder="06:00 AM - 12:00 PM"
                  />
                </div>
                <div className="form-group">
                  <label>Evening Darshan Hours *</label>
                  <input
                    required
                    value={formData.timings.evening}
                    onChange={(e) => handleTimingChange("evening", e.target.value)}
                    placeholder="04:00 PM - 09:00 PM"
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <span className="spinner spinner-sm" /> Saving Changes...
                  </>
                ) : (
                  "💾 Save Changes"
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Right Column: Live Devotee Preview Card */}
        <div style={{ position: "sticky", top: "90px" }}>
          <div className="form-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <span style={{ fontSize: "1.1rem" }}>📱</span>
              <h4 style={{ fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>Devotee Mobile Preview</h4>
            </div>

            {formData.imageUrl ? (
              <div
                style={{
                  height: "180px",
                  borderRadius: "12px",
                  background: "#0f172a",
                  marginBottom: "14px",
                  border: "1px solid var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <img
                  src={formData.imageUrl}
                  alt="Temple Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    borderRadius: "12px",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  height: "140px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #fffbeb, #fed7aa)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5rem",
                  marginBottom: "14px",
                  border: "1px solid #fed7aa",
                }}
              >
                🛕
              </div>
            )}

            <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
              {formData.name || "Temple Name"}
            </h3>

            <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", marginBottom: "12px", lineHeight: "1.4" }}>
              {formData.city || formData.state
                ? `${formData.address ? `${formData.address}, ` : ""}${formData.city}, ${formData.state} - ${formData.pincode}`
                : "Temple Address"}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              <div
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#92400e" }}>☀️ Morning</span>
                <span style={{ fontSize: "0.82rem", fontWeight: "800", color: "#b45309" }}>
                  {formData.timings.morning || "06:00 AM - 12:00 PM"}
                </span>
              </div>

              <div
                style={{
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#9a3412" }}>🌙 Evening</span>
                <span style={{ fontSize: "0.82rem", fontWeight: "800", color: "#c2410c" }}>
                  {formData.timings.evening || "04:00 PM - 09:00 PM"}
                </span>
              </div>
            </div>

            {formData.phone && (
              <div style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                📞 <strong>Phone:</strong> {formData.phone}
              </div>
            )}
            {formData.email && (
              <div style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
                ✉️ <strong>Email:</strong> {formData.email}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
