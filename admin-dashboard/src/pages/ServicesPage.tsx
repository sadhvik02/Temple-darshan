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
      <div className="page-loading">
        <span className="spinner"></span>
        <p>Loading services...</p>
      </div>
    );
  }

  return (
    <div className="services-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Services & Sevas</h1>
          <p>Manage the temple services available for booking</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Add Service
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {error}
        </div>
      )}

      {services.length === 0 && !error ? (
        <div className="empty-state">
          <div className="empty-icon">🪔</div>
          <h3>No services added yet</h3>
          <p>Create your first service or seva offering.</p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ marginTop: '16px' }}>
            Add First Service
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Price</th>
                <th>Booking Enabled</th>
                <th>Status</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td className="font-medium">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {service.imageUrl && <img src={service.imageUrl} alt={service.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                      {service.name}
                    </div>
                  </td>
                  <td>₹{service.price}</td>
                  <td>
                    <span className={`badge ${service.bookingEnabled ? 'badge-info' : 'badge-neutral'}`}>
                      {service.bookingEnabled ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${service.isActive ? 'badge-success' : 'badge-neutral'}`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{service.displayOrder}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon text-primary" onClick={() => handleOpenModal(service)}>Edit</button>
                      <button className="btn-icon text-danger" onClick={() => setDeleteId(service.id!)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? "Edit Service" : "Add Service"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Service Name *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Suprabhata Seva"
                  />
                </div>
                
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Details about the seva..."
                    rows={3}
                    className="form-textarea"
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Display Order</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.displayOrder}
                      onChange={(e) => handleInputChange("displayOrder", parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Image URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                    placeholder="https://example.com/seva.jpg"
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group flex-checkbox">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange("isActive", e.target.checked)}
                      />
                      Active (Visible to users)
                    </label>
                  </div>
                  <div className="form-group flex-checkbox">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.bookingEnabled}
                        onChange={(e) => handleInputChange("bookingEnabled", e.target.checked)}
                      />
                      Enable Online Booking
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner spinner-sm" /> : "Save"}
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
              <p>Are you sure you want to delete this service? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
