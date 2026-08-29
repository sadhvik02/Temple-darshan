import { useState, useEffect, type FormEvent } from "react";
import { getEvents, createEvent, updateEvent, deleteEvent } from "../services/eventService";
import type { Event } from "../types";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
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
    description: "",
    imageUrl: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    isPublished: false,
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
      // Default to tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];

      setFormData({
        title: "",
        description: "",
        imageUrl: "",
        eventDate: dateString,
        startTime: "09:00",
        endTime: "12:00",
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
      <div className="page-loading">
        <span className="spinner"></span>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className="events-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Events Management</h1>
          <p>Schedule and publish temple events</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Add Event
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {error}
        </div>
      )}

      {events.length === 0 && !error ? (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h3>No events scheduled</h3>
          <p>Create your first upcoming temple event.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => handleOpenModal()} 
            style={{ marginTop: '16px' }}
          >
            Add First Event
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Image</th>
                <th>Event Title</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="table-img-preview" />
                    ) : (
                      <div className="table-img-placeholder">No Img</div>
                    )}
                  </td>
                  <td className="font-medium">{item.title}</td>
                  <td>{item.eventDate}</td>
                  <td>{item.startTime} - {item.endTime}</td>
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
              <h2>{editingId ? "Edit Event" : "Add Event"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Event Title *</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="E.g., Annual Maha Shivaratri"
                  />
                </div>
                
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Event details..."
                    style={{ width: '100%', padding: '12px', borderRadius: '4px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', resize: 'vertical' }}
                  />
                </div>

                <div className="form-group">
                  <label>Date (YYYY-MM-DD) *</label>
                  <input
                    required
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => handleInputChange("eventDate", e.target.value)}
                    style={{ colorScheme: 'dark' }}
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
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time *</label>
                    <input
                      required
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange("endTime", e.target.value)}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Image URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                    placeholder="https://example.com/event.jpg"
                  />
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
              <p>Are you sure you want to delete this event? This action cannot be undone.</p>
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
