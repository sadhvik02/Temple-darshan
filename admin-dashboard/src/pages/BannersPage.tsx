import { useState, useEffect, type FormEvent } from "react";
import { getBanners, createBanner, updateBanner, deleteBanner } from "../services/bannerService";
import type { Banner } from "../types";

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
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
      <div className="page-loading">
        <span className="spinner"></span>
        <p>Loading banners...</p>
      </div>
    );
  }

  return (
    <div className="banners-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Banners</h1>
          <p>Manage homepage promotional banners</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Add Banner
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {error}
        </div>
      )}

      {banners.length === 0 && !error ? (
        <div className="empty-state">
          <div className="empty-icon">🖼</div>
          <h3>No banners added yet</h3>
          <p>Create your first banner to display on the app homepage.</p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ marginTop: '16px' }}>
            Add First Banner
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>Title</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner.id}>
                  <td>
                    {banner.imageUrl ? (
                      <img src={banner.imageUrl} alt={banner.title} className="table-img-preview" />
                    ) : (
                      <div className="table-img-placeholder">No Img</div>
                    )}
                  </td>
                  <td className="font-medium">{banner.title}</td>
                  <td>{banner.displayOrder}</td>
                  <td>
                    <span className={`badge ${banner.isActive ? 'badge-success' : 'badge-neutral'}`}>
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon text-primary" onClick={() => handleOpenModal(banner)}>Edit</button>
                      <button className="btn-icon text-danger" onClick={() => setDeleteId(banner.id!)}>Delete</button>
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
              <h2>{editingId ? "Edit Banner" : "Add Banner"}</h2>
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
                    placeholder="e.g., Special Darshan Updates"
                  />
                </div>
                
                <div className="form-group">
                  <label>Image URL *</label>
                  <input
                    required
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                  />
                  <small className="form-help">Provide a direct link to the image (Storage is currently disabled on Spark plan).</small>
                </div>

                <div className="form-group">
                  <label>Action URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.actionUrl}
                    onChange={(e) => handleInputChange("actionUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="form-grid">
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
                  <div className="form-group flex-checkbox">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange("isActive", e.target.checked)}
                      />
                      Active Banner
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
              <p>Are you sure you want to delete this banner? This action cannot be undone.</p>
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
