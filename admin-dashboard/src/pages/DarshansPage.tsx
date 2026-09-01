import { useState, useEffect, type FormEvent } from "react";
import { getDarshans, createDarshan, updateDarshan, deleteDarshan } from "../services/darshanService";
import type { Darshan } from "../types";

export default function DarshansPage() {
  const [darshans, setDarshans] = useState<Darshan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
    price: 0,
    bookingEnabled: true,
    isActive: true,
    displayOrder: 1,
  });

  const loadDarshans = async () => {
    setLoading(true);
    try {
      const data = await getDarshans();
      setDarshans(data);
    } catch (err) {
      console.error("Error loading darshans:", err);
      setError("Failed to load darshans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDarshans();
  }, []);

  const handleOpenModal = (darshan?: Darshan) => {
    if (darshan) {
      setEditingId(darshan.id!);
      setFormData({
        name: darshan.name,
        description: darshan.description,
        imageUrl: darshan.imageUrl || "",
        price: darshan.price,
        bookingEnabled: darshan.bookingEnabled,
        isActive: darshan.isActive,
        displayOrder: darshan.displayOrder,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        description: "",
        imageUrl: "",
        price: 0,
        bookingEnabled: true,
        isActive: true,
        displayOrder: darshans.length > 0 ? darshans[darshans.length - 1].displayOrder + 1 : 1,
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
        await updateDarshan(editingId, formData);
      } else {
        await createDarshan(formData);
      }
      await loadDarshans();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving darshan:", err);
      alert("Failed to save darshan. Please check permissions and input.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteDarshan(deleteId);
      await loadDarshans();
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting darshan:", err);
      alert("Failed to delete darshan.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading && darshans.length === 0) {
    return (
      <div className="empty-state">
        <span className="spinner"></span>
        <p style={{ marginTop: "12px" }}>Loading sacred darshans...</p>
      </div>
    );
  }

  const activeCount = darshans.filter((d) => d.isActive).length;
  const bookingCount = darshans.filter((d) => d.bookingEnabled).length;

  return (
    <div className="darshans-page">
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
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a" }}>Darshan Catalog & Offerings</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.92rem", marginTop: "4px" }}>
            Configure sacred darshan categories, dakshina tiers, and online pilgrim booking availability.
          </p>
        </div>

        <div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Add New Darshan
          </button>
        </div>
      </div>

      {/* Summary Chips - Full Width */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", width: "100%", marginBottom: "20px" }}>
        <div className="stat-card" style={{ padding: "12px 18px" }}>
          <span style={{ fontSize: "1.3rem" }}>🙏</span>
          <div>
            <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#0f172a" }}>{darshans.length}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
              Total Offerings
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "12px 18px" }}>
          <span style={{ fontSize: "1.3rem" }}>🟢</span>
          <div>
            <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#047857" }}>{activeCount}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
              Active on Mobile
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "12px 18px" }}>
          <span style={{ fontSize: "1.3rem" }}>⚡</span>
          <div>
            <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#b45309" }}>{bookingCount}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
              Booking Enabled
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {darshans.length === 0 && !error ? (
        <div className="card-section empty-state">
          <div className="empty-icon">🙏</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
            No darshan offerings added yet
          </h3>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "18px" }}>
            Create your first darshan category (e.g. Sarva Darshan, VIP Special Entry).
          </p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Add First Darshan
          </button>
        </div>
      ) : (
        /* Grid Cards View - Compact Size */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 320px))", gap: "16px" }}>
          {darshans.map((darshan) => (
            <div
              key={darshan.id}
              className="form-card"
              style={{
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderRadius: "12px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {darshan.imageUrl ? (
                      <img
                        src={darshan.imageUrl}
                        alt={darshan.name}
                        style={{ width: "42px", height: "42px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--color-border)" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "8px",
                          background: "linear-gradient(135deg, #fffbeb, #fed7aa)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.3rem",
                          border: "1px solid #fde68a",
                        }}
                      >
                        🙏
                      </div>
                    )}
                    <div>
                      <h3 style={{ fontSize: "0.98rem", fontWeight: "800", color: "#0f172a", marginBottom: "3px" }}>{darshan.name}</h3>
                      <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: "600" }}>
                        Priority #{darshan.displayOrder}
                      </span>
                    </div>
                  </div>

                  <span className={`badge ${darshan.isActive ? "badge-success" : "badge-neutral"}`} style={{ fontSize: "0.68rem", padding: "2px 6px" }}>
                    {darshan.isActive ? "● Active" : "● Inactive"}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: "0.80rem",
                    color: "var(--color-text-secondary)",
                    lineHeight: "1.4",
                    marginBottom: "12px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {darshan.description || "No specific details provided."}
                </p>
              </div>

              <div>
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.64rem", color: "var(--color-text-muted)", fontWeight: "700", textTransform: "uppercase" }}>
                      Dakshina / Fee
                    </div>
                    <div style={{ fontSize: "1.05rem", fontWeight: "900", color: darshan.price > 0 ? "#b45309" : "#047857" }}>
                      {darshan.price > 0 ? `₹${darshan.price}` : "Free"}
                    </div>
                  </div>

                  <span className={`badge ${darshan.bookingEnabled ? "badge-info" : "badge-neutral"}`} style={{ fontSize: "0.68rem", padding: "2px 6px" }}>
                    {darshan.bookingEnabled ? "⚡ Online Booking" : "Offline"}
                  </span>
                </div>

                <div className="action-buttons" style={{ justifyContent: "flex-end", gap: "6px" }}>
                  <button className="btn-icon text-primary" onClick={() => handleOpenModal(darshan)} style={{ fontSize: "0.78rem" }}>
                    ✏️ Edit
                  </button>
                  <button className="btn-icon text-danger" onClick={() => setDeleteId(darshan.id!)} style={{ fontSize: "0.78rem" }}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? "Edit Darshan Offering" : "Create New Darshan"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Darshan Category / Name *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., VIP Special Darshan"
                  />
                </div>

                <div className="form-group">
                  <label>Description & Sacred Significance *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Explain queue benefits, dress code, and sacred inclusions..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Image URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Dakshina / Ticket Price (₹) *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                    />
                    <span className="form-help">Enter 0 for free/general darshan.</span>
                  </div>

                  <div className="form-group">
                    <label>Display Priority</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.displayOrder}
                      onChange={(e) => handleInputChange("displayOrder", parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div className="form-grid" style={{ marginTop: "8px" }}>
                  <div className="form-group flex-checkbox">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.bookingEnabled}
                        onChange={(e) => handleInputChange("bookingEnabled", e.target.checked)}
                      />
                      <span>Enable Pilgrim Online Booking</span>
                    </label>
                  </div>

                  <div className="form-group flex-checkbox">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange("isActive", e.target.checked)}
                      />
                      <span>Active on Mobile Catalog</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner spinner-sm" /> : "Save Darshan"}
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
                Are you sure you want to remove this darshan offering? Active pilgrim slots may be affected.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Darshan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
