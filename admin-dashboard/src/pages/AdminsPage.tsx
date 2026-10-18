import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAdmins, toggleAdminStatus, updateAdmin, deleteAdmin } from "../services/adminService";
import { AVAILABLE_ADMIN_PAGES, type AdminUser } from "../types";
import { useAuth } from "../hooks/useAuth";

export default function AdminsPage() {
  const navigate = useNavigate();
  const { adminData, firebaseUser } = useAuth();
  const currentUid = firebaseUser?.uid;
  const isSuperAdmin = (adminData?.role || "").toUpperCase() === "SUPER_ADMIN";

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Edit modal state
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState<string>("ADMIN");
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editPassword, setEditPassword] = useState<string>("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete modal state
  const [deletingAdmin, setDeletingAdmin] = useState<AdminUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdmins();
      setAdmins(data);
    } catch (err: any) {
      console.error("Error loading admins:", err);
      setError(err.message || "Failed to load administrators directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadAdmins();
    }
  }, [isSuperAdmin]);

  const handleToggleStatus = async (admin: AdminUser) => {
    if (admin.id === currentUid) {
      alert("You cannot deactivate your own Super Admin account.");
      return;
    }
    const newStatus = !(admin.isActive !== false);
    try {
      await toggleAdminStatus(admin.id || admin.uid!, newStatus);
      setAdmins((prev) =>
        prev.map((a) => (a.id === admin.id ? { ...a, isActive: newStatus } : a))
      );
      setActionSuccess(`Administrator "${admin.name}" ${newStatus ? "activated" : "deactivated"}.`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const openEditModal = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setEditRole((admin.role || "ADMIN").toUpperCase());
    setEditPermissions(admin.permissions || AVAILABLE_ADMIN_PAGES.map((p) => p.path));
    setEditPassword("");
  };

  const handleSaveEdit = async () => {
    if (!editingAdmin) return;
    setEditSaving(true);
    try {
      await updateAdmin({
        uid: editingAdmin.id || editingAdmin.uid!,
        role: editRole,
        permissions: editRole === "SUPER_ADMIN" ? ["all"] : editPermissions,
        password: editPassword.length >= 6 ? editPassword : undefined,
      });

      setAdmins((prev) =>
        prev.map((a) =>
          a.id === editingAdmin.id
            ? {
                ...a,
                role: editRole,
                permissions: editRole === "SUPER_ADMIN" ? ["all"] : editPermissions,
              }
            : a
        )
      );

      setActionSuccess(`Permissions for "${editingAdmin.name}" updated successfully.`);
      setTimeout(() => setActionSuccess(null), 3500);
      setEditingAdmin(null);
    } catch (err: any) {
      alert(`Failed to update admin: ${err.message}`);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;
    if (deletingAdmin.id === currentUid) {
      alert("You cannot delete your own Super Admin account.");
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteAdmin(deletingAdmin.id || deletingAdmin.uid!);
      setAdmins((prev) => prev.filter((a) => a.id !== deletingAdmin.id));
      setActionSuccess(`Administrator "${deletingAdmin.name}" removed successfully.`);
      setTimeout(() => setActionSuccess(null), 3500);
      setDeletingAdmin(null);
    } catch (err: any) {
      alert(`Failed to delete admin: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleEditPermission = (path: string) => {
    if (editPermissions.includes(path)) {
      setEditPermissions(editPermissions.filter((p) => p !== path));
    } else {
      setEditPermissions([...editPermissions, path]);
    }
  };

  // Filtered List
  const filteredAdmins = admins.filter((a) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      (a.name || "").toLowerCase().includes(s) ||
      (a.email || "").toLowerCase().includes(s) ||
      (a.phone || "").toLowerCase().includes(s) ||
      (a.role || "").toLowerCase().includes(s);

    const aRole = (a.role || "ADMIN").toUpperCase();
    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "super_admin" && aRole === "SUPER_ADMIN") ||
      (roleFilter === "admin" && aRole !== "SUPER_ADMIN");

    const aActive = a.isActive !== false;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && aActive) ||
      (statusFilter === "inactive" && !aActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const superAdminCount = admins.filter((a) => (a.role || "").toUpperCase() === "SUPER_ADMIN").length;
  const standardAdminCount = admins.length - superAdminCount;
  const activeCount = admins.filter((a) => a.isActive !== false).length;

  if (!isSuperAdmin) {
    return (
      <div className="empty-state" style={{ padding: "60px 20px" }}>
        <div className="empty-icon">🔒</div>
        <h3>Restricted Super Admin Area</h3>
        <p>Only Super Admins can access and manage administrative accounts.</p>
        <button className="btn btn-primary" onClick={() => navigate("/dashboard")} style={{ marginTop: "16px" }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="admins-page">
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700" }}>Admin Directory & Pages</h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "4px" }}>
            Super Admin access control: manage temple administrators, configure page permissions, and monitor staff accounts
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={loadAdmins}
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            title="Refresh list"
          >
            🔄 Refresh
          </button>
          <Link
            to="/admins/create"
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: "600" }}
          >
            <span>➕</span> Create New Admin
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success" style={{ marginBottom: "20px" }}>
          <span className="alert-icon">✓</span>
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "20px" }}>
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div className="kpi-card" style={{ background: "var(--color-bg-card)", padding: "18px 20px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Total Admins</span>
            <span style={{ fontSize: "1.3rem" }}>👥</span>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: "800", marginTop: "8px" }}>{admins.length}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "4px" }}>Staff with dashboard access</div>
        </div>

        <div className="kpi-card" style={{ background: "var(--color-bg-card)", padding: "18px 20px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "#6d28d9", textTransform: "uppercase" }}>Super Admins</span>
            <span style={{ fontSize: "1.3rem" }}>👑</span>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#7c3aed", marginTop: "8px" }}>{superAdminCount}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "4px" }}>Full administrative authority</div>
        </div>

        <div className="kpi-card" style={{ background: "var(--color-bg-card)", padding: "18px 20px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--color-primary)", textTransform: "uppercase" }}>Standard Admins</span>
            <span style={{ fontSize: "1.3rem" }}>🪔</span>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--color-primary)", marginTop: "8px" }}>{standardAdminCount}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "4px" }}>Module-level permissions</div>
        </div>

        <div className="kpi-card" style={{ background: "var(--color-bg-card)", padding: "18px 20px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--color-success)", textTransform: "uppercase" }}>Active Accounts</span>
            <span style={{ fontSize: "1.3rem" }}>🟢</span>
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--color-success)", marginTop: "8px" }}>{activeCount}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "4px" }}>Able to log in right now</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div
        className="table-controls"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", gap: "12px", flex: 1, minWidth: "280px", maxWidth: "600px" }}>
          <input
            type="text"
            placeholder="Search by admin name, email, phone, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admins Only</option>
            <option value="admin">Standard Admins Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      {loading && admins.length === 0 ? (
        <div className="page-loading" style={{ padding: "60px 0", textAlign: "center" }}>
          <span className="spinner"></span>
          <p style={{ marginTop: "12px", color: "var(--color-text-secondary)" }}>Loading administrators...</p>
        </div>
      ) : admins.length === 0 ? (
        <div className="empty-state" style={{ padding: "60px 20px" }}>
          <div className="empty-icon">🛡️</div>
          <h3>No administrators registered</h3>
          <p>Get started by creating the first administrator account.</p>
          <Link to="/admins/create" className="btn btn-primary" style={{ marginTop: "16px" }}>
            + Create Administrator
          </Link>
        </div>
      ) : (
        <div className="table-container" style={{ background: "var(--color-bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "14px 18px", textAlign: "left", fontSize: "0.82rem", fontWeight: "700", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Administrator</th>
                <th style={{ padding: "14px 18px", textAlign: "left", fontSize: "0.82rem", fontWeight: "700", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Role</th>
                <th style={{ padding: "14px 18px", textAlign: "left", fontSize: "0.82rem", fontWeight: "700", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Phone</th>
                <th style={{ padding: "14px 18px", textAlign: "left", fontSize: "0.82rem", fontWeight: "700", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Admin Pages (Permissions)</th>
                <th style={{ padding: "14px 18px", textAlign: "left", fontSize: "0.82rem", fontWeight: "700", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Status</th>
                <th style={{ padding: "14px 18px", textAlign: "right", fontSize: "0.82rem", fontWeight: "700", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.length > 0 ? (
                filteredAdmins.map((admin) => {
                  const isSelf = admin.id === currentUid;
                  const isSuper = (admin.role || "").toUpperCase() === "SUPER_ADMIN";
                  const isActive = admin.isActive !== false;
                  const permissions = admin.permissions || [];
                  const hasAll = isSuper || permissions.includes("all") || permissions.length === AVAILABLE_ADMIN_PAGES.length;

                  return (
                    <tr
                      key={admin.id}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        background: isSelf ? "rgba(245, 158, 11, 0.03)" : "transparent",
                      }}
                    >
                      {/* Administrator Info */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "50%",
                              background: isSuper ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "linear-gradient(135deg, #d97706, #b45309)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "700",
                              fontSize: "0.95rem",
                              flexShrink: 0,
                            }}
                          >
                            {admin.name?.charAt(0)?.toUpperCase() || "A"}
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                              <span>{admin.name}</span>
                              {isSelf && (
                                <span
                                  style={{
                                    fontSize: "0.68rem",
                                    padding: "2px 6px",
                                    borderRadius: "10px",
                                    background: "var(--color-primary-bg)",
                                    color: "var(--color-primary)",
                                    fontWeight: "700",
                                  }}
                                >
                                  YOU
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                              {admin.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: "14px 18px" }}>
                        {isSuper ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "0.78rem",
                              fontWeight: "700",
                              background: "#ede9fe",
                              color: "#6d28d9",
                              border: "1px solid rgba(124, 58, 237, 0.2)",
                            }}
                          >
                            <span>👑</span> SUPER ADMIN
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "0.78rem",
                              fontWeight: "700",
                              background: "var(--color-primary-bg)",
                              color: "var(--color-primary)",
                              border: "1px solid rgba(217, 119, 6, 0.2)",
                            }}
                          >
                            <span>🪔</span> ADMIN
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td style={{ padding: "14px 18px", fontSize: "0.88rem", color: "var(--color-text-secondary)" }}>
                        {admin.phone || "—"}
                      </td>

                      {/* Page Permissions */}
                      <td style={{ padding: "14px 18px" }}>
                        {hasAll ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "0.76rem",
                              fontWeight: "600",
                              background: "var(--color-bg-subtle)",
                              color: "var(--color-text-secondary)",
                            }}
                          >
                            ✨ Full Access (All {AVAILABLE_ADMIN_PAGES.length} Pages)
                          </span>
                        ) : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "260px" }}>
                            {permissions.slice(0, 3).map((path) => {
                              const match = AVAILABLE_ADMIN_PAGES.find((p) => p.path === path);
                              return (
                                <span
                                  key={path}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontSize: "0.72rem",
                                    background: "var(--color-bg)",
                                    border: "1px solid var(--color-border)",
                                  }}
                                >
                                  {match?.icon || "📄"} {match?.label || path}
                                </span>
                              );
                            })}
                            {permissions.length > 3 && (
                              <span
                                style={{
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "0.72rem",
                                  background: "var(--color-bg-subtle)",
                                  color: "var(--color-text-muted)",
                                }}
                              >
                                +{permissions.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "0.78rem",
                            fontWeight: "600",
                            background: isActive ? "var(--color-success-bg)" : "var(--color-danger-bg)",
                            color: isActive ? "var(--color-success)" : "var(--color-danger)",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: isActive ? "var(--color-success)" : "var(--color-danger)",
                            }}
                          />
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            onClick={() => openEditModal(admin)}
                            className="btn btn-secondary"
                            style={{ padding: "6px 10px", fontSize: "0.78rem" }}
                            title="Edit Permissions & Role"
                          >
                            ✏️ Edit
                          </button>

                          {!isSelf && (
                            <>
                              <button
                                onClick={() => handleToggleStatus(admin)}
                                className="btn btn-secondary"
                                style={{
                                  padding: "6px 10px",
                                  fontSize: "0.78rem",
                                  color: isActive ? "var(--color-danger)" : "var(--color-success)",
                                }}
                                title={isActive ? "Deactivate Account" : "Activate Account"}
                              >
                                {isActive ? "⏸️" : "▶️"}
                              </button>

                              <button
                                onClick={() => setDeletingAdmin(admin)}
                                className="btn btn-secondary"
                                style={{ padding: "6px 10px", fontSize: "0.78rem", color: "var(--color-danger)" }}
                                title="Delete Admin"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "36px", color: "var(--color-text-muted)" }}>
                    No administrators match your search or filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div
            style={{
              padding: "14px 18px",
              background: "var(--color-bg-subtle)",
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.82rem",
              color: "var(--color-text-muted)",
            }}
          >
            <span>Showing {filteredAdmins.length} of {admins.length} administrators</span>
            <span>Only Super Admins can alter role privileges</span>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {editingAdmin && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--color-bg-elevated)",
              borderRadius: "var(--radius-xl)",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "700" }}>Edit Administrator</h2>
              <button
                onClick={() => setEditingAdmin(null)}
                style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--color-text-muted)" }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "20px", padding: "12px 14px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontWeight: "700", fontSize: "1rem" }}>{editingAdmin.name}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>{editingAdmin.email}</div>
            </div>

            {/* Role Selector */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "8px", fontSize: "0.9rem" }}>
                Administrator Role
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setEditRole("ADMIN")}
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    border: editRole === "ADMIN" ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                    background: editRole === "ADMIN" ? "var(--color-primary-bg)" : "var(--color-bg)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontWeight: "700" }}>🪔 Standard Admin</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    Restricted to selected pages
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setEditRole("SUPER_ADMIN")}
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    border: editRole === "SUPER_ADMIN" ? "2px solid #7c3aed" : "1px solid var(--color-border)",
                    background: editRole === "SUPER_ADMIN" ? "rgba(124, 58, 237, 0.08)" : "var(--color-bg)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontWeight: "700", color: editRole === "SUPER_ADMIN" ? "#7c3aed" : "inherit" }}>
                    👑 Super Admin
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    Full system authority
                  </div>
                </button>
              </div>
            </div>

            {/* Permissions Checkbox Grid (if role is ADMIN) */}
            {editRole === "ADMIN" && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <label style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                    Allowed Admin Pages ({editPermissions.length} selected)
                  </label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setEditPermissions(AVAILABLE_ADMIN_PAGES.map((p) => p.path))}
                      style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", background: "var(--color-bg)", border: "1px solid var(--color-border)", cursor: "pointer" }}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPermissions([])}
                      style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", background: "var(--color-bg)", border: "1px solid var(--color-border)", cursor: "pointer" }}
                    >
                      None
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", maxHeight: "200px", overflowY: "auto", padding: "4px" }}>
                  {AVAILABLE_ADMIN_PAGES.map((p) => {
                    const isChecked = editPermissions.includes(p.path);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleEditPermission(p.path)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 10px",
                          borderRadius: "var(--radius-sm)",
                          border: isChecked ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                          background: isChecked ? "var(--color-primary-bg)" : "var(--color-bg)",
                          cursor: "pointer",
                          fontSize: "0.82rem",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ cursor: "pointer" }}
                        />
                        <span>{p.icon}</span>
                        <span style={{ fontWeight: isChecked ? "600" : "400" }}>{p.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Optional Reset Password */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", fontSize: "0.9rem" }}>
                Reset Password (Optional)
              </label>
              <input
                type="password"
                placeholder="Leave blank to keep existing password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg)" }}
              />
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                Enter a new password (min 6 characters) only if you want to reset their credentials.
              </p>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="btn btn-secondary"
                style={{ padding: "8px 16px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="btn btn-primary"
                disabled={editSaving}
                style={{ padding: "8px 20px", fontWeight: "600" }}
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAdmin && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--color-bg-elevated)",
              borderRadius: "var(--radius-xl)",
              maxWidth: "460px",
              width: "100%",
              padding: "28px",
              boxShadow: "var(--shadow-lg)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "var(--color-danger-bg)",
                color: "var(--color-danger)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.6rem",
                margin: "0 auto 16px",
              }}
            >
              ⚠️
            </div>

            <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "8px" }}>
              Delete Administrator?
            </h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.88rem", marginBottom: "20px" }}>
              Are you sure you want to remove <strong>{deletingAdmin.name}</strong> ({deletingAdmin.email})? They will immediately lose all access to the Palgutta Ashramam admin dashboard.
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setDeletingAdmin(null)}
                className="btn btn-secondary"
                style={{ padding: "10px 20px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAdmin}
                className="btn"
                disabled={deleteLoading}
                style={{
                  padding: "10px 20px",
                  background: "var(--color-danger)",
                  color: "#fff",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                }}
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete Admin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
