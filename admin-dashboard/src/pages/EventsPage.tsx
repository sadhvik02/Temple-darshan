import { useState, useEffect, type FormEvent } from "react";
import { getEvents, createEvent, updateEvent, deleteEvent } from "../services/eventService";
import type { Event } from "../types";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
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
    description: "",
    imageUrl: "",
    eventDate: "",
    startTime: "09:00",
    endTime: "12:00",
    isPublished: true,
  });

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      console.error("Error loading events:", err);
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleOpenModal = (eventItem?: Event) => {
    if (eventItem) {
      setEditingId(eventItem.id!);
      setFormData({
        title: eventItem.title,
        description: eventItem.description,
        imageUrl: eventItem.imageUrl || "",
        eventDate: eventItem.eventDate,
        startTime: eventItem.startTime,
        endTime: eventItem.endTime,
        isPublished: eventItem.isPublished,
      });
    } else {
      setEditingId(null);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split("T")[0];

      setFormData({
        title: "",
        description: "",
        imageUrl: "",
        eventDate: dateString,
        startTime: "09:00",
        endTime: "12:00",
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
        await updateEvent(editingId, formData);
      } else {
        await createEvent(formData);
      }
      await loadEvents();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving event:", err);
      alert("Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteEvent(deleteId);
      await loadEvents();
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Failed to delete event.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="empty-state">
        <span className="spinner"></span>
        <p style={{ marginTop: "12px" }}>Loading temple festivals...</p>
      </div>
    );
  }

  const publishedCount = events.filter((e) => e.isPublished).length;

  return (
    <div className="events-page" style={{ width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}>
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
          <h1 style={{ fontSize: "1.55rem", fontWeight: "800", color: "#0f172a" }}>Temple Festivals & Utsavams</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
            Schedule auspicious temple utsavams, brahmotsavams, and special annual pooja events.
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
            + Add New Festival
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
          <span style={{ fontSize: "1.4rem" }}>🎉</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#0f172a" }}>{events.length}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Total Festivals</div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span style={{ fontSize: "1.4rem" }}>🟢</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#047857" }}>{publishedCount}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Published on Mobile</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {events.length === 0 && !error ? (
        <div className="card-section empty-state">
          <div className="empty-icon">🎉</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
            No festivals scheduled yet
          </h3>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "18px" }}>
            Create your first temple festival or utsavams (e.g. Sri Rama Navami, Brahmotsavam, Diwali Pooja).
          </p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Schedule First Festival
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Cards View */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {events.map((eventItem) => (
            <div
              key={eventItem.id}
              className="form-card"
              style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
            >
              <div>
                {eventItem.imageUrl ? (
                  <div
                    style={{
                      height: "150px",
                      backgroundImage: `url(${eventItem.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      position: "relative",
                    }}
                  >
                    <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                      <span className={`badge ${eventItem.isPublished ? "badge-success" : "badge-neutral"}`}>
                        {eventItem.isPublished ? "● Published" : "● Draft"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "16px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "1.4rem" }}>🎉</span>
                    <span className={`badge ${eventItem.isPublished ? "badge-success" : "badge-neutral"}`}>
                      {eventItem.isPublished ? "● Published" : "● Draft"}
                    </span>
                  </div>
                )}

                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        color: "#92400e",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "0.78rem",
                        fontWeight: "800",
                      }}
                    >
                      🗓️ {eventItem.eventDate}
                    </span>

                    {eventItem.startTime && (
                      <span
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #e2e8f0",
                          color: "#475569",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: "700",
                        }}
                      >
                        ⏰ {eventItem.startTime} – {eventItem.endTime}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
                    {eventItem.title}
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
                    {eventItem.description || "Auspicious temple celebration and rituals."}
                  </p>
                </div>
              </div>

              <div
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid var(--color-border)",
                  background: "#f8fafc",
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <div className="action-buttons">
                  <button className="btn-icon text-primary" onClick={() => handleOpenModal(eventItem)}>
                    ✏️ Edit
                  </button>
                  <button className="btn-icon text-danger" onClick={() => setDeleteId(eventItem.id!)}>
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
                  <th>Festival Name</th>
                  <th>Date</th>
                  <th>Timing</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((eventItem) => (
                  <tr key={eventItem.id}>
                    <td>
                      {eventItem.imageUrl ? (
                        <img src={eventItem.imageUrl} alt={eventItem.title} className="table-img-preview" />
                      ) : (
                        <div className="table-img-placeholder">🎉 Utsavam</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: "800", color: "#0f172a" }}>{eventItem.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {eventItem.description?.substring(0, 45)}...
                      </div>
                    </td>
                    <td>
                      <span className="ref-code">{eventItem.eventDate}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: "600", fontSize: "0.85rem" }}>
                        {eventItem.startTime} – {eventItem.endTime}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${eventItem.isPublished ? "badge-success" : "badge-neutral"}`}>
                        {eventItem.isPublished ? "● Published" : "● Draft"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                        <button className="btn-icon text-primary" onClick={() => handleOpenModal(eventItem)}>
                          Edit
                        </button>
                        <button className="btn-icon text-danger" onClick={() => setDeleteId(eventItem.id!)}>
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
              <h2>{editingId ? "Edit Festival Event" : "Schedule Festival Event"}</h2>
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
                  <label>Festival / Utsavam Name *</label>
                  <input
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Annual Brahmotsavam Day 1"
                  />
                </div>

                <div className="form-group">
                  <label>Description & Ritual Schedule *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe the processions, special poojas, and timings..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Festival Date *</label>
                  <input
                    required
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => handleInputChange("eventDate", e.target.value)}
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Start Time *</label>
                    <input
                      required
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange("startTime", e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>End Time *</label>
                    <input
                      required
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange("endTime", e.target.value)}
                    />
                  </div>
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
                    <span>Publish live on devotee mobile events calendar</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner spinner-sm" /> : "Save Festival Event"}
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
                Are you sure you want to delete this festival event?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
