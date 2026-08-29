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
      <div className="page-loading">
        <span className="spinner"></span>
        <p>Loading darshans...</p>
      </div>
    );
  }

  return (
    <div className="darshans-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Darshan Management</h1>
          <p>Manage darshan types and availability</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Add Darshan
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {error}
        </div>
      )}

      {darshans.length === 0 && !error ? (
        <div className="empty-state">
          <div className="empty-icon">🙏</div>
          <h3>No darshan types added yet</h3>
          <p>Create your first darshan offering.</p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ marginTop: '16px' }}>
            Add First Darshan
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Darshan Name</th>
                <th>Price</th>
                <th>Booking</th>
                <th>Status</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {darshans.map((darshan) => (
                <tr key={darshan.id}>
                  <td className="font-medium">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {darshan.imageUrl && <img src={darshan.imageUrl} alt={darshan.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                      {darshan.name}
                    </div>
                  </td>
                  <td>₹{darshan.price}</td>
                  <td>
                    <span className={`badge ${darshan.bookingEnabled ? 'badge-info' : 'badge-neutral'}`}>
                      {darshan.bookingEnabled ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${darshan.isActive ? 'badge-success' : 'badge-neutral'}`}>
                      {darshan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{darshan.displayOrder}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon text-primary" onClick={() => handleOpenModal(darshan)}>Edit</button>
                      <button className="btn-icon text-danger" onClick={() => setDeleteId(darshan.id!)}>Delete</button>
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
              <h2>{editingId ? "Edit Darshan" : "Add Darshan"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Darshan Name *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., VIP Darshan"
                  />
                </div>
                
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Details about the darshan..."
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
                    placeholder="https://example.com/darshan.jpg"
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
              <p>Are you sure you want to delete this darshan? This action cannot be undone.</p>
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
