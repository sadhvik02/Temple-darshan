import { useState, useEffect, type FormEvent } from "react";
import { getSlots, createSlot, updateSlot, deleteSlot } from "../services/slotService";
import { getServices } from "../services/serviceService";
import type { Slot, Service } from "../types";

interface TimingPreset {
  label: string;
  startTime: string;
  endTime: string;
  session: 'morning' | 'evening';
}

const STANDARD_TIMINGS: TimingPreset[] = [
  { label: '06:00 AM - 07:00 AM', startTime: '06:00', endTime: '07:00', session: 'morning' },
  { label: '07:00 AM - 08:00 AM', startTime: '07:00', endTime: '08:00', session: 'morning' },
  { label: '08:00 AM - 09:00 AM', startTime: '08:00', endTime: '09:00', session: 'morning' },
  { label: '10:00 AM - 11:00 AM', startTime: '10:00', endTime: '11:00', session: 'morning' },
  { label: '07:00 PM - 08:00 PM', startTime: '19:00', endTime: '20:00', session: 'evening' },
  { label: '08:00 PM - 09:00 PM', startTime: '20:00', endTime: '21:00', session: 'evening' },
];

export default function SlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter tab: 'all' | 'morning' | 'evening'
  const [filterSession, setFilterSession] = useState<'all' | 'morning' | 'evening'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Bulk Create Modal states
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkData, setBulkData] = useState({
    serviceId: "",
    date: "",
    capacity: 50,
    selectedTimings: STANDARD_TIMINGS.map((t) => `${t.startTime}-${t.endTime}`),
  });
  const [bulkSaving, setBulkSaving] = useState(false);

  // Delete states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    serviceId: "",
    date: "",
    startTime: "",
    endTime: "",
    capacity: 50,
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

  const isMorningSlot = (startTime: string) => {
    const hour = parseInt(startTime.split(':')[0], 10);
    return !isNaN(hour) && hour < 14;
  };

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
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];
      
      setFormData({
        serviceId: services.length > 0 ? services[0].id! : "",
        date: dateString,
        startTime: "06:00",
        endTime: "07:00",
        capacity: 50,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenBulkModal = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    setBulkData({
      serviceId: services.length > 0 ? services[0].id! : "",
      date: dateString,
      capacity: 50,
      selectedTimings: STANDARD_TIMINGS.map((t) => `${t.startTime}-${t.endTime}`),
    });
    setIsBulkModalOpen(true);
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

  const handleBulkSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!bulkData.serviceId) {
      alert("Please select a service");
      return;
    }
    if (bulkData.selectedTimings.length === 0) {
      alert("Please select at least one timing slot");
      return;
    }

    setBulkSaving(true);
    try {
      const promises = bulkData.selectedTimings.map((timingKey) => {
        const [startTime, endTime] = timingKey.split('-');
        return createSlot({
          serviceId: bulkData.serviceId,
          date: bulkData.date,
          startTime,
          endTime,
          capacity: bulkData.capacity,
          isActive: true,
        });
      });

      await Promise.all(promises);
      await loadData();
      setIsBulkModalOpen(false);
    } catch (err) {
      console.error("Error creating bulk slots:", err);
      alert("Failed to create all slots. Please check logs.");
    } finally {
      setBulkSaving(false);
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

  const getServiceName = (id: string) => {
    return services.find(s => s.id === id)?.name || "Unknown Service";
  };

  const filteredSlots = slots.filter((slot) => {
    if (filterSession === 'morning') return isMorningSlot(slot.startTime);
    if (filterSession === 'evening') return !isMorningSlot(slot.startTime);
    return true;
  });

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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Slots Management</h1>
          <p>Manage morning & evening darshan availability timings and capacity</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleOpenBulkModal} disabled={services.length === 0}>
            ⚡ Auto Generate All Daily Slots
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()} disabled={services.length === 0}>
            + Add Single Slot
          </button>
        </div>
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

      {/* Session Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
        <button
          className={`btn btn-sm ${filterSession === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterSession('all')}
        >
          All Slots ({slots.length})
        </button>
        <button
          className={`btn btn-sm ${filterSession === 'morning' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterSession('morning')}
        >
          🌅 Morning Slots ({slots.filter(s => isMorningSlot(s.startTime)).length})
        </button>
        <button
          className={`btn btn-sm ${filterSession === 'evening' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterSession('evening')}
        >
          🌙 Evening Slots ({slots.filter(s => !isMorningSlot(s.startTime)).length})
        </button>
      </div>

      {filteredSlots.length === 0 && !error ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No {filterSession !== 'all' ? filterSession : ''} slots found</h3>
          <p>Create daily morning and evening darshan slots for pilgrims.</p>
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleOpenBulkModal}
              disabled={services.length === 0}
            >
              Auto Generate Daily Slots
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleOpenModal()} 
              disabled={services.length === 0}
            >
              + Add Slot
            </button>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Date</th>
                <th>Session</th>
                <th>Time Range</th>
                <th>Capacity</th>
                <th>Booked</th>
                <th>Status</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSlots.map((slot) => {
                const isFull = slot.bookedCount >= slot.capacity;
                const isMorn = isMorningSlot(slot.startTime);
                return (
                  <tr key={slot.id}>
                    <td className="font-medium">{getServiceName(slot.serviceId)}</td>
                    <td>{slot.date}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: isMorn ? 'rgba(255, 160, 0, 0.15)' : 'rgba(216, 67, 21, 0.15)',
                          color: isMorn ? '#E65100' : '#D84315',
                        }}
                      >
                        {isMorn ? '🌅 Morning' : '🌙 Evening'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{slot.startTime} - {slot.endTime}</td>
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

      {/* Add/Edit Single Slot Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? "Edit Slot" : "Add Darshan Slot"}</h2>
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

                {/* Standard Timing Presets */}
                <div className="form-group">
                  <label style={{ marginBottom: '8px', display: 'block' }}>Quick Standard Temple Timings Preset:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                    {STANDARD_TIMINGS.map((preset) => {
                      const isSelected = formData.startTime === preset.startTime && formData.endTime === preset.endTime;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              startTime: preset.startTime,
                              endTime: preset.endTime,
                            }));
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: isSelected ? 700 : 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                            color: isSelected ? '#fff' : 'var(--color-text)',
                            border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          }}
                        >
                          {preset.session === 'morning' ? '🌅' : '🌙'} {preset.label}
                        </button>
                      );
                    })}
                  </div>
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
                    <label>Total Capacity (Devotees) *</label>
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
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner spinner-sm" /> : "Save Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto Generate Daily Slots Modal */}
      {isBulkModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h2>⚡ Auto Generate Daily Darshan Slots</h2>
              <button className="modal-close" onClick={() => setIsBulkModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleBulkSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                  Quickly generate all standard Morning and Evening Temple Darshan time slots in 1-click matching the mobile application schedule.
                </p>

                <div className="form-group">
                  <label>Select Service / Seva *</label>
                  <select 
                    required 
                    value={bulkData.serviceId}
                    onChange={(e) => setBulkData((prev) => ({ ...prev, serviceId: e.target.value }))}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  >
                    <option value="" disabled>Select a Service</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Darshan Date *</label>
                    <input
                      required
                      type="date"
                      value={bulkData.date}
                      onChange={(e) => setBulkData((prev) => ({ ...prev, date: e.target.value }))}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Capacity Per Slot *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={bulkData.capacity}
                      onChange={(e) => setBulkData((prev) => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ marginBottom: '10px', display: 'block', fontWeight: 700 }}>
                    Select Slots to Generate:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {STANDARD_TIMINGS.map((timing) => {
                      const key = `${timing.startTime}-${timing.endTime}`;
                      const isChecked = bulkData.selectedTimings.includes(key);

                      return (
                        <label
                          key={key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: isChecked ? 'rgba(216, 67, 21, 0.08)' : 'var(--color-surface)',
                            border: `1px solid ${isChecked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBulkData((prev) => ({
                                  ...prev,
                                  selectedTimings: [...prev.selectedTimings, key],
                                }));
                              } else {
                                setBulkData((prev) => ({
                                  ...prev,
                                  selectedTimings: prev.selectedTimings.filter((t) => t !== key),
                                }));
                              }
                            }}
                          />
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>
                            {timing.session === 'morning' ? '🌅 Morning:' : '🌙 Evening:'} {timing.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsBulkModalOpen(false)} disabled={bulkSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={bulkSaving}>
                  {bulkSaving ? <span className="spinner spinner-sm" /> : `Create ${bulkData.selectedTimings.length} Slots`}
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
