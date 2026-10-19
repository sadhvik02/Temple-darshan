import { useState, useEffect, type FormEvent } from "react";
import { getTempleInfo, updateTempleInfo } from "../services/templeService";
import type { TempleInfo } from "../types";
import ImageUploadInput from "../components/ImageUploadInput";

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
  images: [],
  isDarshanEnabled: false,
  scrollingAnnouncement: "",
  featuredVideoUrl: "",
  featuredVideoTitle: "",
};

export default function TempleInfoPage() {
  const [formData, setFormData] = useState<Omit<TempleInfo, "updatedAt">>(emptyTempleInfo);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Gallery and preview states
  const [newPhotoInput, setNewPhotoInput] = useState("");
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getTempleInfo();
        if (data) {
          const rawImages: string[] = Array.isArray(data.images)
            ? (data.images as string[]).filter((url) => typeof url === "string" && url.trim().length > 0)
            : data.imageUrl
            ? [data.imageUrl.trim()]
            : [];

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
            imageUrl: data.imageUrl || rawImages[0] || "",
            images: rawImages,
            isDarshanEnabled: data.isDarshanEnabled ?? false,
            scrollingAnnouncement: data.scrollingAnnouncement || "",
            featuredVideoUrl: data.featuredVideoUrl || "",
            featuredVideoTitle: data.featuredVideoTitle || "",
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

  // Compute effective images for preview
  const previewImages =
    formData.images && formData.images.length > 0
      ? formData.images
      : formData.imageUrl
      ? [formData.imageUrl]
      : [];

  // Auto-advance preview if multiple photos exist
  useEffect(() => {
    if (previewImages.length <= 1) return;
    const timer = setInterval(() => {
      setActivePreviewIndex((prev) => (prev + 1) % previewImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [previewImages.length]);

  // Keep index within bounds
  useEffect(() => {
    if (activePreviewIndex >= previewImages.length && previewImages.length > 0) {
      setActivePreviewIndex(previewImages.length - 1);
    }
  }, [previewImages.length, activePreviewIndex]);

  const handleInputChange = (field: keyof Omit<TempleInfo, "timings" | "updatedAt">, value: any) => {
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

  // Gallery handlers
  const handleAddImage = (urlToAdd?: string) => {
    const url = (urlToAdd ?? newPhotoInput).trim();
    if (!url) return;
    const current = formData.images || [];
    if (current.includes(url)) return;
    const updated = [...current, url];
    setFormData((prev) => ({
      ...prev,
      images: updated,
      imageUrl: updated[0] || "",
    }));
    setNewPhotoInput("");
  };

  const handleRemoveImage = (index: number) => {
    const current = formData.images || [];
    const updated = current.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      images: updated,
      imageUrl: updated[0] || "",
    }));
  };

  const handleMoveImage = (index: number, direction: "up" | "down") => {
    const current = [...(formData.images || [])];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= current.length) return;
    const temp = current[index];
    current[index] = current[targetIndex];
    current[targetIndex] = temp;
    setFormData((prev) => ({
      ...prev,
      images: current,
      imageUrl: current[0] || "",
    }));
  };

  const handleMakePrimaryCover = (index: number) => {
    if (index === 0) return;
    const current = [...(formData.images || [])];
    const [selected] = current.splice(index, 1);
    current.unshift(selected);
    setFormData((prev) => ({
      ...prev,
      images: current,
      imageUrl: current[0] || "",
    }));
    setActivePreviewIndex(0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSaving(true);

    try {
      // Exclude mobile controls and announcements managed exclusively from NewsPage
      const {
        isDarshanEnabled,
        scrollingAnnouncement,
        featuredVideoUrl,
        featuredVideoTitle,
        ...canonicalData
      } = formData as any;

      const cleanImages = (formData.images || [])
        .map((img: string) => (img || "").trim())
        .filter(Boolean);

      const primaryImage =
        cleanImages.length > 0 ? cleanImages[0] : (formData.imageUrl?.trim() || "");

      canonicalData.imageUrl = primaryImage;
      canonicalData.images = cleanImages.length > 0 ? cleanImages : primaryImage ? [primaryImage] : [];

      await updateTempleInfo(canonicalData);
      setSuccessMsg("Temple profile & photo gallery updated successfully!");
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
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a" }}>Temple Profile & Photo Gallery</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.92rem", marginTop: "4px" }}>
            Configure temple identity, swipeable photos for the mobile app, sacred darshan schedules, and contact channels.
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
          {/* 1. General Details & Multi-Photo Gallery */}
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
                    placeholder="e.g., Sri Kedareshwara Ashramam"
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

                {/* Multiple Images / Photo Gallery Management */}
                <div className="form-group span-full" style={{ marginTop: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div>
                      <label style={{ fontSize: "0.95rem", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>📸</span> Temple Photo Gallery (Swipeable Carousel on Mobile App)
                      </label>
                      <span className="form-help" style={{ display: "block", marginTop: "2px" }}>
                        Devotees can swipe horizontally across these images on the Temple Details screen. The top image is the primary cover.
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: "700",
                        color: "#b45309",
                        background: "#fef3c7",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        border: "1px solid #fde68a",
                      }}
                    >
                      {(formData.images || []).length} {(formData.images || []).length === 1 ? "Photo" : "Photos"}
                    </span>
                  </div>

                  {/* Current Photos List */}
                  {(formData.images || []).length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                      {formData.images?.map((url, idx) => (
                        <div
                          key={`${url}-${idx}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: idx === 0 ? "#fffbeb" : "#f8fafc",
                            border: idx === 0 ? "2px solid #f59e0b" : "1px solid #e2e8f0",
                            borderRadius: "10px",
                            padding: "8px 12px",
                            gap: "12px",
                          }}
                        >
                          {/* Thumbnail & URL */}
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                width: "64px",
                                height: "46px",
                                borderRadius: "8px",
                                overflow: "hidden",
                                background: "#0f172a",
                                flexShrink: 0,
                                border: "1px solid #cbd5e1",
                              }}
                            >
                              <img
                                src={url}
                                alt={`Photo ${idx + 1}`}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/darshan_general.jpg";
                                }}
                              />
                            </div>

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                {idx === 0 ? (
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      fontWeight: "800",
                                      color: "#b45309",
                                      background: "#fde68a",
                                      padding: "2px 8px",
                                      borderRadius: "12px",
                                    }}
                                  >
                                    ⭐ Primary Cover
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: "0.7rem",
                                      fontWeight: "700",
                                      color: "#64748b",
                                      background: "#e2e8f0",
                                      padding: "2px 8px",
                                      borderRadius: "12px",
                                    }}
                                  >
                                    Slide #{idx + 1}
                                  </span>
                                )}
                              </div>
                              <p
                                style={{
                                  fontSize: "0.78rem",
                                  color: "#475569",
                                  margin: "3px 0 0 0",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                                title={url}
                              >
                                {url}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMakePrimaryCover(idx)}
                                title="Make this photo the primary cover image"
                                className="btn btn-secondary"
                                style={{ padding: "4px 9px", fontSize: "0.75rem", fontWeight: "700", color: "#b45309" }}
                              >
                                ⭐ Cover
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveImage(idx, "up")}
                              title="Move photo earlier in swipe carousel"
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem", opacity: idx === 0 ? 0.35 : 1 }}
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={idx === (formData.images?.length || 0) - 1}
                              onClick={() => handleMoveImage(idx, "down")}
                              title="Move photo later in swipe carousel"
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem", opacity: idx === (formData.images?.length || 0) - 1 ? 0.35 : 1 }}
                            >
                              ▼
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              title="Remove this photo from carousel"
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.75rem", color: "#dc2626" }}
                            >
                              🗑
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "16px",
                        background: "#fffbeb",
                        border: "1px dashed #f59e0b",
                        borderRadius: "10px",
                        textAlign: "center",
                        marginBottom: "14px",
                      }}
                    >
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#92400e", fontWeight: "600" }}>
                        No gallery photos added yet. Upload or pick photos below to display in the swipeable carousel!
                      </p>
                    </div>
                  )}

                  {/* Add New Photo Card */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h5 style={{ margin: 0, fontSize: "0.88rem", fontWeight: "700", color: "#334155" }}>
                        ➕ Upload or Add Photo to Gallery
                      </h5>
                    </div>
                    <ImageUploadInput
                      value={newPhotoInput}
                      onChange={(url) => {
                        setNewPhotoInput(url);
                        if (url) {
                          handleAddImage(url);
                          setNewPhotoInput("");
                        }
                      }}
                      folder="temple"
                      placeholder="https://... or choose from computer / presets"
                      helperText="Upload a photo directly from your computer, click an ashram preset, or paste a URL. It will automatically be added to the swipeable carousel."
                      presets={[
                        { label: "Main Ashram Sanctum", url: "/darshan_general.jpg", badge: "Sanctum" },
                        { label: "Sri Kedarananda Maharaj", url: "https://temple-darshan-app-d1719.web.app/guruji.png", badge: "Maharaj" },
                        { label: "Annadanam / Temple Gopuram", url: "/annadanam_seva.jpg", badge: "Mandir" },
                      ]}
                    />

                    {newPhotoInput && (
                      <button
                        type="button"
                        onClick={() => handleAddImage()}
                        className="btn btn-primary"
                        style={{ marginTop: "10px", padding: "6px 14px", fontSize: "0.82rem" }}
                      >
                        ➕ Add to Swipeable Gallery
                      </button>
                    )}
                  </div>
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
                    type="text"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://share.google/... or https://kedari.org"
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

        {/* Right Column: Live Devotee Mobile Preview Card */}
        <div style={{ position: "sticky", top: "90px" }}>
          <div className="form-card" style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.1rem" }}>📱</span>
                <h4 style={{ fontSize: "1rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>Devotee App Preview</h4>
              </div>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: "800",
                  padding: "3px 8px",
                  borderRadius: "20px",
                  background: formData.isDarshanEnabled ? "#dcfce7" : "#fee2e2",
                  color: formData.isDarshanEnabled ? "#15803d" : "#b91c1c",
                }}
              >
                {formData.isDarshanEnabled ? "Darshan Active" : "Darshan OFF"}
              </span>
            </div>

            {/* Swipeable / Scrollable Carousel Mockup */}
            <div
              style={{
                position: "relative",
                height: "190px",
                borderRadius: "14px",
                background: "#0f172a",
                marginBottom: "14px",
                overflow: "hidden",
                border: "1px solid var(--color-border)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              {previewImages.length > 0 ? (
                <>
                  <img
                    src={previewImages[activePreviewIndex] || "/darshan_general.jpg"}
                    alt="Temple Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "opacity 0.3s ease",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/darshan_general.jpg";
                    }}
                  />

                  {/* Devotional Gradient Overlay matching Flutter */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 35%, rgba(0,0,0,0.65) 70%, rgba(30,16,5,0.95) 100%)",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Simulated Mobile Back Button */}
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "13px",
                    }}
                  >
                    ←
                  </div>

                  {/* Top Right Photo Counter Badge (📸 1 / N) */}
                  {previewImages.length > 1 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: "rgba(0,0,0,0.65)",
                        backdropFilter: "blur(4px)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        borderRadius: "14px",
                        padding: "3px 8px",
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span>📸</span>
                      <span>
                        {activePreviewIndex + 1} / {previewImages.length}
                      </span>
                    </div>
                  )}

                  {/* Next / Prev Arrow Navigation */}
                  {previewImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setActivePreviewIndex((prev) => (prev > 0 ? prev - 1 : previewImages.length - 1));
                        }}
                        style={{
                          position: "absolute",
                          left: "6px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "rgba(0,0,0,0.55)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: "26px",
                          height: "26px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "13px",
                        }}
                        title="Previous Photo"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setActivePreviewIndex((prev) => (prev < previewImages.length - 1 ? prev + 1 : 0));
                        }}
                        style={{
                          position: "absolute",
                          right: "6px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "rgba(0,0,0,0.55)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "50%",
                          width: "26px",
                          height: "26px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "13px",
                        }}
                        title="Next Photo"
                      >
                        ›
                      </button>
                    </>
                  )}

                  {/* Bottom Elements: Orange Pill & Dots */}
                  <div
                    style={{
                      position: "absolute",
                      left: "12px",
                      right: "12px",
                      bottom: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        background: "rgba(255, 111, 0, 0.95)",
                        borderRadius: "14px",
                        padding: "2px 8px",
                        fontSize: "0.68rem",
                        fontWeight: "700",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      ✨ Sacred Sanctum
                    </span>

                    {/* Indicator Dots */}
                    {previewImages.length > 1 && (
                      <div style={{ display: "flex", gap: "4px", pointerEvents: "auto" }}>
                        {previewImages.map((_, i) => (
                          <div
                            key={i}
                            onClick={() => setActivePreviewIndex(i)}
                            style={{
                              width: activePreviewIndex === i ? "16px" : "6px",
                              height: "5px",
                              borderRadius: "3px",
                              background: activePreviewIndex === i ? "#ffb300" : "rgba(255,255,255,0.5)",
                              cursor: "pointer",
                              transition: "all 0.25s ease",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2.5rem",
                    background: "linear-gradient(135deg, #fffbeb, #fed7aa)",
                  }}
                >
                  🛕
                </div>
              )}
            </div>

            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
              {formData.name || "Temple Name"}
            </h3>

            <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginBottom: "12px", lineHeight: "1.4" }}>
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
