import { useState, useEffect, type FormEvent } from "react";
import { getDonationTypes, createDonationType, updateDonationType, deleteDonationType } from "../services/donationTypeService";
import type { DonationType } from "../types";

const CATEGORY_OPTIONS = ["general", "festival", "renovation", "education", "annadanam", "other"];

export default function DonationsPage() {
  const [donationTypes, setDonationTypes] = useState<DonationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    category: "general",
    suggestedAmounts: "101, 501, 1001, 5001",
    isActive: true,
    displayOrder: 1,
  });

  const loadDonationTypes = async () => {
    setLoading(true);
    try {
      const data = await getDonationTypes();
      setDonationTypes(data);
    } catch (err) {
      console.error("Error loading donation types:", err);
      setError("Failed to load donation types.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonationTypes();
  }, []);

  const handleOpenModal = (dt?: DonationType) => {
    if (dt) {
      setEditingId(dt.id!);
      setFormData({
        title: dt.title,
        description: dt.description,
        imageUrl: dt.imageUrl || "",
        category: dt.category,
        suggestedAmounts: dt.suggestedAmounts.join(", "),
        isActive: dt.isActive,
        displayOrder: dt.displayOrder,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        description: "",
        imageUrl: "",
        category: "general",
        suggestedAmounts: "101, 501, 1001, 5001",
        isActive: true,
        displayOrder: donationTypes.length > 0 ? donationTypes[donationTypes.length - 1].displayOrder + 1 : 1,
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

  const parseSuggestedAmounts = (str: string): number[] => {
    return str
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const amounts = parseSuggestedAmounts(formData.suggestedAmounts);
      if (amounts.length === 0) {
        alert("Please enter at least one valid suggested amount.");
        setSaving(false);
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl || undefined,
        category: formData.category,
        suggestedAmounts: amounts,
        isActive: formData.isActive,
        displayOrder: formData.displayOrder,
      };

      if (editingId) {
        await updateDonationType(editingId, payload);
      } else {
        await createDonationType(payload as any);
      }
      await loadDonationTypes();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving donation type:", err);
      alert("Failed to save donation type.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteDonationType(deleteId);
      await loadDonationTypes();
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting donation type:", err);
      alert("Failed to delete donation type.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading && donationTypes.length === 0) {
    return (
      <div className="page-loading">
        <span className="spinner"></span>
        <p>Loading donation types...</p>
      </div>
    );
  }

  return (
    <div className="donations-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Donation Management</h1>
          <p>Manage donation categories and suggested amounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Add Donation Type
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {error}
        </div>
      )}

      {donationTypes.length === 0 && !error ? (
        <div className="empty-state">
          <div className="empty-icon">🙏</div>
          <h3>No donation types added yet</h3>
          <p>Create your first donation category.</p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ marginTop: '16px' }}>
            Add First Donation Type
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Suggested Amounts</th>
                <th>Status</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {donationTypes.map((dt) => (
                <tr key={dt.id}>
                  <td className="font-medium">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {dt.imageUrl && <img src={dt.imageUrl} alt={dt.title} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />}
                      {dt.title}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">{dt.category}</span>
                  </td>
                  <td>₹{dt.suggestedAmounts.join(", ₹")}</td>
                  <td>
                    <span className={`badge ${dt.isActive ? 'badge-success' : 'badge-neutral'}`}>
                      {dt.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{dt.displayOrder}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon text-primary" onClick={() => handleOpenModal(dt)}>Edit</button>
                      <button className="btn-icon text-danger" onClick={() => setDeleteId(dt.id!)}>Delete</button>
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
              <h2>{editingId ? "Edit Donation Type" : "Add Donation Type"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Temple Renovation Fund"
                  />
                </div>
                
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Purpose of this donation..."
                    rows={3}
                    className="form-textarea"
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
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
                  <label>Suggested Amounts (comma-separated) *</label>
                  <input
                    required
                    value={formData.suggestedAmounts}
                    onChange={(e) => handleInputChange("suggestedAmounts", e.target.value)}
                    placeholder="e.g., 101, 501, 1001, 5001"
                  />
                </div>

                <div className="form-group">
                  <label>Image URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                    placeholder="https://example.com/donation.jpg"
                  />
                </div>

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
              <p>Are you sure you want to delete this donation type? This action cannot be undone.</p>
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
