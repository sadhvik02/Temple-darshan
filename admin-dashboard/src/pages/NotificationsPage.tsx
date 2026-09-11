import { useEffect, useState, type FormEvent } from "react";
import { 
  getNotifications, 
  createNotification, 
  updateNotification, 
  deleteNotification 
} from "../services/notificationService";
import type { NotificationItem } from "../types";

const TYPE_OPTIONS = [
  { value: "announcement", label: "Announcement", icon: "📢", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  { value: "puja", label: "Puja & Seva Update", icon: "🪔", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { value: "darshan", label: "Darshan Timings", icon: "🙏", color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  { value: "event", label: "Temple Event Alert", icon: "🎉", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { value: "urgent", label: "Urgent Notice", icon: "⚠️", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  { value: "general", label: "Spiritual Message", icon: "🕊️", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
];

const ROUTE_OPTIONS = [
  { value: "", label: "None (Informational only)" },
  { value: "/darshan", label: "🙏 Darshan Slot Booking" },
  { value: "/services", label: "🪔 Arjitha Seva Offerings" },
  { value: "/events", label: "🎉 Temple Events Calendar" },
  { value: "/news", label: "📰 News & Circulars" },
  { value: "/donations", label: "🍲 Annadanam & Donations" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    type: "announcement" as NotificationItem["type"],
    targetAudience: "all" as NotificationItem["targetAudience"],
    imageUrl: "",
    actionRoute: "",
  });

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
      setError(null);
    } catch (err) {
      console.error("Error loading notifications:", err);
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleOpenModal = (item?: NotificationItem) => {
    if (item) {
      setEditingId(item.id!);
      setFormData({
        title: item.title,
        body: item.body,
        type: item.type || "announcement",
        targetAudience: item.targetAudience || "all",
        imageUrl: item.imageUrl || "",
        actionRoute: item.actionRoute || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        body: "",
        type: "announcement",
        targetAudience: "all",
        imageUrl: "",
        actionRoute: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) {
      alert("Please fill in both the Notification Title and Message Body.");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        title: formData.title.trim(),
        body: formData.body.trim(),
        type: formData.type,
        targetAudience: formData.targetAudience,
        isGlobal: formData.targetAudience === "all",
        sentBy: "Temple Administration",
      };

      if (formData.imageUrl && formData.imageUrl.trim()) {
        payload.imageUrl = formData.imageUrl.trim();
      }
      if (formData.actionRoute && formData.actionRoute.trim()) {
        payload.actionRoute = formData.actionRoute.trim();
      }

      if (editingId) {
        await updateNotification(editingId, payload);
      } else {
        await createNotification(payload);
      }

      await loadNotifications();
      handleCloseModal();
    } catch (err: any) {
      console.error("Error saving notification:", err);
      alert(`Failed to send notification: ${err?.message || "Please check your network connection and try again."}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteNotification(deleteId);
      await loadNotifications();
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting notification:", err);
      alert("Failed to delete notification.");
    } finally {
      setDeleting(false);
    }
  };

  const getTypeConfig = (type: string) => {
    return TYPE_OPTIONS.find((t) => t.value === type) || TYPE_OPTIONS[0];
  };

  const formatTimestamp = (createdAt: any) => {
    if (!createdAt) return "Just now";
    let d: Date;
    if (typeof createdAt.toDate === "function") {
      d = createdAt.toDate();
    } else if (createdAt instanceof Date) {
      d = createdAt;
    } else if (createdAt.seconds) {
      d = new Date(createdAt.seconds * 1000);
    } else {
      d = new Date(createdAt);
    }
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const filteredNotifications = notifications.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.body.toLowerCase().includes(query);
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const urgentCount = notifications.filter((n) => n.type === "urgent").length;
  const pujaCount = notifications.filter((n) => n.type === "puja" || n.type === "darshan").length;
  const announcementCount = notifications.filter((n) => n.type === "announcement" || n.type === "general").length;

  return (
    <div>
      {/* Top Header */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.6rem" }}>🔔</span>
            <h1 style={{ fontSize: "1.55rem", fontWeight: "900", color: "#0f172a", margin: 0 }}>
              Temple Notifications & Devotee Broadcasts
            </h1>
          </div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
            Create and send manual announcements, puja reminders, darshan alerts, and festival notices to all devotees.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => handleOpenModal()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            fontSize: "0.92rem",
            fontWeight: "800",
            boxShadow: "0 4px 12px rgba(230, 81, 0, 0.25)",
          }}
        >
          <span>✨</span> Send New Notification
        </button>
      </div>

      {/* Summary Stat Chips */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span style={{ fontSize: "1.4rem" }}>📡</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#0f172a" }}>{notifications.length}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
              Total Broadcasts
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span style={{ fontSize: "1.4rem" }}>📢</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#2563eb" }}>{announcementCount}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
              Announcements
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span style={{ fontSize: "1.4rem" }}>🪔</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#d97706" }}>{pujaCount}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
              Puja & Darshan Alerts
            </div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span style={{ fontSize: "1.4rem" }}>⚠️</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#dc2626" }}>{urgentCount}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
              Urgent Notices
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
          flexWrap: "wrap",
          gap: "12px",
          background: "#ffffff",
          padding: "12px 16px",
          borderRadius: "12px",
          border: "1px solid var(--color-border)",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", flex: 1 }}>
          <input
            type="text"
            placeholder="🔍 Search notifications by title or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              fontSize: "0.85rem",
              minWidth: "260px",
              maxWidth: "360px",
              flex: 1,
            }}
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              fontSize: "0.85rem",
              background: "#ffffff",
              width: "auto",
            }}
          >
            <option value="all">🌟 All Categories</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.icon} {t.label}
              </option>
            ))}
          </select>

          {(searchQuery || typeFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("all");
              }}
              className="btn btn-secondary btn-sm"
            >
              ✕ Reset
            </button>
          )}
        </div>

        <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", fontWeight: "600" }}>
          Showing {filteredNotifications.length} of {notifications.length} notifications
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "20px" }}>
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        /* Empty state */
        <div className="card-section empty-state" style={{ padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "2.8rem", marginBottom: "12px" }}>🔔</div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
            {searchQuery || typeFilter !== "all" ? "No matching notifications found" : "No temple notifications sent yet"}
          </h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.88rem", maxWidth: "480px", margin: "0 auto 18px" }}>
            {searchQuery || typeFilter !== "all"
              ? "Try clearing your search query or selecting another category filter."
              : "Send your first live notification to inform devotees about upcoming pujas, temple festivals, or darshan updates."}
          </p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Create First Notification
          </button>
        </div>
      ) : (
        /* Notifications Grid */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "18px" }}>
          {filteredNotifications.map((item) => {
            const typeConfig = getTypeConfig(item.type);
            const routeConfig = ROUTE_OPTIONS.find((r) => r.value === item.actionRoute);

            return (
              <div
                key={item.id}
                className="form-card"
                style={{
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderRadius: "14px",
                  border: item.type === "urgent" ? "1.5px solid #fca5a5" : "1px solid var(--color-border)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  background: item.type === "urgent" ? "#fffdfd" : "#ffffff",
                }}
              >
                <div>
                  {/* Top Bar: Category Badge & Audience */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontSize: "0.75rem",
                        fontWeight: "800",
                        backgroundColor: typeConfig.bg,
                        color: typeConfig.color,
                        border: `1px solid ${typeConfig.border}`,
                      }}
                    >
                      {typeConfig.icon} {typeConfig.label}
                    </span>

                    <span
                      style={{
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      🌟 {item.targetAudience === "all" ? "All Devotees" : "Registered Only"}
                    </span>
                  </div>

                  {/* Title & Body */}
                  <h3
                    style={{
                      fontSize: "1.08rem",
                      fontWeight: "800",
                      color: "#0f172a",
                      marginBottom: "8px",
                      lineHeight: "1.35",
                    }}
                  >
                    {item.title}
                  </h3>

                  <p
                    style={{
                      fontSize: "0.86rem",
                      color: "#475569",
                      lineHeight: "1.5",
                      marginBottom: "14px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {item.body}
                  </p>

                  {/* Image Attachment (if any) */}
                  {item.imageUrl && (
                    <div style={{ marginBottom: "14px" }}>
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        style={{
                          width: "100%",
                          height: "140px",
                          objectFit: "cover",
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                        }}
                      />
                    </div>
                  )}

                  {/* Action Link pill */}
                  {item.actionRoute && (
                    <div style={{ marginBottom: "12px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "0.74rem",
                          fontWeight: "700",
                          backgroundColor: "#f1f5f9",
                          color: "#334155",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        🔗 {routeConfig?.label || item.actionRoute}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer: Date & Actions */}
                <div
                  style={{
                    paddingTop: "12px",
                    borderTop: "1px solid #f1f5f9",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
                    📅 {formatTimestamp(item.createdAt)}
                  </span>

                  <div className="action-buttons" style={{ gap: "4px" }}>
                    <button
                      className="btn-icon text-primary"
                      onClick={() => handleOpenModal(item)}
                      title="Edit Notification"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn-icon text-danger"
                      onClick={() => setDeleteId(item.id!)}
                      title="Delete Notification"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compose / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "700px" }}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.3rem" }}>{editingId ? "✏️" : "✨"}</span>
                <h2>{editingId ? "Edit Notification" : "Compose Temple Notification"}</h2>
              </div>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: "72vh", overflowY: "auto", paddingRight: "6px" }}>
                {/* Notification Title */}
                <div className="form-group">
                  <label className="form-label required">Notification Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 🕉️ Maha Shivaratri Special Darshan & Puja Timings"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                {/* Notification Body */}
                <div className="form-group">
                  <label className="form-label required">Message Body</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Write your announcement details here. Devotees will receive this notification on their mobile devices..."
                    value={formData.body}
                    onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
                    required
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                      {formData.body.length} characters
                    </span>
                  </div>
                </div>

                {/* 2-Column Selects: Category & Target Audience */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Category / Type</label>
                    <select
                      className="form-control"
                      value={formData.type}
                      onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as any }))}
                    >
                      {TYPE_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.icon} {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Devotees</label>
                    <select
                      className="form-control"
                      value={formData.targetAudience}
                      onChange={(e) => setFormData((prev) => ({ ...prev, targetAudience: e.target.value as any }))}
                    >
                      <option value="all">🌟 All Devotees (Global Broadcast)</option>
                      <option value="devotees">👥 Registered Devotees Only</option>
                    </select>
                  </div>
                </div>

                {/* Action Link Route */}
                <div className="form-group">
                  <label className="form-label">App Action / Tap Destination</label>
                  <select
                    className="form-control"
                    value={formData.actionRoute}
                    onChange={(e) => setFormData((prev) => ({ ...prev, actionRoute: e.target.value }))}
                  >
                    {ROUTE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", marginTop: "4px", display: "block" }}>
                    When devotees tap this notification in the app, they will automatically be taken to this screen.
                  </small>
                </div>

                {/* Optional Image URL */}
                <div className="form-group">
                  <label className="form-label">Banner / Image URL (Optional)</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://example.com/banner-image.jpg"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  />
                </div>

                {/* Live Mobile Push Preview Card */}
                <div style={{ marginTop: "16px", padding: "14px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                    📱 Mobile Devotee Preview
                  </div>
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "1.1rem" }}>🛕</span>
                      <span style={{ fontSize: "0.76rem", fontWeight: "800", color: "var(--color-primary)" }}>
                        Sri Kedareshwara Ashramam
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "#94a3b8", marginLeft: "auto" }}>now</span>
                    </div>
                    <div style={{ fontWeight: "800", fontSize: "0.9rem", color: "#0f172a", marginBottom: "3px" }}>
                      {formData.title || "Notification Title Preview"}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#475569", lineHeight: "1.4" }}>
                      {formData.body || "Your notification message will appear here for all temple devotees."}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: "18px" }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ minWidth: "140px", fontWeight: "800" }}
                >
                  {saving ? "Broadcasting..." : editingId ? "Save Changes" : "🚀 Send Broadcast"}
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
              <button className="modal-close" onClick={() => setDeleteId(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: "#334155", fontSize: "0.9rem" }}>
                Are you sure you want to delete this notification? It will be removed from all devotee feeds.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Notification"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
