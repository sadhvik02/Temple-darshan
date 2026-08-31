import { useEffect, useState } from "react";
import { collection, getCountFromServer, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Booking } from "../types";

interface StatCardData {
  label: string;
  value: number | null;
  icon: string;
  loading: boolean;
  link: string;
  gradient: string;
  accentColor: string;
}

export default function DashboardPage() {
  const { adminData } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<StatCardData[]>([
    {
      label: "Active Sevas",
      value: null,
      icon: "🪔",
      loading: true,
      link: "/services",
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
      accentColor: "#f59e0b",
    },
    {
      label: "Darshan Types",
      value: null,
      icon: "🙏",
      loading: true,
      link: "/darshans",
      gradient: "linear-gradient(135deg, #ea580c, #c2410c)",
      accentColor: "#ea580c",
    },
    {
      label: "Total Bookings",
      value: null,
      icon: "📋",
      loading: true,
      link: "/bookings",
      gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
      accentColor: "#3b82f6",
    },
    {
      label: "Registered Devotees",
      value: null,
      icon: "👥",
      loading: true,
      link: "/users",
      gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
      accentColor: "#8b5cf6",
    },
    {
      label: "Donation Funds",
      value: null,
      icon: "💰",
      loading: true,
      link: "/donations",
      gradient: "linear-gradient(135deg, #10b981, #047857)",
      accentColor: "#10b981",
    },
    {
      label: "Temple Events",
      value: null,
      icon: "🎉",
      loading: true,
      link: "/events",
      gradient: "linear-gradient(135deg, #ec4899, #be185d)",
      accentColor: "#ec4899",
    },
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
              : 0,
          loading: false,
        }))
      );
    }

    async function fetchRecentBookings() {
      try {
        const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(6));
        const snapshot = await getDocs(q);
        setRecentBookings(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Booking[]);
      } catch (err) {
        console.error("Failed to load recent bookings", err);
      } finally {
        setLoadingBookings(false);
      }
    }

    fetchCounts();
    fetchRecentBookings();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return <span className="badge badge-success">● Confirmed</span>;
      case "pending":
        return <span className="badge badge-info">● Pending</span>;
      case "cancelled":
        return <span className="badge badge-danger">● Cancelled</span>;
      case "completed":
        return <span className="badge badge-neutral">● Completed</span>;
      default:
        return <span className="badge badge-neutral">{status || "Pending"}</span>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return <span className="badge badge-success">₹ Paid</span>;
      case "failed":
        return <span className="badge badge-danger">Failed</span>;
      case "refunded":
        return <span className="badge badge-neutral">Refunded</span>;
      default:
        return <span className="badge badge-info">Pending</span>;
    }
  };

  return (
    <div className="dashboard-page">
      {/* 1. Welcome Hero Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h1>Namaste, {adminData?.name || "Temple Administrator"} 🙏</h1>
          <p>
            Welcome to the Sri Kedareshwara Ashramam Management Portal. Monitor live bookings, configure slots, and manage devotional offerings.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", zIndex: 2 }}>
          <button onClick={() => navigate("/slots")} className="btn btn-primary">
            ⚡ Manage Slots
          </button>
        </div>
      </div>

      {/* 2. Quick Action Shortcuts */}
      <div className="quick-actions-bar">
        <div className="action-btn-card" onClick={() => navigate("/slots")}>
          <div className="action-card-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
            ⚡
          </div>
          <div className="action-card-info">
            <h4>Generate Daily Slots</h4>
            <p>1-click bulk slot creation</p>
          </div>
        </div>

        <div className="action-btn-card" onClick={() => navigate("/services")}>
          <div className="action-card-icon" style={{ background: "rgba(234, 88, 12, 0.15)", color: "#ea580c" }}>
            🪔
          </div>
          <div className="action-card-info">
            <h4>Add New Seva</h4>
            <p>Manage puja catalog & dakshina</p>
          </div>
        </div>

        <div className="action-btn-card" onClick={() => navigate("/news")}>
          <div className="action-card-icon" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
            📢
          </div>
          <div className="action-card-info">
            <h4>Post Announcement</h4>
            <p>Publish live mandir updates</p>
          </div>
        </div>

        <div className="action-btn-card" onClick={() => navigate("/temple")}>
          <div className="action-card-icon" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}>
            🛕
          </div>
          <div className="action-card-info">
            <h4>Temple Timings</h4>
            <p>Edit morning & evening hours</p>
          </div>
        </div>
      </div>

      {/* 3. Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat) => (
          <Link to={stat.link} key={stat.label} className="stat-card" style={{ textDecoration: "none" }}>
            <div className="stat-icon-wrapper" style={{ background: stat.gradient, color: "#fff" }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <span className="stat-value">
                {stat.loading ? <span className="spinner spinner-sm" /> : stat.value ?? 0}
              </span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* 4. Recent Bookings Table Card */}
      <div className="card-section">
        <div className="card-section-header">
          <h3 className="card-section-title">
            <span>📋</span> Recent Seva & Darshan Bookings
          </h3>
          <Link
            to="/bookings"
            style={{
              color: "var(--color-primary)",
              fontWeight: "700",
              fontSize: "0.88rem",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            View All Bookings →
          </Link>
        </div>

        {loadingBookings ? (
          <div style={{ textAlign: "center", padding: "36px", color: "var(--color-text-muted)" }}>
            <span className="spinner spinner-sm" /> Loading live bookings...
          </div>
        ) : recentBookings.length > 0 ? (
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Offering Name</th>
                  <th>Darshan Date</th>
                  <th>Quantity</th>
                  <th>Dakshina</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <span className="ref-code">{b.bookingRef || "—"}</span>
                    </td>
                    <td style={{ fontWeight: "700", color: "#0f172a" }}>{b.serviceName || "Sacred Seva"}</td>
                    <td>{b.bookingDate || "—"}</td>
                    <td>{b.quantity ? `${b.quantity} Person(s)` : "1 Person"}</td>
                    <td style={{ fontWeight: "800", color: "#b45309" }}>
                      {b.totalAmount ? `₹${b.totalAmount}` : "Free"}
                    </td>
                    <td>{getPaymentBadge(b.paymentStatus)}</td>
                    <td>{getStatusBadge(b.status)}</td>
                    <td>
                      <Link to="/bookings" className="btn btn-secondary btn-sm">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No recent bookings recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
