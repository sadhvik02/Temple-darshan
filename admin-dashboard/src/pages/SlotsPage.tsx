import { useState, useEffect, type FormEvent } from "react";
import { getSlots, createSlot, updateSlot, deleteSlot } from "../services/slotService";
import { getServices } from "../services/serviceService";
import type { Slot, Service } from "../types";

export default function SlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
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
    serviceId: "",
    date: "",
    startTime: "",
    endTime: "",
    capacity: 10,
    isActive: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedSlots, fetchedServices] = await Promise.all([
        getSlots(),
        getServices()
      ]);
      setSlots(fetchedSlots);
      setServices(fetchedServices);
    } catch (err) {
      console.error("Error loading slots data:", err);
      setError("Failed to load slots data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (slot?: Slot) => {
    if (slot) {
      setEditingId(slot.id!);
      setFormData({
        serviceId: slot.serviceId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        isActive: slot.isActive,
      });
    } else {
      setEditingId(null);
      // Default to tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];
      
      setFormData({
        serviceId: services.length > 0 ? services[0].id! : "",
        date: dateString,
        startTime: "09:00",
        endTime: "10:00",
        capacity: 10,
        isActive: true,
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
    if (!formData.serviceId) {
      alert("Please select a service");
      return;
    }
    
    setSaving(true);
    try {
      if (editingId) {
        await updateSlot(editingId, formData);
      } else {
        await createSlot(formData);
      }
      await loadData();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving slot:", err);
      alert("Failed to save slot. Please check permissions and input.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteSlot(deleteId);
      await loadData();
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting slot:", err);
      alert("Failed to delete slot.");
    } finally {
      setDeleting(false);
    }
  };

  // Helper to get service name
  const getServiceName = (id: string) => {
    return services.find(s => s.id === id)?.name || "Unknown Service";
  };

  if (loading && slots.length === 0) {
    return (
      <div className="page-loading">
        <span className="spinner"></span>
        <p>Loading slots...</p>
      </div>
    );
  }

  return (
    <div className="slots-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Slots Management</h1>
          <p>Manage availability timings and capacity for services</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()} disabled={services.length === 0}>
          + Add Slot
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {error}
        </div>
      )}

      {services.length === 0 && !loading && (
        <div className="alert alert-error" style={{ marginBottom: '20px' }}>
          <span className="alert-icon">⚠</span>
          You must create at least one Service before you can add Slots.
        </div>
      )}

      {slots.length === 0 && !error ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No slots added yet</h3>
          <p>Create your first time slot for a service.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => handleOpenModal()} 
            style={{ marginTop: '16px' }}
            disabled={services.length === 0}
          >
            Add First Slot
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Date</th>
                <th>Time</th>
                <th>Capacity</th>
                <th>Booked</th>
                <th>Status</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => {
                const isFull = slot.bookedCount >= slot.capacity;
                return (
                  <tr key={slot.id}>
                    <td className="font-medium">{getServiceName(slot.serviceId)}</td>
                    <td>{slot.date}</td>
                    <td>{slot.startTime} - {slot.endTime}</td>
                    <td>{slot.capacity}</td>
                    <td>{slot.bookedCount}</td>
                    <td>
                      <span className={`badge ${slot.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        {slot.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${isFull ? 'badge-error' : 'badge-info'}`}>
                        {isFull ? 'Full' : `${slot.capacity - slot.bookedCount} left`}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon text-primary" onClick={() => handleOpenModal(slot)}>Edit</button>
                        <button className="btn-icon text-danger" onClick={() => setDeleteId(slot.id!)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? "Edit Slot" : "Add Slot"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Service *</label>
                  <select 
                    required 
                    value={formData.serviceId}
                    onChange={(e) => handleInputChange("serviceId", e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  >
                    <option value="" disabled>Select a Service</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Date (YYYY-MM-DD) *</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
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

                <div className="form-grid">
                  <div className="form-group">
                    <label>Total Capacity *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => handleInputChange("capacity", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="form-group flex-checkbox">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange("isActive", e.target.checked)}
                      />
                      Active Slot
                    </label>
                  </div>
                </div>
                
                {editingId && (
                  <div className="form-help" style={{ marginTop: '10px' }}>
                    Note: The booked count is managed automatically by the booking system and cannot be manually edited here.
                  </div>
                )}
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
              <p>Are you sure you want to delete this slot? This will orphan any bookings associated with it.</p>
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
