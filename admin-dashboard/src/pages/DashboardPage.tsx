import { useEffect, useState } from "react";
import { collection, getCountFromServer, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Link } from "react-router-dom";
import type { Booking } from "../types";

interface StatCard {
  label: string;
  value: number | null;
  icon: string;
  loading: boolean;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatCard[]>([
    { label: "Services", value: null, icon: "🪔", loading: true },
    { label: "Darshans", value: null, icon: "🙏", loading: true },
    { label: "Bookings", value: null, icon: "📋", loading: true },
    { label: "Users", value: null, icon: "👥", loading: true },
    { label: "Donation Types", value: null, icon: "💰", loading: true },
    { label: "Events", value: null, icon: "🎉", loading: true },
  ]);

  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      const collections = ["services", "darshans", "bookings", "users", "donationTypes", "events"];
      const results = await Promise.allSettled(
        collections.map(async (col) => {
          const snapshot = await getCountFromServer(collection(db, col));
          return snapshot.data().count;
        })
      );

      setStats((prev) =>
        prev.map((stat, i) => ({
          ...stat,
          value:
            results[i].status === "fulfilled"
              ? (results[i] as PromiseFulfilledResult<number>).value
              : null,
          loading: false,
        }))
      );
    }

    async function fetchRecentBookings() {
      try {
        const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(5));
        const snapshot = await getDocs(q);
        setRecentBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[]);
      } catch (err) {
        console.error("Failed to load recent bookings", err);
      } finally {
        setLoadingBookings(false);
      }
    }

    fetchCounts();
    fetchRecentBookings();
  }, []);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed': return 'badge-success';
      case 'pending': return 'badge-info';
      case 'cancelled': return 'badge-danger';
      case 'completed': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of the temple platform</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <span className="stat-value">
                {stat.loading ? (
                  <span className="spinner spinner-sm" />
                ) : stat.value !== null ? (
                  stat.value
                ) : (
                  "—"
                )}
              </span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-info" style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Recent Bookings</h3>
          <Link to="/bookings" className="text-primary" style={{ textDecoration: 'none', fontWeight: '500' }}>
            View All →
          </Link>
        </div>
        
        {loadingBookings ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
            <span className="spinner spinner-sm" /> Loading recent bookings...
          </div>
        ) : recentBookings.length > 0 ? (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="font-medium" style={{ fontSize: '0.875rem' }}>{b.bookingRef}</td>
                    <td>{b.serviceName}</td>
                    <td>{b.bookingDate}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <p>No recent bookings found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
