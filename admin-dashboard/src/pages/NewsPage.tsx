import { useState, useEffect, type FormEvent } from "react";
import { getNews, createNews, updateNews, deleteNews } from "../services/newsService";
import type { News } from "../types";

export default function NewsPage() {
  const [newsList, setNewsList] = useState<News[]>([]);
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
    content: "",
    imageUrl: "",
    isPublished: true,
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
        isPublished: true,
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
      <div className="empty-state">
        <span className="spinner"></span>
        <p style={{ marginTop: "12px" }}>Loading announcements...</p>
      </div>
    );
  }

  const publishedCount = newsList.filter((n) => n.isPublished).length;
  const draftCount = newsList.filter((n) => !n.isPublished).length;

  return (
    <div className="news-page" style={{ width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "22px",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.55rem", fontWeight: "800", color: "#0f172a" }}>Temple News & Announcements</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
            Publish live temple circulars, emergency announcements, and sliding home screen bulletins.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
            + Post Announcement
          </button>
        </div>
      </div>

      {/* Metric Chips */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))",
          gap: "14px",
          marginBottom: "22px",
        }}
      >
        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span style={{ fontSize: "1.4rem" }}>📢</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#0f172a" }}>{newsList.length}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Total Bulletins</div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span style={{ fontSize: "1.4rem" }}>🟢</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#047857" }}>{publishedCount}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Live on Mobile App</div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span style={{ fontSize: "1.4rem" }}>📝</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#b45309" }}>{draftCount}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Unpublished Drafts</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {newsList.length === 0 && !error ? (
        <div className="card-section empty-state">
          <div className="empty-icon">📢</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
            No announcements published yet
          </h3>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "18px" }}>
            Post official temple news, pooja schedule changes, or festival updates.
          </p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Post First Announcement
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Cards View */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {newsList.map((item) => (
            <div
              key={item.id}
              className="form-card"
              style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
            >
              <div>
                {item.imageUrl ? (
                  <div
                    style={{
                      height: "150px",
                      backgroundImage: `url(${item.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                      }}
                    >
                      <span className={`badge ${item.isPublished ? "badge-success" : "badge-neutral"}`}>
                        {item.isPublished ? "● Live Published" : "● Draft"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "16px 20px 0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "1.4rem" }}>📢</span>
                    <span className={`badge ${item.isPublished ? "badge-success" : "badge-neutral"}`}>
                      {item.isPublished ? "● Live Published" : "● Draft"}
                    </span>
                  </div>
                )}

                <div style={{ padding: "16px 20px" }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.86rem",
                      color: "var(--color-text-secondary)",
                      lineHeight: "1.5",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.content}
                  </p>
                </div>
              </div>

              <div
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid var(--color-border)",
                  background: "#f8fafc",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontWeight: "600" }}>
                  {item.publishedAt?.toDate ? item.publishedAt.toDate().toLocaleDateString() : "Active Bulletin"}
                </span>

                <div className="action-buttons">
                  <button className="btn-icon text-primary" onClick={() => handleOpenModal(item)}>
                    ✏️ Edit
                  </button>
                  <button className="btn-icon text-danger" onClick={() => setDeleteId(item.id!)}>
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
                  <th>Thumbnail</th>
                  <th>Headline Title</th>
                  <th>Content Preview</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {newsList.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="table-img-preview" />
                      ) : (
                        <div className="table-img-placeholder">📢 News</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: "800", color: "#0f172a" }}>{item.title}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.84rem", color: "var(--color-text-secondary)", maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.content}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${item.isPublished ? "badge-success" : "badge-neutral"}`}>
                        {item.isPublished ? "● Published" : "● Draft"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                        <button className="btn-icon text-primary" onClick={() => handleOpenModal(item)}>
                          Edit
                        </button>
                        <button className="btn-icon text-danger" onClick={() => setDeleteId(item.id!)}>
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
              <h2>{editingId ? "Edit Announcement" : "Post New Announcement"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
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
                  <label>Announcement Headline *</label>
                  <input
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Special Mahotsavam on Pournami"
                  />
                </div>

                <div className="form-group">
                  <label>Full Content & Devotee Notice *</label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => handleInputChange("content", e.target.value)}
                    placeholder="Provide complete circular details, guidelines, or timings..."
                    rows={4}
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

                <div className="form-group flex-checkbox" style={{ marginTop: "10px" }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => handleInputChange("isPublished", e.target.checked)}
                    />
                    <span>Publish live immediately to devotee mobile app</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner spinner-sm" /> : "Save & Publish"}
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
                Are you sure you want to delete this announcement? It will be removed from devotee feeds.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Bulletin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
