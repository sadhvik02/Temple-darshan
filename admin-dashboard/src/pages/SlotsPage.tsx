import { useState, useEffect, type FormEvent } from "react";
import { getSlots, createSlot, updateSlot, deleteSlot } from "../services/slotService";
import { getServices } from "../services/serviceService";
import type { Slot, Service } from "../types";

interface TimingPreset {
  label: string;
  startTime: string;
  endTime: string;
  session: "morning" | "evening";
}

const STANDARD_TIMINGS: TimingPreset[] = [
  { label: "06:00 AM - 07:00 AM", startTime: "06:00", endTime: "07:00", session: "morning" },
  { label: "07:00 AM - 08:00 AM", startTime: "07:00", endTime: "08:00", session: "morning" },
  { label: "08:00 AM - 09:00 AM", startTime: "08:00", endTime: "09:00", session: "morning" },
  { label: "10:00 AM - 11:00 AM", startTime: "10:00", endTime: "11:00", session: "morning" },
  { label: "07:00 PM - 08:00 PM", startTime: "19:00", endTime: "20:00", session: "evening" },
  { label: "08:00 PM - 09:00 PM", startTime: "20:00", endTime: "21:00", session: "evening" },
];

export default function SlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterSession, setFilterSession] = useState<"all" | "morning" | "evening">("all");
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

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
      const [fetchedSlots, fetchedServices] = await Promise.all([getSlots(), getServices()]);
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
    const hour = parseInt(startTime.split(":")[0], 10);
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
      const dateString = tomorrow.toISOString().split("T")[0];

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
    const dateString = tomorrow.toISOString().split("T")[0];

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
        const [startTime, endTime] = timingKey.split("-");
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
    return services.find((s) => s.id === id)?.name || "Temple Offering";
  };

  // Filter slots
  const filteredSlots = slots.filter((slot) => {
    if (filterSession === "morning" && !isMorningSlot(slot.startTime)) return false;
    if (filterSession === "evening" && isMorningSlot(slot.startTime)) return false;
    if (selectedServiceFilter !== "all" && slot.serviceId !== selectedServiceFilter) return false;
    if (dateFilter && slot.date !== dateFilter) return false;
    return true;
  });

  const totalCapacity = slots.reduce((sum, s) => sum + (s.capacity || 0), 0);
  const totalBooked = slots.reduce((sum, s) => sum + (s.bookedCount || 0), 0);
  const totalAvailable = Math.max(0, totalCapacity - totalBooked);

  if (loading && slots.length === 0) {
    return (
      <div className="empty-state">
        <span className="spinner"></span>
        <p style={{ marginTop: "12px" }}>Loading darshan schedule & slots...</p>
      </div>
    );
  }

  return (
    <div className="slots-page" style={{ width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}>
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
          <h1 style={{ fontSize: "1.55rem", fontWeight: "800", color: "#0f172a" }}>Darshan & Seva Slots</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
            Configure daily morning & evening timing intervals, pilgrim quotas, and live slot capacity.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn btn-secondary" onClick={handleOpenBulkModal} disabled={services.length === 0}>
            ⚡ Auto-Generate Daily Slots
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()} disabled={services.length === 0}>
            + Add Single Slot
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))",
          gap: "14px",
          marginBottom: "22px",
        }}
      >
        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span style={{ fontSize: "1.4rem" }}>📅</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#0f172a" }}>{slots.length}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Total Active Slots</div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "16px 20px" }}>
          <span style={{ fontSize: "1.5rem" }}>👥</span>
          <div>
            <div style={{ fontSize: "1.35rem", fontWeight: "900", color: "#2563eb" }}>{totalCapacity}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Total Pilgrim Capacity</div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "16px 20px" }}>
          <span style={{ fontSize: "1.5rem" }}>🎟️</span>
          <div>
            <div style={{ fontSize: "1.35rem", fontWeight: "900", color: "#d97706" }}>{totalBooked}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Booked Slots</div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "16px 20px" }}>
          <span style={{ fontSize: "1.5rem" }}>✨</span>
          <div>
            <div style={{ fontSize: "1.35rem", fontWeight: "900", color: "#059669" }}>{totalAvailable}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Available Quota</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div
        className="form-card"
        style={{
          padding: "14px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        {/* Session Tabs */}
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => setFilterSession("all")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "none",
              background: filterSession === "all" ? "var(--color-primary-bg)" : "#f1f5f9",
              color: filterSession === "all" ? "var(--color-primary)" : "var(--color-text-secondary)",
              fontWeight: "700",
              fontSize: "0.84rem",
              cursor: "pointer",
            }}
          >
            All Slots ({slots.length})
          </button>
          <button
            onClick={() => setFilterSession("morning")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "none",
              background: filterSession === "morning" ? "#fef3c7" : "#f1f5f9",
              color: filterSession === "morning" ? "#b45309" : "var(--color-text-secondary)",
              fontWeight: "700",
              fontSize: "0.84rem",
              cursor: "pointer",
            }}
          >
            🌅 Morning ({slots.filter((s) => isMorningSlot(s.startTime)).length})
          </button>
          <button
            onClick={() => setFilterSession("evening")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "none",
              background: filterSession === "evening" ? "#ffedd5" : "#f1f5f9",
              color: filterSession === "evening" ? "#c2410c" : "var(--color-text-secondary)",
              fontWeight: "700",
              fontSize: "0.84rem",
              cursor: "pointer",
            }}
          >
            🌙 Evening ({slots.filter((s) => !isMorningSlot(s.startTime)).length})
          </button>
        </div>

        {/* Dropdowns */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {services.length > 0 && (
            <select
              value={selectedServiceFilter}
              onChange={(e) => setSelectedServiceFilter(e.target.value)}
              style={{ width: "auto", minWidth: "180px", padding: "6px 12px", fontSize: "0.84rem" }}
            >
              <option value="all">All Sevas / Services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ width: "auto", padding: "6px 12px", fontSize: "0.84rem" }}
          />

          {(dateFilter || selectedServiceFilter !== "all" || filterSession !== "all") && (
            <button
              onClick={() => {
                setDateFilter("");
                setSelectedServiceFilter("all");
                setFilterSession("all");
              }}
              className="btn btn-secondary btn-sm"
            >
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {filteredSlots.length === 0 && !error ? (
        <div className="card-section empty-state">
          <div className="empty-icon">📅</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
            No slots match the selected filters
          </h3>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "18px" }}>
            Generate standard morning and evening timing slots for pilgrim bookings.
          </p>
          <button className="btn btn-primary" onClick={handleOpenBulkModal} disabled={services.length === 0}>
            ⚡ Auto-Generate Daily Slots
          </button>
        </div>
      ) : (
        /* Data Table */
        <div className="card-section" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-container" style={{ border: "none" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ whiteSpace: "nowrap" }}>Service / Seva</th>
                  <th style={{ whiteSpace: "nowrap" }}>Darshan Date</th>
                  <th style={{ whiteSpace: "nowrap" }}>Session</th>
                  <th style={{ whiteSpace: "nowrap" }}>Time Interval</th>
                  <th style={{ whiteSpace: "nowrap" }}>Capacity & Occupancy</th>
                  <th style={{ whiteSpace: "nowrap" }}>Status</th>
                  <th style={{ whiteSpace: "nowrap" }}>Availability</th>
                  <th style={{ textAlign: "right", whiteSpace: "nowrap" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSlots.map((slot) => {
                  const isFull = (slot.bookedCount || 0) >= slot.capacity;
                  const isMorn = isMorningSlot(slot.startTime);
                  const booked = slot.bookedCount || 0;
                  const pct = Math.min(100, Math.round((booked / (slot.capacity || 1)) * 100));

                  return (
                    <tr key={slot.id}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "1.1rem" }}>🪔</span>
                          <span style={{ fontWeight: "800", color: "#0f172a" }}>{getServiceName(slot.serviceId)}</span>
                        </div>
                      </td>

                      <td style={{ whiteSpace: "nowrap" }}>
                        <span className="ref-code">{slot.date}</span>
                      </td>

                      <td style={{ whiteSpace: "nowrap" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "8px",
                            fontSize: "0.78rem",
                            fontWeight: "800",
                            backgroundColor: isMorn ? "#fffbeb" : "#fff7ed",
                            color: isMorn ? "#b45309" : "#c2410c",
                            border: `1px solid ${isMorn ? "#fde68a" : "#fed7aa"}`,
                          }}
                        >
                          {isMorn ? "🌅 Morning" : "🌙 Evening"}
                        </span>
                      </td>

                      <td style={{ whiteSpace: "nowrap" }}>
                        <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "0.9rem" }}>
                          {slot.startTime} – {slot.endTime}
                        </span>
                      </td>

                      <td style={{ whiteSpace: "nowrap", minWidth: "160px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: "700" }}>
                            <span>{booked} Booked</span>
                            <span style={{ color: "var(--color-text-muted)" }}>{slot.capacity} Max</span>
                          </div>
                          <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                background: isFull ? "#ef4444" : pct > 70 ? "#f59e0b" : "#10b981",
                                borderRadius: "3px",
                                transition: "width 300ms ease",
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td style={{ whiteSpace: "nowrap" }}>
                        <span className={`badge ${slot.isActive ? "badge-success" : "badge-neutral"}`}>
                          {slot.isActive ? "● Active" : "● Closed"}
                        </span>
                      </td>

                      <td style={{ whiteSpace: "nowrap" }}>
                        <span className={`badge ${isFull ? "badge-danger" : "badge-info"}`}>
                          {isFull ? "🔴 Full" : `🟢 ${slot.capacity - booked} Left`}
                        </span>
                      </td>

                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                          <button className="btn-icon text-primary" onClick={() => handleOpenModal(slot)}>
                            Edit
                          </button>
                          <button className="btn-icon text-danger" onClick={() => setDeleteId(slot.id!)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Single Slot Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? "Edit Timing Slot" : "Create Darshan Slot"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Service / Puja Offering *</label>
                  <select
                    required
                    value={formData.serviceId}
                    onChange={(e) => handleInputChange("serviceId", e.target.value)}
                  >
                    <option value="" disabled>
                      Select an Offering
                    </option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Darshan Date *</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                  />
                </div>

                {/* Standard Timing Presets */}
                <div className="form-group">
                  <label>Quick Standard Presets:</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px" }}>
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
                            padding: "8px 10px",
                            borderRadius: "8px",
                            fontSize: "0.78rem",
                            fontWeight: isSelected ? "800" : "600",
                            cursor: "pointer",
                            textAlign: "left",
                            backgroundColor: isSelected ? "var(--color-primary-bg)" : "#f8fafc",
                            color: isSelected ? "var(--color-primary)" : "var(--color-text)",
                            border: `1.5px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                          }}
                        >
                          {preset.session === "morning" ? "🌅" : "🌙"} {preset.label}
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

                <div className="form-grid">
                  <div className="form-group">
                    <label>Pilgrim Quota / Capacity *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => handleInputChange("capacity", parseInt(e.target.value) || 50)}
                    />
                  </div>

                  <div className="form-group flex-checkbox">
                    <label className="checkbox-label" style={{ marginTop: "24px" }}>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange("isActive", e.target.checked)}
                      />
                      <span>Active for Online Booking</span>
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

      {/* Auto-Generate Bulk Slots Modal */}
      {isBulkModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "650px" }}>
            <div className="modal-header">
              <h2>⚡ 1-Click Auto-Generate Daily Slots</h2>
              <button className="modal-close" onClick={() => setIsBulkModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleBulkSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: "0.88rem", color: "var(--color-text-secondary)" }}>
                  Instantly batch-generate all standard morning and evening darshan slots for a selected date.
                </p>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Select Seva / Darshan Offering *</label>
                    <select
                      required
                      value={bulkData.serviceId}
                      onChange={(e) => setBulkData((prev) => ({ ...prev, serviceId: e.target.value }))}
                    >
                      <option value="" disabled>
                        Choose Seva
                      </option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Target Date *</label>
                    <input
                      required
                      type="date"
                      value={bulkData.date}
                      onChange={(e) => setBulkData((prev) => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Quota Per Timing Slot (Default: 50)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={bulkData.capacity}
                    onChange={(e) => setBulkData((prev) => ({ ...prev, capacity: parseInt(e.target.value) || 50 }))}
                  />
                </div>

                <div className="form-group">
                  <label style={{ marginBottom: "8px" }}>Select Slots to Generate:</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {STANDARD_TIMINGS.map((preset) => {
                      const key = `${preset.startTime}-${preset.endTime}`;
                      const isChecked = bulkData.selectedTimings.includes(key);
                      return (
                        <label
                          key={key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            background: isChecked ? "var(--color-primary-bg)" : "#f8fafc",
                            border: `1px solid ${isChecked ? "var(--color-primary)" : "var(--color-border)"}`,
                            cursor: "pointer",
                            fontSize: "0.84rem",
                            fontWeight: "600",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBulkData((prev) => ({ ...prev, selectedTimings: [...prev.selectedTimings, key] }));
                              } else {
                                setBulkData((prev) => ({
                                  ...prev,
                                  selectedTimings: prev.selectedTimings.filter((t) => t !== key),
                                }));
                              }
                            }}
                          />
                          <span>
                            {preset.session === "morning" ? "🌅" : "🌙"} {preset.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsBulkModalOpen(false)}
                  disabled={bulkSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={bulkSaving}>
                  {bulkSaving ? <span className="spinner spinner-sm" /> : `Generate ${bulkData.selectedTimings.length} Slots`}
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
                Are you sure you want to delete this darshan slot?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Slot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
