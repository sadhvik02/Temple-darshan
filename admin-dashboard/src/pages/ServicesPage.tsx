import { useState, useEffect, type FormEvent } from "react";
import { getServices, createService, updateService, deleteService } from "../services/serviceService";
import type { Service } from "../types";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    category: 'ashrama_seva' | 'arjita_seva';
    imageUrl: string;
    price: number;
    bookingEnabled: boolean;
    isActive: boolean;
    displayOrder: number;
  }>({
    name: "",
    description: "",
    category: "ashrama_seva",
    imageUrl: "",
    price: 0,
    bookingEnabled: true,
    isActive: true,
    displayOrder: 1,
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getServices();
      setServices(data);
    } catch (err) {
      console.error("Error loading services:", err);
      setError("Failed to load services. Please check Firebase permissions.");
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
        category: service.category || 'ashrama_seva',
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
        category: selectedCategory !== "all" ? (selectedCategory as 'ashrama_seva' | 'arjita_seva') : "ashrama_seva",
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

  const filteredServices = selectedCategory === "all"
    ? services
    : services.filter((s) => (s.category || "ashrama_seva") === selectedCategory);

  const ashramaCount = services.filter((s) => (s.category || "ashrama_seva") === "ashrama_seva").length;
  const arjitaCount = services.filter((s) => s.category === "arjita_seva").length;
  const activeCount = filteredServices.filter((s) => s.isActive).length;
  const bookingCount = filteredServices.filter((s) => s.bookingEnabled).length;

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
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a" }}>
            {selectedCategory === "ashrama_seva"
              ? "🕉️ Ashrama Sevas (Free)"
              : selectedCategory === "arjita_seva"
              ? "🪷 Arjitha Sevas & Pujas"
              : "Sacred Sevas & Offerings"}
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.92rem", marginTop: "4px" }}>
            Manage sacred rituals, puja catalog, dakshina fees, and devotee booking access.
          </p>
        </div>

        <div>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Add New Seva
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button
          onClick={() => setSelectedCategory("all")}
          style={{
            padding: "8px 18px",
            borderRadius: "12px",
            border: selectedCategory === "all" ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
            background: selectedCategory === "all" ? "var(--color-primary-bg)" : "#ffffff",
            color: selectedCategory === "all" ? "var(--color-primary)" : "var(--color-text-secondary)",
            fontWeight: "800",
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
        >
          <span>🌟</span> All Sevas ({services.length})
        </button>

        <button
          onClick={() => setSelectedCategory("ashrama_seva")}
          style={{
            padding: "8px 18px",
            borderRadius: "12px",
            border: selectedCategory === "ashrama_seva" ? "2px solid #0284c7" : "1px solid var(--color-border)",
            background: selectedCategory === "ashrama_seva" ? "#e0f2fe" : "#ffffff",
            color: selectedCategory === "ashrama_seva" ? "#0369a1" : "var(--color-text-secondary)",
            fontWeight: "800",
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
        >
          <span>🕉️</span> Ashrama Sevas ({ashramaCount})
        </button>

        <button
          onClick={() => setSelectedCategory("arjita_seva")}
          style={{
            padding: "8px 18px",
            borderRadius: "12px",
            border: selectedCategory === "arjita_seva" ? "2px solid #d97706" : "1px solid var(--color-border)",
            background: selectedCategory === "arjita_seva" ? "#fef3c7" : "#ffffff",
            color: selectedCategory === "arjita_seva" ? "#b45309" : "var(--color-text-secondary)",
            fontWeight: "800",
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
        >
          <span>🪷</span> Arjitha Sevas ({arjitaCount})
        </button>
      </div>

      {/* Summary Chips */}
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "24px" }}>
        <div className="stat-card" style={{ padding: "14px 20px", flex: 1, minWidth: "160px" }}>
          <span style={{ fontSize: "1.4rem" }}>🪔</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#0f172a" }}>{filteredServices.length}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
              {selectedCategory === "all" ? "Total Offerings" : "Showing in Category"}
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

      {filteredServices.length === 0 && !error ? (
        <div className="card-section empty-state">
          <div className="empty-icon">🪔</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
            No {selectedCategory === "ashrama_seva" ? "Ashrama Sevas" : selectedCategory === "arjita_seva" ? "Arjitha Sevas" : "sevas"} found
          </h3>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "18px" }}>
            {selectedCategory !== "all"
              ? `No offerings currently listed under this category. Click below to add one.`
              : `Add your first seva offering (e.g. Suprabhata Seva, Kalyanotsavam, Archana).`}
          </p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Add New Seva
          </button>
        </div>
      ) : (
        /* Grid Cards View - Compact Size */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 320px))", gap: "16px" }}>
          {filteredServices.map((service) => (
            <div
              key={service.id}
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
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.name}
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
                        🪔
                      </div>
                    )}
                    <div>
                      <h3 style={{ fontSize: "0.98rem", fontWeight: "800", color: "#0f172a", marginBottom: "3px" }}>{service.name}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            padding: "1px 6px",
                            borderRadius: "5px",
                            fontSize: "0.68rem",
                            fontWeight: "800",
                            backgroundColor: service.category === 'arjita_seva' ? "#fef3c7" : "#e0f2fe",
                            color: service.category === 'arjita_seva' ? "#b45309" : "#0369a1",
                          }}
                        >
                          {service.category === 'arjita_seva' ? "🪷 Arjitha" : "🕉️ Ashrama"}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: "600" }}>
                          #{service.displayOrder}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${service.isActive ? "badge-success" : "badge-neutral"}`} style={{ fontSize: "0.68rem", padding: "2px 6px" }}>
                    {service.isActive ? "● Active" : "● Inactive"}
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
                  {service.description || "Sacred temple seva and puja ritual."}
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
                      Dakshina
                    </div>
                    <div style={{ fontSize: "1.05rem", fontWeight: "900", color: service.price > 0 ? "#b45309" : "#047857" }}>
                      {service.price > 0 ? `₹${service.price}` : "Free"}
                    </div>
                  </div>

                  <span className={`badge ${service.bookingEnabled ? "badge-info" : "badge-neutral"}`} style={{ fontSize: "0.68rem", padding: "2px 6px" }}>
                    {service.bookingEnabled ? "⚡ Online Booking" : "Offline"}
                  </span>
                </div>

                <div className="action-buttons" style={{ justifyContent: "flex-end", gap: "6px" }}>
                  <button className="btn-icon text-primary" onClick={() => handleOpenModal(service)} style={{ fontSize: "0.78rem" }}>
                    ✏️ Edit
                  </button>
                  <button className="btn-icon text-danger" onClick={() => setDeleteId(service.id!)} style={{ fontSize: "0.78rem" }}>
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
                  <label>Seva Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                  >
                    <option value="ashrama_seva">Ashrama Seva (Free)</option>
                    <option value="arjita_seva">Arjita Seva (Paid via Razorpay)</option>
                  </select>
                  <small style={{ color: "var(--color-text-muted)" }}>
                    Ashrama Sevas are completely free and bypass Razorpay. Arjita Sevas require payment.
                  </small>
                </div>

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
