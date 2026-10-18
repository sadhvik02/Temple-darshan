import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createAdmin } from "../services/adminService";
import { AVAILABLE_ADMIN_PAGES } from "../types";
import { useAuth } from "../hooks/useAuth";

export default function CreateAdminPage() {
  const navigate = useNavigate();
  const { adminData } = useAuth();
  const isSuperAdmin = (adminData?.role || "").toUpperCase() === "SUPER_ADMIN";

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"ADMIN" | "SUPER_ADMIN">("ADMIN");
  const [selectedPages, setSelectedPages] = useState<string[]>(
    AVAILABLE_ADMIN_PAGES.map((p) => p.path)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success modal state
  const [createdAdmin, setCreatedAdmin] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
    permissionsCount: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Random strong password generator
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
    setShowPassword(true);
  };

  // Toggle page selection
  const togglePage = (path: string) => {
    if (selectedPages.includes(path)) {
      setSelectedPages(selectedPages.filter((p) => p !== path));
    } else {
      setSelectedPages([...selectedPages, path]);
    }
  };

  const selectAllPages = () => {
    setSelectedPages(AVAILABLE_ADMIN_PAGES.map((p) => p.path));
  };

  const clearAllPages = () => {
    setSelectedPages([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter the administrator's full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid official email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (role === "ADMIN" && selectedPages.length === 0) {
      setError("Please grant access to at least one Admin Page.");
      return;
    }

    setLoading(true);
    try {
      await createAdmin({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        role,
        permissions: role === "SUPER_ADMIN" ? ["all"] : selectedPages,
      });

      setCreatedAdmin({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        permissionsCount: role === "SUPER_ADMIN" ? AVAILABLE_ADMIN_PAGES.length : selectedPages.length,
      });
    } catch (err: any) {
      console.error("Failed to create admin:", err);
      setError(err.message || "Failed to create administrator account. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!createdAdmin) return;
    const text = `*Palgutta Ashramam Admin Portal Credentials*\n\n` +
      `Portal: ${window.location.origin}/login\n` +
      `Name: ${createdAdmin.name}\n` +
      `Email: ${createdAdmin.email}\n` +
      `Temporary Password: ${createdAdmin.password}\n` +
      `Role: ${createdAdmin.role}\n\n` +
      `Please log in and keep your password secure.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setRole("ADMIN");
    setSelectedPages(AVAILABLE_ADMIN_PAGES.map((p) => p.path));
    setCreatedAdmin(null);
    setError(null);
  };

  if (!isSuperAdmin) {
    return (
      <div className="empty-state" style={{ padding: "60px 20px" }}>
        <div className="empty-icon">🔒</div>
        <h3>Restricted Super Admin Area</h3>
        <p>Only users with the SUPER_ADMIN role can create new administrators.</p>
        <button className="btn btn-primary" onClick={() => navigate("/dashboard")} style={{ marginTop: "16px" }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="create-admin-page" style={{ maxWidth: "900px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Breadcrumb Header */}
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", color: "var(--color-text-muted)", marginBottom: "8px" }}>
          <Link to="/admins" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: "600" }}>
            Admins
          </Link>
          <span>›</span>
          <span>Create Admin</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "700" }}>Create Administrator</h1>
            <p style={{ color: "var(--color-text-secondary)", marginTop: "4px" }}>
              Provision a new admin account with customized module permissions for Palgutta Ashramam
            </p>
          </div>
          <Link to="/admins" className="btn btn-secondary" style={{ padding: "8px 16px" }}>
            ← Back to Admins
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: "20px" }}>
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={handleSubmit}>
        {/* Section 1: Administrator Profile */}
        <div className="form-card" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: "24px", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>👤</span> Administrator Profile
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
            <div>
              <label className="form-label" style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>
                Full Name <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Ramesh Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg)" }}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>
                Official Email Address <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="admin@palguttaashramam.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg)" }}
              />
            </div>

            <div>
              <label className="form-label" style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>
                Contact Mobile Number (Optional)
              </label>
              <input
                type="tel"
                className="form-control"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg)" }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Security & Password */}
        <div className="form-card" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: "24px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🔑</span> Login Credentials
            </h3>
            <button
              type="button"
              onClick={generatePassword}
              style={{
                background: "var(--color-primary-bg)",
                color: "var(--color-primary)",
                border: "1px solid var(--color-primary)",
                borderRadius: "var(--radius-sm)",
                padding: "6px 12px",
                fontSize: "0.82rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              ⚡ Generate Strong Password
            </button>
          </div>

          <div>
            <label className="form-label" style={{ display: "block", fontWeight: "600", marginBottom: "6px" }}>
              Password <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="Enter or generate a temporary password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ width: "100%", padding: "10px 42px 10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "var(--color-bg)", fontFamily: showPassword ? "inherit" : "monospace" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1rem",
                  color: "var(--color-text-muted)"
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "6px" }}>
              The new admin will use this password to sign into the Palgutta Ashramam dashboard.
            </p>
          </div>
        </div>

        {/* Section 3: Administrator Role */}
        <div className="form-card" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: "24px", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🛡️</span> Administrative Role
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {/* Standard Admin Card */}
            <div
              onClick={() => setRole("ADMIN")}
              style={{
                border: role === "ADMIN" ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                background: role === "ADMIN" ? "var(--color-primary-bg)" : "var(--color-bg)",
                borderRadius: "var(--radius-md)",
                padding: "18px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.3rem" }}>🪔</span>
                  <span style={{ fontWeight: "700", fontSize: "1rem" }}>Standard Admin</span>
                </div>
                <input
                  type="radio"
                  name="adminRole"
                  checked={role === "ADMIN"}
                  onChange={() => setRole("ADMIN")}
                />
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
                Manages assigned temple modules (e.g. Darshan, Bookings, Services, Events). Cannot create or remove other administrators.
              </p>
            </div>

            {/* Super Admin Card */}
            <div
              onClick={() => setRole("SUPER_ADMIN")}
              style={{
                border: role === "SUPER_ADMIN" ? "2px solid #7c3aed" : "1px solid var(--color-border)",
                background: role === "SUPER_ADMIN" ? "rgba(124, 58, 237, 0.08)" : "var(--color-bg)",
                borderRadius: "var(--radius-md)",
                padding: "18px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.3rem" }}>👑</span>
                  <span style={{ fontWeight: "700", fontSize: "1rem", color: role === "SUPER_ADMIN" ? "#6d28d9" : "inherit" }}>
                    Super Admin
                  </span>
                </div>
                <input
                  type="radio"
                  name="adminRole"
                  checked={role === "SUPER_ADMIN"}
                  onChange={() => setRole("SUPER_ADMIN")}
                />
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
                Full system authority. Has unrestricted access to all modules and can create, promote, and manage other administrators.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Admin Pages (Page Access Permissions) */}
        {role === "ADMIN" && (
          <div className="form-card" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: "24px", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>📑</span> Admin Pages Access
                </h3>
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                  Select the pages this administrator is permitted to view and manage ({selectedPages.length} of {AVAILABLE_ADMIN_PAGES.length} selected)
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={selectAllPages}
                  style={{ fontSize: "0.8rem", padding: "4px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-bg)", border: "1px solid var(--color-border)", cursor: "pointer" }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearAllPages}
                  style={{ fontSize: "0.8rem", padding: "4px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-bg)", border: "1px solid var(--color-border)", cursor: "pointer" }}
                >
                  Clear All
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
              {AVAILABLE_ADMIN_PAGES.map((page) => {
                const isSelected = selectedPages.includes(page.path);
                return (
                  <div
                    key={page.id}
                    onClick={() => togglePage(page.path)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px 14px",
                      borderRadius: "var(--radius-md)",
                      border: isSelected ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                      background: isSelected ? "var(--color-primary-bg)" : "var(--color-bg)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent onClick
                      style={{ marginTop: "3px", cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600", fontSize: "0.92rem" }}>
                        <span>{page.icon}</span>
                        <span>{page.label}</span>
                      </div>
                      <p style={{ fontSize: "0.74rem", color: "var(--color-text-muted)", marginTop: "2px", lineHeight: "1.3" }}>
                        {page.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Submit Bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", marginTop: "16px" }}>
          <Link to="/admins" className="btn btn-secondary" style={{ padding: "10px 20px" }}>
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ padding: "10px 28px", fontWeight: "600", fontSize: "0.95rem" }}
          >
            {loading ? "Creating Administrator..." : "✨ Create Administrator"}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {createdAdmin && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
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
              maxWidth: "520px",
              width: "100%",
              padding: "32px",
              boxShadow: "var(--shadow-lg)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "var(--color-success-bg)",
                color: "var(--color-success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                margin: "0 auto 16px",
              }}
            >
              ✓
            </div>

            <h2 style={{ fontSize: "1.4rem", fontWeight: "700", marginBottom: "8px" }}>
              Administrator Created!
            </h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>
              <strong>{createdAdmin.name}</strong> has been added as a <strong>{createdAdmin.role}</strong> with access to {createdAdmin.permissionsCount} admin modules.
            </p>

            {/* Credential summary box */}
            <div
              style={{
                background: "var(--color-bg-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                textAlign: "left",
                fontSize: "0.85rem",
                marginBottom: "20px",
                border: "1px dashed var(--color-border)",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Portal URL: </span>
                <span style={{ fontWeight: "600" }}>{window.location.origin}/login</span>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Email: </span>
                <span style={{ fontWeight: "600" }}>{createdAdmin.email}</span>
              </div>
              <div style={{ marginBottom: "8px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Password: </span>
                <span style={{ fontWeight: "600", fontFamily: "monospace", background: "#fef3c7", padding: "2px 6px", borderRadius: "4px" }}>
                  {createdAdmin.password}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--color-text-muted)" }}>Role: </span>
                <span style={{ fontWeight: "600", color: createdAdmin.role === "SUPER_ADMIN" ? "#7c3aed" : "var(--color-primary)" }}>
                  {createdAdmin.role}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                onClick={copyCredentials}
                className="btn btn-primary"
                style={{ width: "100%", padding: "11px", fontWeight: "600" }}
              >
                {copied ? "✓ Credentials Copied!" : "📋 Copy Login Credentials"}
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: "10px" }}
                >
                  Create Another
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admins")}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: "10px", background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                >
                  View Admins List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
