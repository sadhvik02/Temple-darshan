import { useState, useEffect, type FormEvent } from "react";
import { getNews, createNews, updateNews, deleteNews } from "../services/newsService";
import type { News } from "../types";

export default function NewsPage() {
  const [newsList, setNewsList] = useState<News[]>([]);
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
    content: "",
    imageUrl: "",
    isPublished: false,
  });

  const loadNews = async () => {
    setLoading(true);
    try {
      const data = await getNews();
      setNewsList(data);
    } catch (err) {
      console.error("Error loading news:", err);
      setError("Failed to load news articles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const handleOpenModal = (newsItem?: News) => {
    if (newsItem) {
      setEditingId(newsItem.id!);
      setFormData({
        title: newsItem.title,
        content: newsItem.content,
        imageUrl: newsItem.imageUrl || "",
        isPublished: newsItem.isPublished,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        content: "",
        imageUrl: "",
        isPublished: false,
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
        await updateNews(editingId, formData);
      } else {
        await createNews(formData);
      }
      await loadNews();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving news:", err);
      alert("Failed to save news article.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteNews(deleteId);
      await loadNews();
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting news:", err);
      alert("Failed to delete news article.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading && newsList.length === 0) {
    return (
      <div className="page-loading">
        <span className="spinner"></span>
        <p>Loading news...</p>
      </div>
    );
  }

  return (
    <div className="news-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>News Management</h1>
          <p>Publish temple announcements and articles</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Add News
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {error}
        </div>
      )}

      {newsList.length === 0 && !error ? (
        <div className="empty-state">
          <div className="empty-icon">📰</div>
          <h3>No news published</h3>
          <p>Create your first announcement or article.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => handleOpenModal()} 
            style={{ marginTop: '16px' }}
          >
            Add First News
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Image</th>
                <th>Title</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {newsList.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="table-img-preview" />
                    ) : (
                      <div className="table-img-placeholder">No Img</div>
                    )}
                  </td>
                  <td className="font-medium">{item.title}</td>
                  <td>
                    {item.createdAt?.toDate 
                      ? item.createdAt.toDate().toLocaleDateString() 
                      : 'Unknown'}
                  </td>
                  <td>
                    <span className={`badge ${item.isPublished ? 'badge-success' : 'badge-neutral'}`}>
                      {item.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon text-primary" onClick={() => handleOpenModal(item)}>Edit</button>
                      <button className="btn-icon text-danger" onClick={() => setDeleteId(item.id!)}>Delete</button>
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
              <h2>{editingId ? "Edit News" : "Add News"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Headline Title *</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="E.g., Special Pooja for Diwali"
                  />
                </div>
                
                <div className="form-group">
                  <label>Article Content *</label>
                  <textarea
                    required
                    rows={6}
                    value={formData.content}
                    onChange={(e) => handleInputChange("content", e.target.value)}
                    placeholder="Enter the full article text here..."
                    style={{ width: '100%', padding: '12px', borderRadius: '4px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', resize: 'vertical' }}
                  />
                </div>

                <div className="form-group">
                  <label>Image URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  <span className="form-help">Link to an externally hosted image</span>
                </div>

                <div className="form-group flex-checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => handleInputChange("isPublished", e.target.checked)}
                    />
                    Publish publicly
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
              <p>Are you sure you want to delete this article? This action cannot be undone.</p>
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
