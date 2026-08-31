import { useState, useEffect } from "react";
import { getBookings, updateBookingStatus } from "../services/bookingService";
import type { Booking } from "../types";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "pending" | "completed" | "cancelled">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "pending" | "failed">("all");

  // Modal states
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await getBookings();
      setBookings(data);
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleStatusChange = async (id: string, newStatus: Booking["status"]) => {
    if (!confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;

    setStatusUpdating(id);
    try {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) return;

      await updateBookingStatus(id, newStatus, booking.paymentStatus);
      await loadBookings();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update booking status.");
    } finally {
      setStatusUpdating(null);
    }
  };

  const handlePaymentStatusChange = async (id: string, newPaymentStatus: Booking["paymentStatus"]) => {
    if (!confirm(`Are you sure you want to mark payment as ${newPaymentStatus}?`)) return;

    setStatusUpdating(id);
    try {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) return;

      await updateBookingStatus(id, booking.status, newPaymentStatus);
      await loadBookings();
    } catch (err) {
      console.error("Error updating payment status:", err);
      alert("Failed to update payment status.");
    } finally {
      setStatusUpdating(null);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "badge-success";
      case "pending":
        return "badge-info";
      case "cancelled":
        return "badge-danger";
      case "completed":
        return "badge-neutral";
      default:
        return "badge-neutral";
    }
  };

  const getPaymentBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "badge-success";
      case "pending":
        return "badge-info";
      case "failed":
        return "badge-danger";
      case "refunded":
        return "badge-neutral";
      default:
        return "badge-neutral";
    }
  };

  // Metrics
  const totalBookings = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const totalDakshina = bookings
    .filter((b) => b.paymentStatus === "paid" || b.status === "confirmed")
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Filtered Bookings
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== "all" && b.status?.toLowerCase() !== statusFilter) return false;
    if (paymentFilter !== "all" && b.paymentStatus?.toLowerCase() !== paymentFilter) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchRef = b.bookingRef?.toLowerCase().includes(query);
      const matchService = b.serviceName?.toLowerCase().includes(query);
      const matchDate = b.bookingDate?.toLowerCase().includes(query);
      return matchRef || matchService || matchDate;
    }
    return true;
  });

  if (loading && bookings.length === 0) {
    return (
      <div className="empty-state">
        <span className="spinner"></span>
        <p style={{ marginTop: "12px" }}>Loading devotee bookings...</p>
      </div>
    );
  }

  return (
    <div className="bookings-page" style={{ width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}>
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
          <h1 style={{ fontSize: "1.55rem", fontWeight: "800", color: "#0f172a" }}>Bookings & Pilgrim Reservations</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
            Monitor live darshan & seva reservations, verify payment receipts, and manage booking status.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={loadBookings}>
          🔄 Refresh
        </button>
      </div>

      {/* Metrics Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))",
          gap: "14px",
          marginBottom: "22px",
        }}
      >
        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span style={{ fontSize: "1.4rem" }}>📋</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#0f172a" }}>{totalBookings}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Total Bookings</div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span style={{ fontSize: "1.4rem" }}>🟢</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#047857" }}>{confirmedCount}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Confirmed Slots</div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span style={{ fontSize: "1.4rem" }}>⏳</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#b45309" }}>{pendingCount}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Pending Verification</div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span style={{ fontSize: "1.4rem" }}>💰</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#b45309" }}>₹{totalDakshina}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Total Dakshina Collected</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Filter & Search Toolbar */}
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
        {/* Status Filter Tabs */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            onClick={() => setStatusFilter("all")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              background: statusFilter === "all" ? "var(--color-primary-bg)" : "#f1f5f9",
              color: statusFilter === "all" ? "var(--color-primary)" : "var(--color-text-secondary)",
              fontWeight: "700",
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setStatusFilter("confirmed")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              background: statusFilter === "confirmed" ? "#ecfdf5" : "#f1f5f9",
              color: statusFilter === "confirmed" ? "#047857" : "var(--color-text-secondary)",
              fontWeight: "700",
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            ● Confirmed ({confirmedCount})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "none",
              background: statusFilter === "pending" ? "#fef3c7" : "#f1f5f9",
              color: statusFilter === "pending" ? "#b45309" : "var(--color-text-secondary)",
              fontWeight: "700",
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            ● Pending ({pendingCount})
          </button>
        </div>

        {/* Search & Payment Dropdown */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            style={{ width: "auto", minWidth: "140px", padding: "6px 10px", fontSize: "0.82rem" }}
          >
            <option value="all">All Payments</option>
            <option value="paid">₹ Paid Only</option>
            <option value="pending">Payment Pending</option>
            <option value="failed">Payment Failed</option>
          </select>

          <input
            type="text"
            placeholder="🔍 Search Ref / Seva..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "auto", minWidth: "190px", padding: "6px 12px", fontSize: "0.82rem" }}
          />

          {(searchQuery || statusFilter !== "all" || paymentFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPaymentFilter("all");
              }}
              className="btn btn-secondary btn-sm"
            >
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {filteredBookings.length === 0 && !error ? (
        <div className="card-section empty-state">
          <div className="empty-icon">📋</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
            No bookings found
          </h3>
          <p style={{ color: "var(--color-text-secondary)" }}>
            No bookings match the search criteria or filter tags.
          </p>
        </div>
      ) : (
        /* Data Table */
        <div className="card-section" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-container" style={{ border: "none" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ whiteSpace: "nowrap" }}>Booking Ref</th>
                  <th style={{ whiteSpace: "nowrap" }}>Offering Name</th>
                  <th style={{ whiteSpace: "nowrap" }}>Darshan Date</th>
                  <th style={{ whiteSpace: "nowrap" }}>Devotees</th>
                  <th style={{ whiteSpace: "nowrap" }}>Dakshina</th>
                  <th style={{ whiteSpace: "nowrap" }}>Booking Status</th>
                  <th style={{ whiteSpace: "nowrap" }}>Payment</th>
                  <th style={{ textAlign: "right", whiteSpace: "nowrap" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} style={{ opacity: statusUpdating === booking.id ? 0.5 : 1 }}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span className="ref-code" style={{ whiteSpace: "nowrap", display: "inline-block" }}>
                        {booking.bookingRef || "—"}
                      </span>
                    </td>

                    <td style={{ whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: "800", color: "#0f172a" }}>{booking.serviceName || "Temple Seva"}</span>
                    </td>

                    <td style={{ whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: "600", color: "var(--color-text-secondary)" }}>
                        {booking.bookingDate || "—"}
                      </span>
                    </td>

                    <td style={{ whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: "700" }}>{booking.quantity || 1} Person(s)</span>
                    </td>

                    <td style={{ whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: "900", color: "#b45309", fontSize: "0.95rem" }}>
                        {booking.totalAmount ? `₹${booking.totalAmount}` : "Free"}
                      </span>
                    </td>

                    <td style={{ whiteSpace: "nowrap" }}>
                      <select
                        className={`badge ${getStatusBadgeClass(booking.status)}`}
                        value={booking.status}
                        onChange={(e) => handleStatusChange(booking.id!, e.target.value as any)}
                        disabled={statusUpdating === booking.id}
                        style={{ cursor: "pointer", border: "none", appearance: "none", paddingRight: "10px" }}
                      >
                        <option value="pending">● Pending</option>
                        <option value="confirmed">● Confirmed</option>
                        <option value="completed">● Completed</option>
                        <option value="cancelled">● Cancelled</option>
                      </select>
                    </td>

                    <td style={{ whiteSpace: "nowrap" }}>
                      <select
                        className={`badge ${getPaymentBadgeClass(booking.paymentStatus)}`}
                        value={booking.paymentStatus}
                        onChange={(e) => handlePaymentStatusChange(booking.id!, e.target.value as any)}
                        disabled={statusUpdating === booking.id}
                        style={{ cursor: "pointer", border: "none", appearance: "none", paddingRight: "10px" }}
                      >
                        <option value="pending">● Pending</option>
                        <option value="paid">● Paid (₹)</option>
                        <option value="failed">● Failed</option>
                        <option value="refunded">● Refunded</option>
                      </select>
                    </td>

                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn-icon text-primary" onClick={() => setViewingBooking(booking)}>
                        🔍 Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Devotee Pass Details Modal */}
      {viewingBooking && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <div>
                <h2>Devotee Seva Pass & Receipt</h2>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  Verified Temple Darshan Pass
                </span>
              </div>
              <button className="modal-close" onClick={() => setViewingBooking(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ gap: "16px" }}>
              {/* Reference Banner */}
              <div
                style={{
                  background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
                  border: "1.5px solid #fde68a",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#92400e", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    BOOKING REFERENCE
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: "900", color: "#b45309", fontFamily: "monospace" }}>
                    {viewingBooking.bookingRef}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  <span className={`badge ${getStatusBadgeClass(viewingBooking.status)}`}>
                    {viewingBooking.status}
                  </span>
                  <span className={`badge ${getPaymentBadgeClass(viewingBooking.paymentStatus)}`}>
                    {viewingBooking.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Seva Information Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                  background: "#f8fafc",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: "700" }}>Offering</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>
                    {viewingBooking.serviceName}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: "700" }}>Darshan Date</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>
                    {viewingBooking.bookingDate}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: "700" }}>Pilgrims</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>
                    {viewingBooking.quantity} Person(s)
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: "700" }}>Dakshina Total</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#b45309" }}>
                    ₹{viewingBooking.totalAmount}
                  </div>
                </div>
              </div>

              {/* Devotee Info */}
              {viewingBooking.devotees && Array.isArray(viewingBooking.devotees) && viewingBooking.devotees.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.84rem", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>
                    👤 Devotee Information
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {viewingBooking.devotees.map((devotee, index) => (
                      <div
                        key={index}
                        style={{
                          background: "#ffffff",
                          border: "1px solid var(--color-border)",
                          borderRadius: "10px",
                          padding: "12px 16px",
                          fontSize: "0.85rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px"
                        }}
                      >
                        {Object.entries(devotee).map(([k, v]) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{k}:</span>
                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical / ID audit */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                <span>User ID: {viewingBooking.userId?.substring(0, 16)}...</span>
                <span>Slot: {viewingBooking.slotId ? viewingBooking.slotId.substring(0, 16) + "..." : "General"}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewingBooking(null)}>
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
