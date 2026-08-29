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
      setSuccessMsg("Temple information saved successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error("Error saving temple info:", err);
      setError("Failed to save temple information. Please check your permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <span className="spinner"></span>
        <p>Loading temple information...</p>
      </div>
    );
  }

  return (
    <div className="temple-info-page">
      <div className="page-header">
        <h1>Temple Information</h1>
        <p>Manage the canonical details displayed across the platform.</p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠</span>
              {error}
            </div>
          )}
          {successMsg && (
            <div className="alert alert-success" style={{ background: 'rgba(78, 203, 141, 0.1)', color: 'var(--color-success)', border: '1px solid rgba(78, 203, 141, 0.25)' }}>
              <span className="alert-icon">✓</span>
              {successMsg}
            </div>
          )}

          <div className="form-section">
            <h3>General Details</h3>
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
                <label>Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="About the temple..."
                  rows={4}
                  className="form-textarea"
                />
              </div>

              <div className="form-group span-full">
                <label>Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <small className="form-help">Firebase Storage is currently not enabled on the free plan. Use an external Image URL for now.</small>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Contact Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+91..."
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="temple@example.com"
                />
              </div>
              <div className="form-group span-full">
                <label>Website URL</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Location</h3>
            <div className="form-grid">
              <div className="form-group span-full">
                <label>Street Address *</label>
                <input
                  required
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="123 Temple Road"
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
                  placeholder="PIN Code"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Timings</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Morning Timings *</label>
                <input
                  required
                  value={formData.timings.morning}
                  onChange={(e) => handleTimingChange("morning", e.target.value)}
                  placeholder="e.g., 6:00 AM - 12:00 PM"
                />
              </div>
              <div className="form-group">
                <label>Evening Timings *</label>
                <input
                  required
                  value={formData.timings.evening}
                  onChange={(e) => handleTimingChange("evening", e.target.value)}
                  placeholder="e.g., 4:00 PM - 9:00 PM"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <><span className="spinner spinner-sm"></span> Saving...</>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
