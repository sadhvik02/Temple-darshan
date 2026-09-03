import { useEffect, useState, type FormEvent } from "react";
import { DonationService } from "../services/donationService";
import { getDonationTypes, createDonationType, updateDonationType, deleteDonationType } from "../services/donationTypeService";
import type { Donation, DonationType } from "../types";

const CATEGORY_OPTIONS = [
  { value: "general", label: "General Temple Fund", icon: "🏛️" },
  { value: "annadanam", label: "Annadanam (Free Food)", icon: "🍲" },
  { value: "renovation", label: "Temple Renovation / Jirnodharana", icon: "🛕" },
  { value: "festival", label: "Utsavam & Festivals", icon: "🎉" },
  { value: "education", label: "Veda Patashala & Education", icon: "📖" },
  { value: "other", label: "Special Spiritual Cause", icon: "✨" },
];

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationTypes, setDonationTypes] = useState<DonationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [donationSearchQuery, setDonationSearchQuery] = useState("");
  const [donationCategoryFilter, setDonationCategoryFilter] = useState("all");

  const formatDonationDate = (createdAt: any) => {
    if (!createdAt) return { dateStr: "N/A", timeStr: "" };
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
    if (isNaN(d.getTime())) return { dateStr: String(createdAt), timeStr: "" };
    return {
      dateStr: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      timeStr: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
    };
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    category: "general",
    suggestedAmounts: "101, 501, 1001, 5001",
    isActive: true,
    displayOrder: 1,
  });

  const loadDonationTypes = async () => {
    try {
      const data = await getDonationTypes();
      setDonationTypes(data);
    } catch (err) {
      console.error("Error loading donation types:", err);
      setError("Failed to load donation types.");
    }
  };

  const loadDonations = async () => {
    try {
      const data = await DonationService.getAllDonations();
      setDonations(data);
    } catch (err) {
      console.error("Error loading donations:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadDonationTypes(), loadDonations()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleOpenModal = (dt?: DonationType) => {
    if (dt) {
      setEditingId(dt.id!);
      setFormData({
        title: dt.title,
        description: dt.description,
        imageUrl: dt.imageUrl || "",
        category: dt.category,
        suggestedAmounts: dt.suggestedAmounts?.join(", ") || "101, 501, 1001, 5001",
        isActive: dt.isActive,
        displayOrder: dt.displayOrder,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        description: "",
        imageUrl: "",
        category: "general",
        suggestedAmounts: "101, 501, 1001, 5001",
        isActive: true,
        displayOrder: donationTypes.length > 0 ? donationTypes[donationTypes.length - 1].displayOrder + 1 : 1,
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

  const parseSuggestedAmounts = (str: string): number[] => {
    return str
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const amounts = parseSuggestedAmounts(formData.suggestedAmounts);
      if (amounts.length === 0) {
        alert("Please enter at least one valid suggested amount.");
        setSaving(false);
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl || undefined,
        category: formData.category,
        suggestedAmounts: amounts,
        isActive: formData.isActive,
        displayOrder: formData.displayOrder,
      };

      if (editingId) {
        await updateDonationType(editingId, payload);
      } else {
        await createDonationType(payload as any);
      }
      await loadDonationTypes();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving donation type:", err);
      alert("Failed to save donation type.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteDonationType(deleteId);
      await loadDonationTypes();
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting donation type:", err);
      alert("Failed to delete donation type.");
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryInfo = (cat: string) => {
    return CATEGORY_OPTIONS.find((c) => c.value === cat) || { value: cat, label: cat, icon: "💰" };
  };

  if (loading && donationTypes.length === 0) {
    return (
      <div className="empty-state">
        <span className="spinner"></span>
        <p style={{ marginTop: "12px" }}>Loading donation schemes...</p>
      </div>
    );
  }

  const activeCount = donationTypes.filter((d) => d.isActive).length;

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      {/* DONATION FUNDS MANAGEMENT SECTION */}
      <div className="donations-page" style={{ width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}>
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
            <h1 style={{ fontSize: "1.55rem", fontWeight: "800", color: "#0f172a" }}>Donation & Hundi Funds</h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
              Configure temple donation schemes (Annadanam, Renovation, Hundi) and preset contribution amounts.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid var(--color-border)",
                borderRadius: "10px",
                padding: "3px",
                display: "flex",
              }}
            >
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: viewMode === "grid" ? "var(--color-primary-bg)" : "transparent",
                  color: viewMode === "grid" ? "var(--color-primary)" : "var(--color-text-secondary)",
                  fontWeight: "700",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                🗂️ Cards
              </button>
              <button
                onClick={() => setViewMode("table")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: viewMode === "table" ? "var(--color-primary-bg)" : "transparent",
                  color: viewMode === "table" ? "var(--color-primary)" : "var(--color-text-secondary)",
                  fontWeight: "700",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                📋 Table
              </button>
            </div>

            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              + Add Donation Fund
            </button>
          </div>
        </div>

        {/* Summary Chips */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))",
            gap: "14px",
            marginBottom: "22px",
          }}
        >
          <div className="stat-card" style={{ padding: "14px 18px" }}>
            <span style={{ fontSize: "1.4rem" }}>💰</span>
            <div>
              <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#0f172a" }}>{donationTypes.length}</div>
              <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Total Funds</div>
            </div>
          </div>

          <div className="stat-card" style={{ padding: "14px 18px" }}>
            <span style={{ fontSize: "1.4rem" }}>🟢</span>
            <div>
              <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#047857" }}>{activeCount}</div>
              <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Active on Mobile</div>
            </div>
          </div>

          <div className="stat-card" style={{ padding: "14px 18px" }}>
            <span style={{ fontSize: "1.4rem" }}>🍲</span>
            <div>
              <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#b45309" }}>
                {donationTypes.filter((d) => d.category === "annadanam").length}
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Annadanam Funds</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {donationTypes.length === 0 && !error ? (
          <div className="card-section empty-state">
            <div className="empty-icon">💰</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
              No donation funds created yet
            </h3>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "18px" }}>
              Create your first donation fund (e.g. Nitya Annadanam, Temple Renovation, Goshala Seva).
            </p>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              + Create First Donation Fund
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* Cards View */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {donationTypes.map((dt) => {
              const catInfo = getCategoryInfo(dt.category);
              return (
                <div
                  key={dt.id}
                  className="form-card"
                  style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {dt.imageUrl ? (
                          <img
                            src={dt.imageUrl}
                            alt={dt.title}
                            style={{ width: "46px", height: "46px", objectFit: "cover", borderRadius: "10px", border: "1px solid var(--color-border)" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "46px",
                              height: "46px",
                              borderRadius: "10px",
                              background: "linear-gradient(135deg, #ecfdf5, #a7f3d0)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.4rem",
                              border: "1px solid #6ee7b7",
                            }}
                          >
                            {catInfo.icon}
                          </div>
                        )}
                        <div>
                          <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>{dt.title}</h3>
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: "600" }}>
                            {catInfo.label}
                          </span>
                        </div>
                      </div>

                      <span className={`badge ${dt.isActive ? "badge-success" : "badge-neutral"}`}>
                        {dt.isActive ? "● Active" : "● Inactive"}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: "0.86rem",
                        color: "var(--color-text-secondary)",
                        lineHeight: "1.5",
                        marginBottom: "16px",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {dt.description || "Devotee contribution fund for temple causes."}
                    </p>
                  </div>

                  <div>
                    {/* Preset Amounts */}
                    <div style={{ marginBottom: "16px" }}>
                      <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>
                        Preset Suggested Amounts
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {dt.suggestedAmounts?.map((amt) => (
                          <span
                            key={amt}
                            style={{
                              background: "#fef3c7",
                              border: "1px solid #fde68a",
                              color: "#b45309",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "0.78rem",
                              fontWeight: "800",
                            }}
                          >
                            ₹{amt}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                      <button className="btn-icon text-primary" onClick={() => handleOpenModal(dt)}>
                        ✏️ Edit
                      </button>
                      <button className="btn-icon text-danger" onClick={() => setDeleteId(dt.id!)}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="card-section" style={{ padding: 0, overflow: "hidden" }}>
            <div className="table-container" style={{ border: "none" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Donation Fund</th>
                    <th>Category</th>
                    <th>Suggested Amounts</th>
                    <th>Display Order</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {donationTypes.map((dt) => (
                    <tr key={dt.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {dt.imageUrl ? (
                            <img src={dt.imageUrl} alt={dt.title} className="table-img-preview" />
                          ) : (
                            <div className="table-img-placeholder">💰 Fund</div>
                          )}
                          <div>
                            <div style={{ fontWeight: "800", color: "#0f172a" }}>{dt.title}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                              {dt.description?.substring(0, 45)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info">{getCategoryInfo(dt.category).label}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {dt.suggestedAmounts?.map((a) => (
                            <span key={a} className="ref-code">
                              ₹{a}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className="ref-code">#{dt.displayOrder}</span>
                      </td>
                      <td>
                        <span className={`badge ${dt.isActive ? "badge-success" : "badge-neutral"}`}>
                          {dt.isActive ? "● Active" : "● Inactive"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                          <button className="btn-icon text-primary" onClick={() => handleOpenModal(dt)}>
                            Edit
                          </button>
                          <button className="btn-icon text-danger" onClick={() => setDeleteId(dt.id!)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* COMPLETED DONATIONS SECTION */}
      <div style={{ marginTop: "40px" }}>
        {/* Section Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.4rem" }}>💖</span>
              <h2 style={{ fontSize: "1.45rem", fontWeight: "900", color: "#0f172a", margin: 0 }}>
                Completed Devotee Contributions
              </h2>
            </div>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>
              Live real-time ledger of all devotee donations, Annadanam offerings, and online puja contributions.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="🔍 Search donor, phone, or fund..."
                value={donationSearchQuery}
                onChange={(e) => setDonationSearchQuery(e.target.value)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)",
                  fontSize: "0.85rem",
                  width: "240px",
                  background: "#ffffff",
                }}
              />
            </div>

            <select
              value={donationCategoryFilter}
              onChange={(e) => setDonationCategoryFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
                fontSize: "0.85rem",
                background: "#ffffff",
                width: "auto",
              }}
            >
              <option value="all">All Funds</option>
              {donationTypes.map((dt) => (
                <option key={dt.id} value={dt.title}>
                  {dt.title}
                </option>
              ))}
            </select>

            {(donationSearchQuery || donationCategoryFilter !== "all") && (
              <button
                onClick={() => {
                  setDonationSearchQuery("");
                  setDonationCategoryFilter("all");
                }}
                className="btn btn-secondary btn-sm"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* Contribution Metrics Cards */}
        {(() => {
          const totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
          const uniqueDonors = new Set(donations.map((d) => d.donorPhone || d.donorName)).size;
          const avgDonation = donations.length > 0 ? Math.round(totalAmount / donations.length) : 0;

          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              <div className="stat-card" style={{ padding: "12px 18px" }}>
                <span style={{ fontSize: "1.3rem" }}>💰</span>
                <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: "900", color: "#047857" }}>
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
                    Total Collected
                  </div>
                </div>
              </div>

              <div className="stat-card" style={{ padding: "12px 18px" }}>
                <span style={{ fontSize: "1.3rem" }}>📜</span>
                <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: "900", color: "#0f172a" }}>
                    {donations.length}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
                    Total Contributions
                  </div>
                </div>
              </div>

              <div className="stat-card" style={{ padding: "12px 18px" }}>
                <span style={{ fontSize: "1.3rem" }}>👥</span>
                <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: "900", color: "#2563eb" }}>
                    {uniqueDonors}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
                    Unique Devotees
                  </div>
                </div>
              </div>

              <div className="stat-card" style={{ padding: "12px 18px" }}>
                <span style={{ fontSize: "1.3rem" }}>✨</span>
                <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: "900", color: "#b45309" }}>
                    ₹{avgDonation.toLocaleString("en-IN")}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
                    Average Donation
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Filtered Donations Table */}
        {(() => {
          const filtered = donations.filter((d) => {
            const query = donationSearchQuery.toLowerCase().trim();
            const matchesSearch =
              !query ||
              (d.donorName || "").toLowerCase().includes(query) ||
              (d.donorPhone || "").includes(query) ||
              (d.donationTypeName || "").toLowerCase().includes(query);

            const matchesCategory =
              donationCategoryFilter === "all" ||
              (d.donationTypeName || "").toLowerCase().includes(donationCategoryFilter.toLowerCase());

            return matchesSearch && matchesCategory;
          });

          return (
            <div className="card-section" style={{ padding: 0, overflow: "hidden", borderRadius: "14px", border: "1px solid var(--color-border)" }}>
              <div className="table-container" style={{ border: "none" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ whiteSpace: "nowrap" }}>Contribution Date</th>
                      <th style={{ whiteSpace: "nowrap" }}>Donor Details</th>
                      <th style={{ whiteSpace: "nowrap" }}>Contact Number</th>
                      <th style={{ whiteSpace: "nowrap" }}>Donation Scheme / Fund</th>
                      <th style={{ whiteSpace: "nowrap" }}>Dakshina Amount</th>
                      <th style={{ whiteSpace: "nowrap" }}>Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "36px", color: "var(--color-text-secondary)" }}>
                          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🙏</div>
                          <div style={{ fontWeight: "700", color: "#0f172a" }}>No contribution records found</div>
                          <div style={{ fontSize: "0.82rem", marginTop: "4px" }}>
                            {donations.length === 0 ? "Completed devotee offerings will appear here automatically." : "Try adjusting your search filters."}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((donation) => {
                        const { dateStr, timeStr } = formatDonationDate(donation.createdAt);
                        const initial = (donation.donorName || "D").trim().charAt(0).toUpperCase() || "D";
                        const isAnnadanam = (donation.donationTypeName || "").toLowerCase().includes("annadanam");

                        return (
                          <tr key={donation.id}>
                            {/* Date & Time */}
                            <td style={{ whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: "800", color: "#0f172a", fontSize: "0.88rem" }}>
                                  📅 {dateStr}
                                </span>
                                {timeStr && (
                                  <span style={{ fontSize: "0.74rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                                    ⏰ {timeStr}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Donor Name & Avatar */}
                            <td style={{ whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div
                                  style={{
                                    width: "34px",
                                    height: "34px",
                                    borderRadius: "10px",
                                    background: "linear-gradient(135deg, #fff7ed, #ffedd5)",
                                    border: "1px solid #fed7aa",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: "900",
                                    fontSize: "0.9rem",
                                    color: "#ea580c",
                                  }}
                                >
                                  {initial}
                                </div>
                                <div>
                                  <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "0.92rem" }}>
                                    {donation.donorName || "Anonymous Devotee"}
                                  </div>
                                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                                    Devotee
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Phone */}
                            <td style={{ whiteSpace: "nowrap" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  backgroundColor: "#f8fafc",
                                  border: "1px solid #e2e8f0",
                                  fontSize: "0.8rem",
                                  fontWeight: "700",
                                  color: "#334155",
                                }}
                              >
                                📞 {donation.donorPhone || "N/A"}
                              </span>
                            </td>

                            {/* Donation Type */}
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
                                  backgroundColor: isAnnadanam ? "#fff7ed" : "#f0fdf4",
                                  color: isAnnadanam ? "#c2410c" : "#15803d",
                                  border: `1px solid ${isAnnadanam ? "#fed7aa" : "#bbf7d0"}`,
                                }}
                              >
                                {isAnnadanam ? "🍲" : "🪔"} {donation.donationTypeName || "Temple Offering"}
                              </span>
                            </td>

                            {/* Amount */}
                            <td style={{ whiteSpace: "nowrap" }}>
                              <span
                                style={{
                                  fontSize: "1.05rem",
                                  fontWeight: "900",
                                  color: "#047857",
                                  letterSpacing: "-0.3px",
                                }}
                              >
                                ₹{donation.amount?.toLocaleString("en-IN") ?? 0}
                              </span>
                            </td>

                            {/* Payment Status */}
                            <td style={{ whiteSpace: "nowrap" }}>
                              <span className="badge badge-success" style={{ fontSize: "0.72rem", padding: "3px 8px" }}>
                                ● Received (Online)
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? "Edit Donation Fund" : "Create Donation Fund"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formData.imageUrl && (
                  <div
                    style={{
                      height: "220px",
                      borderRadius: "12px",
                      background: "#0f172a",
                      border: "1px solid var(--color-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        borderRadius: "12px",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Donation Fund Title *</label>
                  <input
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Nitya Annadanam Fund"
                  />
                </div>

                <div className="form-group">
                  <label>Cause Category *</label>
                  <select value={formData.category} onChange={(e) => handleInputChange("category", e.target.value)}>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Purpose & Spiritual Significance *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe how the devotee's donation will be utilized..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Cover Image URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="form-group">
                  <label>Suggested Preset Amounts (Comma-separated) *</label>
                  <input
                    required
                    value={formData.suggestedAmounts}
                    onChange={(e) => handleInputChange("suggestedAmounts", e.target.value)}
                    placeholder="101, 501, 1001, 5001"
                  />
                  <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => handleInputChange("suggestedAmounts", "51, 101, 501, 1001, 5001")}
                      style={{ fontSize: "0.75rem", background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontWeight: "700" }}
                    >
                      51 to 5001
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange("suggestedAmounts", "501, 1001, 2501, 5001, 10001")}
                      style={{ fontSize: "0.75rem", background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontWeight: "700" }}
                    >
                      501 to 10001
                    </button>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Display Priority</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.displayOrder}
                      onChange={(e) => handleInputChange("displayOrder", parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="form-group flex-checkbox">
                    <label className="checkbox-label" style={{ marginTop: "24px" }}>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange("isActive", e.target.checked)}
                      />
                      <span>Active for Online Donations</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner spinner-sm" /> : "Save Donation Fund"}
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
                Are you sure you want to delete this donation scheme?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Fund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
