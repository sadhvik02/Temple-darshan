import { useState, useEffect, type FormEvent } from "react";
import { getNews, createNews, updateNews, deleteNews } from "../services/newsService";
import { getTempleInfo, updateMobileAnnouncementsAndVideos, toggleDarshanStatus } from "../services/templeService";
import type { News, FeaturedVideo } from "../types";
import ImageUploadInput from "../components/ImageUploadInput";

export default function NewsPage() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageUrl: "",
    isPublished: true,
  });

  // Mobile Feature Controls State
  const [isDarshanEnabled, setIsDarshanEnabled] = useState(false);
  const [scrollingAnnouncement, setScrollingAnnouncement] = useState("");
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [announcementSavedMsg, setAnnouncementSavedMsg] = useState("");

  // Multiple Sacred Videos State
  const [featuredVideos, setFeaturedVideos] = useState<FeaturedVideo[]>([]);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideoIndex, setEditingVideoIndex] = useState<number | null>(null);
  const [savingVideo, setSavingVideo] = useState(false);
  const [videoFormData, setVideoFormData] = useState<FeaturedVideo>({
    id: "",
    title: "",
    videoUrl: "",
    thumbnailUrl: "",
  });

  const loadNews = async () => {
    setLoading(true);
    try {
      const data = await getNews();
      setNewsList(data);
    } catch (err) {
      console.error("Error loading news:", err);
      setError("Failed to load news articles.");
    } finally {
      setLoading(false);
    }
  };

  const loadTempleSettings = async () => {
    try {
      const info = await getTempleInfo();
      if (info) {
        setIsDarshanEnabled(!!info.isDarshanEnabled);
        setScrollingAnnouncement(info.scrollingAnnouncement || "");
        let vids = info.featuredVideos || [];
        if (vids.length === 0 && info.featuredVideoUrl) {
          vids = [
            {
              id: "vid_1",
              title: info.featuredVideoTitle || "Abhishekam",
              videoUrl: info.featuredVideoUrl,
            },
          ];
        }
        setFeaturedVideos(vids);
      }
    } catch (e) {
      console.error("Error loading temple settings in NewsPage:", e);
    }
  };

  useEffect(() => {
    loadNews();
    loadTempleSettings();
  }, []);

  const handleToggleDarshan = async (enabled: boolean) => {
    setIsDarshanEnabled(enabled);
    try {
      await toggleDarshanStatus(enabled);
    } catch (e) {
      console.error("Error updating darshan status:", e);
      setIsDarshanEnabled(!enabled);
      alert("Failed to update darshan status.");
    }
  };

  const handleSaveAnnouncement = async () => {
    setSavingAnnouncement(true);
    try {
      await updateMobileAnnouncementsAndVideos({ scrollingAnnouncement });
      setAnnouncementSavedMsg("✅ Ticker saved & live in app!");
      setTimeout(() => setAnnouncementSavedMsg(""), 3500);
    } catch (e) {
      console.error("Error saving announcement ticker:", e);
      alert("Failed to save announcement ticker.");
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleOpenVideoModal = (video?: FeaturedVideo, index?: number) => {
    if (video !== undefined && index !== undefined) {
      setEditingVideoIndex(index);
      setVideoFormData({ ...video });
    } else {
      setEditingVideoIndex(null);
      setVideoFormData({
        id: `vid_${Date.now()}`,
        title: "",
        videoUrl: "",
        thumbnailUrl: "",
      });
    }
    setIsVideoModalOpen(true);
  };

  const handleSaveVideo = async (e: FormEvent) => {
    e.preventDefault();
    if (!videoFormData.videoUrl.trim()) {
      alert("Please enter a valid video URL.");
      return;
    }
    setSavingVideo(true);
    try {
      let updated: FeaturedVideo[];
      if (editingVideoIndex !== null) {
        updated = [...featuredVideos];
        updated[editingVideoIndex] = { ...videoFormData };
      } else {
        updated = [...featuredVideos, { ...videoFormData, id: videoFormData.id || `vid_${Date.now()}` }];
      }
      await updateMobileAnnouncementsAndVideos({ featuredVideos: updated });
      setFeaturedVideos(updated);
      setIsVideoModalOpen(false);
      setAnnouncementSavedMsg("✅ Sacred video updated live!");
      setTimeout(() => setAnnouncementSavedMsg(""), 3500);
    } catch (err) {
      console.error("Error saving video:", err);
      alert("Failed to save video.");
    } finally {
      setSavingVideo(false);
    }
  };

  const handleDeleteVideo = async (index: number) => {
    if (!window.confirm("Remove this video from the mobile app slider?")) return;
    const updated = featuredVideos.filter((_, i) => i !== index);
    try {
      await updateMobileAnnouncementsAndVideos({ featuredVideos: updated });
      setFeaturedVideos(updated);
      setAnnouncementSavedMsg("✅ Video removed from slider!");
      setTimeout(() => setAnnouncementSavedMsg(""), 3500);
    } catch (err) {
      console.error("Error deleting video:", err);
      alert("Failed to delete video.");
    }
  };

  const handleOpenModal = (newsItem?: News) => {
    if (newsItem) {
      setEditingId(newsItem.id!);
      setFormData({
        title: newsItem.title,
        content: newsItem.content,
        imageUrl: newsItem.imageUrl || "",
        isPublished: newsItem.isPublished,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        content: "",
        imageUrl: "",
        isPublished: true,
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateNews(editingId, formData);
      } else {
        await createNews(formData);
      }
      await loadNews();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving news:", err);
      alert("Failed to save news article.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteNews(deleteId);
      await loadNews();
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting news:", err);
      alert("Failed to delete news article.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading && newsList.length === 0) {
    return (
      <div className="empty-state">
        <span className="spinner"></span>
        <p style={{ marginTop: "12px" }}>Loading announcements...</p>
      </div>
    );
  }

  const publishedCount = newsList.filter((n) => n.isPublished).length;
  const draftCount = newsList.filter((n) => !n.isPublished).length;

  return (
    <div className="news-page" style={{ width: "100%", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }}>
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
          <h1 style={{ fontSize: "1.55rem", fontWeight: "800", color: "#0f172a" }}>Temple News & Announcements</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginTop: "4px" }}>
            Publish live temple circulars, emergency announcements, and sliding home screen bulletins.
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
            + Post Announcement
          </button>
        </div>
      </div>

      {/* Metric Chips */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))",
          gap: "14px",
          marginBottom: "22px",
        }}
      >
        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span style={{ fontSize: "1.4rem" }}>📢</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#0f172a" }}>{newsList.length}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Total Bulletins</div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span style={{ fontSize: "1.4rem" }}>🟢</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#047857" }}>{publishedCount}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Live on Mobile App</div>
          </div>
        </div>

        <div className="stat-card" style={{ padding: "14px 18px" }}>
          <span style={{ fontSize: "1.4rem" }}>📝</span>
          <div>
            <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#b45309" }}>{draftCount}</div>
            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Unpublished Drafts</div>
          </div>
        </div>
      </div>

      {announcementSavedMsg && (
        <div className="alert alert-success" style={{ marginBottom: "18px" }}>
          <span>✨</span> {announcementSavedMsg}
        </div>
      )}

      {/* 1. Mobile App Feature Controls & Marquee Ticker */}
      <div className="card-section" style={{ marginBottom: "22px", padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.3rem" }}>📱</span>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
              Mobile App Feature Controls & Live Marquee Ticker
            </h3>
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
            Controls live behavior of devotee mobile app
          </span>
        </div>

        {/* Darshan Master Toggle */}
        <div
          style={{
            background: isDarshanEnabled ? "#f0fdf4" : "#fef2f2",
            border: `1.5px solid ${isDarshanEnabled ? "#86efac" : "#fca5a5"}`,
            borderRadius: "12px",
            padding: "14px 18px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.1rem" }}>{isDarshanEnabled ? "🟢" : "🔴"}</span>
              <strong style={{ fontSize: "0.95rem", color: isDarshanEnabled ? "#15803d" : "#b91c1c" }}>
                Darshan Feature: {isDarshanEnabled ? "ENABLED (Visible in App)" : "DISABLED (Hidden in App)"}
              </strong>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#475569", lineHeight: "1.4" }}>
              {isDarshanEnabled
                ? "Devotees can view Darshan catalog, check timings, and book tokens from mobile app."
                : "Darshan is completely hidden from devotee mobile app (grid & navigation). Ashram Seva is prioritized."}
            </p>
          </div>
          <label style={{ flexShrink: 0, cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={isDarshanEnabled}
              onChange={(e) => handleToggleDarshan(e.target.checked)}
              style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "#059669" }}
            />
            <span style={{ marginLeft: "8px", fontWeight: "700", fontSize: "0.88rem", color: "#0f172a" }}>
              {isDarshanEnabled ? "Active" : "Off"}
            </span>
          </label>
        </div>

        {/* Scrolling Announcement Marquee Input */}
        <div>
          <label style={{ display: "block", fontWeight: "700", fontSize: "0.88rem", color: "#0f172a", marginBottom: "6px" }}>
            <span>📢</span> Scrolling Announcement Ticker (Continuous Marquee Text)
          </label>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
            <textarea
              rows={2}
              style={{
                flex: "1 1 300px",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--color-border)",
                fontSize: "0.9rem",
                lineHeight: "1.5",
              }}
              value={scrollingAnnouncement}
              onChange={(e) => setScrollingAnnouncement(e.target.value)}
              placeholder="e.g., 🪔 Dussera Brahmotsavams starting tomorrow. Devotees are cordially invited for Anna Prasadam."
            />
            <button
              className="btn btn-primary"
              style={{ alignSelf: "flex-start", padding: "10px 18px", whiteSpace: "nowrap" }}
              disabled={savingAnnouncement}
              onClick={handleSaveAnnouncement}
            >
              {savingAnnouncement ? "Saving Ticker..." : "💾 Save Ticker"}
            </button>
          </div>
          <span style={{ display: "block", marginTop: "6px", fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>
            This text scrolls continuously across devotee screens right under the main header on both iOS and Android.
          </span>
        </div>
      </div>

      {/* 2. Sacred Ashram Videos (Horizontal Video Slider for Mobile App) */}
      <div className="card-section" style={{ marginBottom: "28px", padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.3rem" }}>🎥</span>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                Sacred Ashram Videos (Mobile App Slider)
              </h3>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "800",
                  padding: "3px 8px",
                  borderRadius: "20px",
                  background: featuredVideos.length > 0 ? "#dcfce7" : "#fee2e2",
                  color: featuredVideos.length > 0 ? "#15803d" : "#b91c1c",
                }}
              >
                {featuredVideos.length} {featuredVideos.length === 1 ? "Video" : "Videos"} Live
              </span>
            </div>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.84rem", margin: "4px 0 0 0" }}>
              These videos slide horizontally directly below the scrolling announcement ticker on the mobile home screen. Devotees can scroll through multiple videos and watch them.
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => handleOpenVideoModal()}>
            + Add Sacred Video
          </button>
        </div>

        {/* Video Cards Grid */}
        {featuredVideos.length === 0 ? (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              background: "#f8fafc",
              borderRadius: "12px",
              border: "1.5px dashed #cbd5e1",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🎬</div>
            <p style={{ margin: 0, fontWeight: "700", color: "#475569", fontSize: "0.95rem" }}>
              No videos currently published to the mobile app home screen.
            </p>
            <p style={{ margin: "4px 0 14px 0", color: "#64748b", fontSize: "0.82rem" }}>
              Click "+ Add Sacred Video" above to link YouTube Shorts, standard YouTube videos, or MP4s. When 2 to 3 videos are added, devotees can scroll and watch them like banners.
            </p>
            <button className="btn btn-secondary" onClick={() => handleOpenVideoModal()}>
              + Add First Video
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {featuredVideos.map((vid, idx) => {
              const ytMatch = vid.videoUrl.match(/(?:watch\?v=|shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
              const ytThumbnail = ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : null;
              const displayThumb = vid.thumbnailUrl || ytThumbnail;

              return (
                <div
                  key={vid.id || idx}
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid var(--color-border)",
                    overflow: "hidden",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      height: "150px",
                      background: "#0f172a",
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {displayThumb ? (
                      <img
                        src={displayThumb}
                        alt={vid.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ fontSize: "2rem" }}>🎥</div>
                    )}
                    <div
                      style={{
                        position: "absolute",
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.65)",
                        border: "2px solid white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "1.2rem",
                        pointerEvents: "none",
                      }}
                    >
                      ▶
                    </div>
                    <span
                      style={{
                        position: "absolute",
                        top: "8px",
                        left: "8px",
                        background: "rgba(220, 38, 38, 0.9)",
                        color: "white",
                        fontSize: "0.68rem",
                        fontWeight: "800",
                        padding: "2px 8px",
                        borderRadius: "12px",
                      }}
                    >
                      Video #{idx + 1}
                    </span>
                  </div>

                  <div style={{ padding: "14px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h4 style={{ margin: "0 0 6px 0", fontSize: "0.95rem", fontWeight: "800", color: "#0f172a" }}>
                        {vid.title || "Sacred Video"}
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.78rem",
                          color: "var(--color-text-secondary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={vid.videoUrl}
                      >
                        🔗 {vid.videoUrl}
                      </p>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--color-border)" }}>
                      <a
                        href={vid.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--color-primary)", textDecoration: "none" }}
                      >
                        Test Link ↗
                      </a>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                          onClick={() => handleOpenVideoModal(vid, idx)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                          onClick={() => handleDeleteVideo(idx)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>
          📰 General Articles & Circulars
        </h3>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {newsList.length === 0 && !error ? (
        <div className="card-section empty-state">
          <div className="empty-icon">📢</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
            No announcements published yet
          </h3>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "18px" }}>
            Post official temple news, pooja schedule changes, or festival updates.
          </p>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            + Post First Announcement
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Cards View */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {newsList.map((item) => (
            <div
              key={item.id}
              className="form-card"
              style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
            >
              <div>
                {item.imageUrl ? (
                  <div
                    style={{
                      height: "150px",
                      backgroundImage: `url(${item.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                      }}
                    >
                      <span className={`badge ${item.isPublished ? "badge-success" : "badge-neutral"}`}>
                        {item.isPublished ? "● Live Published" : "● Draft"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "16px 20px 0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "1.4rem" }}>📢</span>
                    <span className={`badge ${item.isPublished ? "badge-success" : "badge-neutral"}`}>
                      {item.isPublished ? "● Live Published" : "● Draft"}
                    </span>
                  </div>
                )}

                <div style={{ padding: "16px 20px" }}>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.86rem",
                      color: "var(--color-text-secondary)",
                      lineHeight: "1.5",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.content}
                  </p>
                </div>
              </div>

              <div
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid var(--color-border)",
                  background: "#f8fafc",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontWeight: "600" }}>
                  {item.publishedAt?.toDate ? item.publishedAt.toDate().toLocaleDateString() : "Active Bulletin"}
                </span>

                <div className="action-buttons">
                  <button className="btn-icon text-primary" onClick={() => handleOpenModal(item)}>
                    ✏️ Edit
                  </button>
                  <button className="btn-icon text-danger" onClick={() => setDeleteId(item.id!)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="card-section" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-container" style={{ border: "none" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Thumbnail</th>
                  <th>Headline Title</th>
                  <th>Content Preview</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {newsList.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="table-img-preview" />
                      ) : (
                        <div className="table-img-placeholder">📢 News</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: "800", color: "#0f172a" }}>{item.title}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.84rem", color: "var(--color-text-secondary)", maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.content}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${item.isPublished ? "badge-success" : "badge-neutral"}`}>
                        {item.isPublished ? "● Published" : "● Draft"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                        <button className="btn-icon text-primary" onClick={() => handleOpenModal(item)}>
                          Edit
                        </button>
                        <button className="btn-icon text-danger" onClick={() => setDeleteId(item.id!)}>
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? "Edit Announcement" : "Post New Announcement"}</h2>
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
                  <label>Announcement Headline *</label>
                  <input
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Special Mahotsavam on Pournami"
                  />
                </div>

                <div className="form-group">
                  <label>Full Content & Devotee Notice *</label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => handleInputChange("content", e.target.value)}
                    placeholder="Provide complete circular details, guidelines, or timings..."
                    rows={4}
                  />
                </div>

                <ImageUploadInput
                  value={formData.imageUrl}
                  onChange={(url) => handleInputChange("imageUrl", url)}
                  folder="news"
                  label="Cover Image"
                  placeholder="https://... or choose from computer"
                  presets={[
                    { label: "📰 Ashram Announcement", url: "/darshan_general.jpg" },
                    { label: "🪔 Spiritual Satsang", url: "https://temple-darshan-app-d1719.web.app/guruji.png" },
                  ]}
                  helperText="Upload news photo directly from your computer or paste a direct image URL."
                />

                <div className="form-group flex-checkbox" style={{ marginTop: "10px" }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => handleInputChange("isPublished", e.target.checked)}
                    />
                    <span>Publish live immediately to devotee mobile app</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner spinner-sm" /> : "Save & Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Sacred Video Modal */}
      {isVideoModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-md">
            <div className="modal-header">
              <h2>{editingVideoIndex !== null ? "Edit Sacred Ashram Video" : "Add Sacred Ashram Video"}</h2>
              <button className="modal-close" onClick={() => setIsVideoModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveVideo}>
              <div className="modal-body">
                <p style={{ fontSize: "0.86rem", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
                  Add YouTube Shorts, standard YouTube links, or MP4 video URLs. Devotees will be able to swipe through multiple videos horizontally on the mobile app home screen.
                </p>

                {/* Video / Thumbnail Preview */}
                {(() => {
                  const ytMatch = videoFormData.videoUrl.match(/(?:watch\?v=|shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                  const ytThumbnail = ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : null;
                  const thumb = videoFormData.thumbnailUrl || ytThumbnail;
                  if (thumb) {
                    return (
                      <div
                        style={{
                          height: "180px",
                          borderRadius: "12px",
                          background: "#0f172a",
                          border: "1px solid var(--color-border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          marginBottom: "16px",
                          position: "relative",
                        }}
                      >
                        <img
                          src={thumb}
                          alt="Video Preview"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            background: "rgba(0,0,0,0.6)",
                            color: "#fff",
                            padding: "6px 14px",
                            borderRadius: "20px",
                            fontWeight: "700",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          ▶️ Preview Cover
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="form-group">
                  <label>Video Title / Celebration Event *</label>
                  <input
                    required
                    value={videoFormData.title}
                    onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                    placeholder="e.g., Abhishekam, Pournami Divya Darshan, or Ashram Bhajan"
                  />
                </div>

                <div className="form-group">
                  <label>YouTube Video / Shorts URL *</label>
                  <input
                    required
                    value={videoFormData.videoUrl}
                    onChange={(e) => setVideoFormData({ ...videoFormData, videoUrl: e.target.value })}
                    placeholder="e.g., https://youtube.com/shorts/... or https://youtu.be/..."
                  />
                  <small style={{ color: "var(--color-text-secondary)", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
                    Works with YouTube regular links, YouTube Shorts, or direct MP4 URLs. YouTube thumbnail is detected automatically.
                  </small>
                </div>

                <ImageUploadInput
                  value={videoFormData.thumbnailUrl || ""}
                  onChange={(url) => setVideoFormData({ ...videoFormData, thumbnailUrl: url })}
                  folder="videos"
                  label="Custom Thumbnail Cover (Optional)"
                  placeholder="https://... or choose from computer"
                  presets={[
                    { label: "🛕 Temple Mandir", url: "/darshan_general.jpg" },
                    { label: "🪔 Maharaj Satsang", url: "https://temple-darshan-app-d1719.web.app/guruji.png" },
                  ]}
                  helperText="Leave empty if using YouTube (we automatically fetch the YouTube video cover)."
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsVideoModalOpen(false)}
                  disabled={savingVideo}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingVideo}>
                  {savingVideo ? <span className="spinner spinner-sm" /> : "Save Sacred Video"}
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
                Are you sure you want to delete this announcement? It will be removed from devotee feeds.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Bulletin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
