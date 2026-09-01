import { useState, useEffect, type FormEvent } from "react";
import { getBanners, createBanner, updateBanner, deleteBanner } from "../services/bannerService";
import type { Banner } from "../types";

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "",
    isActive: true,
    displayOrder: 1,
    actionUrl: "",
  });

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await getBanners();
      setBanners(data);
    } catch (err) {
      console.error("Error loading banners:", err);
      setError("Failed to load banners.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setEditingId(banner.id!);
      setFormData({
        title: banner.title,
        imageUrl: banner.imageUrl,
        isActive: banner.isActive,
        displayOrder: banner.displayOrder,
        actionUrl: banner.actionUrl || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        imageUrl: "",
        isActive: true,
        displayOrder: banners.length > 0 ? banners[banners.length - 1].displayOrder + 1 : 1,
        actionUrl: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateBanner(editingId, formData);
      } else {
        await createBanner(formData);
      }
      await loadBanners();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving banner:", err);
      alert("Failed to save banner. Please check permissions and input.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteBanner(deleteId);
      await loadBanners();
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting banner:", err);
      alert("Failed to delete banner.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading && banners.length === 0) {
    return (
      <div className="empty-state">
        <span className="spinner"></span>
        <p style={{ marginTop: "12px" }}>Loading banners...</p>
      </div>
    );
  }

  return (
    <div className="banners-page">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a" }}>Promotional Banners</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.92rem", marginTop: "4px" }}>
            Configure auto-sliding hero banners displayed on the mobile app home screen.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {/* View Mode Switcher */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
              padding: "3px",
              display: "flex",
            }}
          >
            <button
              onClick={() => setViewMode("grid")}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "none",
                background: viewMode === "grid" ? "var(--color-primary-bg)" : "transparent",
                color: viewMode === "grid" ? "var(--color-primary)" : "var(--color-text-secondary)",
                fontWeight: "700",
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              🖼️ Grid
            </button>
            <button
              onClick={() => setViewMode("table")}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "none",
                background: viewMode === "table" ? "var(--color-primary-bg)" : "transparent",
                color: viewMode === "table" ? "var(--color-primary)" : "var(--color-text-secondary)",
                fontWeight: "700",
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              📋 Table
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Add New Banner
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {banners.length === 0 && !error ? (
        <div className="card-section empty-state">
          <div className="empty-icon">🖼️</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
            No banners published yet
          </h3>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "18px" }}>
            Create your first banner to highlight special darshans, utsavams, or temple announcements.
          </p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Create First Banner
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Cards View */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="form-card"
              style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column" }}
            >
              {/* Banner Image Preview Container */}
              <div
                style={{
                  height: "170px",
                  position: "relative",
                  backgroundImage: `url(${banner.imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: "#f1f5f9",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)",
                  }}
                />

                {/* Top Badges */}
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    right: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      background: "rgba(0,0,0,0.6)",
                      backdropFilter: "blur(4px)",
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: "800",
                    }}
                  >
                    #{banner.displayOrder} Order
                  </span>

                  <span className={`badge ${banner.isActive ? "badge-success" : "badge-neutral"}`}>
                    {banner.isActive ? "● Active" : "● Inactive"}
                  </span>
                </div>

                {/* Bottom Title */}
                {banner.title && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "14px",
                      right: "14px",
                      color: "#fff",
                      fontWeight: "800",
                      fontSize: "1rem",
                      textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                    }}
                  >
                    {banner.title}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div
                style={{
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#ffffff",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--color-text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "180px",
                  }}
                >
                  {banner.actionUrl || "No redirect link"}
                </span>

                <div className="action-buttons">
                  <button className="btn-icon text-primary" onClick={() => handleOpenModal(banner)}>
                    ✏️ Edit
                  </button>
                  <button className="btn-icon text-danger" onClick={() => setDeleteId(banner.id!)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="card-section" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-container" style={{ border: "none" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "110px" }}>Thumbnail</th>
                  <th>Banner Title</th>
                  <th>Display Order</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner) => (
                  <tr key={banner.id}>
                    <td>
                      {banner.imageUrl ? (
                        <img src={banner.imageUrl} alt={banner.title} className="table-img-preview" />
                      ) : (
                        <div className="table-img-placeholder">No Image</div>
                      )}
                    </td>
                    <td style={{ fontWeight: "700", color: "#0f172a" }}>{banner.title || "Untitled Banner"}</td>
                    <td>
                      <span className="ref-code">#{banner.displayOrder}</span>
                    </td>
                    <td>
                      <span className={`badge ${banner.isActive ? "badge-success" : "badge-neutral"}`}>
                        {banner.isActive ? "● Active" : "● Inactive"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                        <button className="btn-icon text-primary" onClick={() => handleOpenModal(banner)}>
                          Edit
                        </button>
                        <button className="btn-icon text-danger" onClick={() => setDeleteId(banner.id!)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal with Live Preview */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? "Edit Banner" : "Create New Banner"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Live Image Preview */}
                {formData.imageUrl && (
                  <div
                    style={{
                      height: "220px",
                      borderRadius: "12px",
                      background: "#0f172a",
                      border: "1px solid var(--color-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
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
                )}

                <div className="form-group">
                  <label>Banner Title *</label>
                  <input
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Annual Brahmotsavam 2026"
                  />
                </div>

                <div className="form-group">
                  <label>Image URL *</label>
                  <input
                    required
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                  />
                  <span className="form-help">Enter a high-resolution 16:9 banner image link.</span>
                </div>

                <div className="form-group">
                  <label>Action / Navigation URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.actionUrl}
                    onChange={(e) => handleInputChange("actionUrl", e.target.value)}
                    placeholder="https://templedarshan.org/event"
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Display Priority / Order</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.displayOrder}
                      onChange={(e) => handleInputChange("displayOrder", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="form-group flex-checkbox">
                    <label className="checkbox-label" style={{ marginTop: "20px" }}>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange("isActive", e.target.checked)}
                      />
                      <span>Active on Mobile Homepage</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner spinner-sm" /> : "Save Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-content modal-sm">
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--color-text-secondary)" }}>
                Are you sure you want to delete this promotional banner? It will no longer appear on the devotee app.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Banner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
