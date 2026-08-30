import { useState, useEffect, type FormEvent } from "react";
import { getServices, createService, updateService, deleteService } from "../services/serviceService";
import type { Service } from "../types";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
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
    name: "",
    description: "",
    imageUrl: "",
    price: 0,
    bookingEnabled: true,
    isActive: true,
    displayOrder: 1,
  });

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await getServices();
      setServices(data);
    } catch (err) {
      console.error("Error loading services:", err);
      setError("Failed to load services.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingId(service.id!);
      setFormData({
        name: service.name,
        description: service.description,
        imageUrl: service.imageUrl || "",
        price: service.price,
        bookingEnabled: service.bookingEnabled,
        isActive: service.isActive,
        displayOrder: service.displayOrder,
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
        displayOrder: services.length > 0 ? services[services.length - 1].displayOrder + 1 : 1,
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
        await updateService(editingId, formData);
      } else {
        await createService(formData);
      }
      await loadServices();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving service:", err);
      alert("Failed to save service. Please check permissions and input.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteService(deleteId);
      await loadServices();
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting service:", err);
      alert("Failed to delete service.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading && services.length === 0) {
    return (
      <div className="empty-state">
        <span className="spinner"></span>
        <p style={{ marginTop: "12px" }}>Loading sacred sevas...</p>
      </div>
    );
  }

  const activeCount = services.filter((s) => s.isActive).length;
  const bookingCount = services.filter((s) => s.bookingEnabled).length;

  return (
    <div className="services-page">
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
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a" }}>Arjitha Sevas & Pujas</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.92rem", marginTop: "4px" }}>
            Manage sacred rituals, puja catalog, dakshina fees, and devotee booking access.
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
              🗂️ Cards
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
            + Add New Seva
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "24px" }}>
        <div className="stat-card" style={{ padding: "14px 20px", flex: 1, minWidth: "160px" }}>
          <span style={{ fontSize: "1.4rem" }}>🪔</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#0f172a" }}>{services.length}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
              Total Sevas
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "14px 20px", flex: 1, minWidth: "160px" }}>
          <span style={{ fontSize: "1.4rem" }}>🟢</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#047857" }}>{activeCount}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
              Active on Mobile
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "14px 20px", flex: 1, minWidth: "160px" }}>
          <span style={{ fontSize: "1.4rem" }}>⚡</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#b45309" }}>{bookingCount}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
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

      {services.length === 0 && !error ? (
        <div className="card-section empty-state">
          <div className="empty-icon">🪔</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
            No seva offerings created yet
          </h3>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "18px" }}>
            Add your first seva offering (e.g. Suprabhata Seva, Kalyanotsavam, Archana).
          </p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Add First Seva
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Cards View */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {services.map((service) => (
            <div
              key={service.id}
              className="form-card"
              style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "10px", border: "1px solid var(--color-border)" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #fffbeb, #fed7aa)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.5rem",
                          border: "1px solid #fde68a",
                        }}
                      >
                        🪔
                      </div>
                    )}
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>{service.name}</h3>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: "600" }}>
                        Display Priority #{service.displayOrder}
                      </span>
                    </div>
                  </div>

                  <span className={`badge ${service.isActive ? "badge-success" : "badge-neutral"}`}>
                    {service.isActive ? "● Active" : "● Inactive"}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: "0.86rem",
                    color: "var(--color-text-secondary)",
                    lineHeight: "1.5",
                    marginBottom: "16px",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {service.description || "Sacred temple seva and puja ritual."}
                </p>
              </div>

              <div>
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid var(--color-border)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: "700", textTransform: "uppercase" }}>
                      Dakshina / Offering
                    </div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#b45309" }}>
                      ₹{service.price}
                    </div>
                  </div>

                  <span className={`badge ${service.bookingEnabled ? "badge-info" : "badge-neutral"}`}>
                    {service.bookingEnabled ? "⚡ Online Booking" : "Offline"}
                  </span>
                </div>

                <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                  <button className="btn-icon text-primary" onClick={() => handleOpenModal(service)}>
                    ✏️ Edit
                  </button>
                  <button className="btn-icon text-danger" onClick={() => setDeleteId(service.id!)}>
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
                  <th>Seva Offering</th>
                  <th>Dakshina</th>
                  <th>Online Booking</th>
                  <th>Status</th>
                  <th>Display Order</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {service.imageUrl ? (
                          <img
                            src={service.imageUrl}
                            alt={service.name}
                            className="table-img-preview"
                          />
                        ) : (
                          <div className="table-img-placeholder">🪔 Seva</div>
                        )}
                        <div>
                          <div style={{ fontWeight: "800", color: "#0f172a" }}>{service.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            {service.description?.substring(0, 45)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: "800", color: "#b45309", fontSize: "0.95rem" }}>
                        ₹{service.price}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${service.bookingEnabled ? "badge-info" : "badge-neutral"}`}>
                        {service.bookingEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${service.isActive ? "badge-success" : "badge-neutral"}`}>
                        {service.isActive ? "● Active" : "● Inactive"}
                      </span>
                    </td>
                    <td>
                      <span className="ref-code">#{service.displayOrder}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                        <button className="btn-icon text-primary" onClick={() => handleOpenModal(service)}>
                          Edit
                        </button>
                        <button className="btn-icon text-danger" onClick={() => setDeleteId(service.id!)}>
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? "Edit Seva Offering" : "Add New Seva"}</h2>
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
                      height: "130px",
                      borderRadius: "10px",
                      backgroundImage: `url(${formData.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      border: "1px solid var(--color-border)",
                    }}
                  />
                )}

                <div className="form-group">
                  <label>Seva / Puja Name *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Kalyanotsavam, Suprabhata Seva"
                  />
                </div>

                <div className="form-group">
                  <label>Description & Ritual Inclusions *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe the puja rituals, prasadam, and dress code..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Cover Image URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Dakshina Amount (₹) *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                    />
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
                      <span>Enable Devotee Online Booking</span>
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
                  {saving ? <span className="spinner spinner-sm" /> : "Save Seva"}
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
                Are you sure you want to delete this seva offering? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Seva"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
