import { useState, useEffect } from "react";
import { getBookings, updateBookingStatus } from "../services/bookingService";
import type { Booking } from "../types";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null); // booking id that is being updated

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

  const handleStatusChange = async (id: string, newStatus: Booking['status']) => {
    // Note: This only changes the booking status. It deliberately avoids
    // complex distributed transactions on the slot count from the admin side.
    if (!confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;
    
    setStatusUpdating(id);
    try {
      // Find the booking to preserve payment status while updating status
      const booking = bookings.find(b => b.id === id);
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

  const handlePaymentStatusChange = async (id: string, newPaymentStatus: Booking['paymentStatus']) => {
    if (!confirm(`Are you sure you want to mark payment as ${newPaymentStatus}?`)) return;
    
    setStatusUpdating(id);
    try {
      const booking = bookings.find(b => b.id === id);
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
    switch (status) {
      case 'confirmed': return 'badge-success';
      case 'pending': return 'badge-info';
      case 'cancelled': return 'badge-danger';
      case 'completed': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  };

  const getPaymentBadgeClass = (status: string) => {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'pending': return 'badge-info';
      case 'failed': return 'badge-danger';
      case 'refunded': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="page-loading">
        <span className="spinner"></span>
        <p>Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="bookings-page">
      <div className="page-header">
        <h1>Bookings Management</h1>
        <p>View and manage devotee bookings</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          {error}
        </div>
      )}

      {bookings.length === 0 && !error ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No bookings yet</h3>
          <p>Bookings will appear here once devotees start reserving sevas.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Service</th>
                <th>Date</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} style={{ opacity: statusUpdating === booking.id ? 0.5 : 1 }}>
                  <td className="font-medium" style={{ fontSize: '0.875rem' }}>{booking.bookingRef}</td>
                  <td>{booking.serviceName}</td>
                  <td>{booking.bookingDate}</td>
                  <td>{booking.quantity}</td>
                  <td>₹{booking.totalAmount}</td>
                  <td>
                    <select 
                      className={`badge ${getStatusBadgeClass(booking.status)}`}
                      value={booking.status}
                      onChange={(e) => handleStatusChange(booking.id!, e.target.value as any)}
                      disabled={statusUpdating === booking.id}
                      style={{ cursor: 'pointer', border: 'none', appearance: 'none', paddingRight: '12px' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <select 
                      className={`badge ${getPaymentBadgeClass(booking.paymentStatus)}`}
                      value={booking.paymentStatus}
                      onChange={(e) => handlePaymentStatusChange(booking.id!, e.target.value as any)}
                      disabled={statusUpdating === booking.id}
                      style={{ cursor: 'pointer', border: 'none', appearance: 'none', paddingRight: '12px' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td>
                    <button 
                      className="btn-icon text-primary" 
                      onClick={() => setViewingBooking(booking)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Details Modal */}
      {viewingBooking && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="modal-close" onClick={() => setViewingBooking(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div className="form-help">Booking Reference</div>
                  <div className="font-medium">{viewingBooking.bookingRef}</div>
                </div>
                <div>
                  <div className="form-help">Created At</div>
                  <div>
                    {viewingBooking.createdAt?.toDate 
                      ? viewingBooking.createdAt.toDate().toLocaleString() 
                      : 'Unknown'}
                  </div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div className="form-help">Service Name</div>
                  <div className="font-medium">{viewingBooking.serviceName}</div>
                </div>
                <div>
                  <div className="form-help">Service Date</div>
                  <div>{viewingBooking.bookingDate}</div>
                </div>
                <div>
                  <div className="form-help">Quantity (Persons/Tickets)</div>
                  <div>{viewingBooking.quantity}</div>
                </div>
                <div>
                  <div className="form-help">Total Amount</div>
                  <div className="font-medium">₹{viewingBooking.totalAmount}</div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />
              
              <div>
                <div className="form-help" style={{ marginBottom: '8px' }}>Devotee Details (Raw JSON)</div>
                <pre style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: '4px', fontSize: '0.8rem', overflowX: 'auto', border: '1px solid var(--color-border)' }}>
                  {viewingBooking.devoteeDetails 
                    ? JSON.stringify(viewingBooking.devoteeDetails, null, 2) 
                    : "No extra devotee details provided"}
                </pre>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
                <div>
                  <div className="form-help">User ID</div>
                  <div style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{viewingBooking.userId}</div>
                </div>
                <div>
                  <div className="form-help">Slot ID</div>
                  <div style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{viewingBooking.slotId || "None (Not slot-based)"}</div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewingBooking(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
