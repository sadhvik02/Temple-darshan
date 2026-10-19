import { useState, useEffect, useRef } from "react";

interface ImageCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  initialOffsetY?: number;
  initialZoom?: number;
  onApply: (croppedDataUrl: string, offsetY: number) => Promise<void> | void;
  onClose: () => void;
  aspectRatio?: number; // width / height, defaults to 16 / 9
}

/**
 * Loads an image into an HTMLImageElement in a way that allows canvas export
 * without CORS tainted canvas security errors.
 */
async function loadImageForCanvas(src: string): Promise<{ img: HTMLImageElement; cleanup: () => void }> {
  // If it's already a local data URL or blob URL, load directly
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ img, cleanup: () => {} });
      img.onerror = reject;
      img.src = src;
    });
  }

  // Strategy 1: Fetch as Blob with a unique cache-buster param to bypass non-CORS browser cache
  try {
    const bustUrl = src.includes("?")
      ? `${src}&_cb=${Date.now()}`
      : `${src}?_cb=${Date.now()}`;
    const res = await fetch(bustUrl, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ img, cleanup: () => URL.revokeObjectURL(blobUrl) });
        img.onerror = (e) => {
          URL.revokeObjectURL(blobUrl);
          reject(e);
        };
        img.src = blobUrl;
      });
    }
  } catch (err) {
    console.warn("Direct blob fetch with CORS cache-bust failed, trying direct crossOrigin:", err);
  }

  // Strategy 2: Direct crossOrigin = "anonymous" with cache-buster
  try {
    const bustUrl = src.includes("?")
      ? `${src}&_cb=${Date.now()}`
      : `${src}?_cb=${Date.now()}`;
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve({ img, cleanup: () => {} });
      img.onerror = reject;
      img.src = bustUrl;
    });
  } catch (err) {
    console.warn("Direct crossOrigin failed, trying CORS proxy fallback:", err);
  }

  // Strategy 3: Fast CORS proxy fallback
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(src)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ img, cleanup: () => URL.revokeObjectURL(blobUrl) });
        img.onerror = (e) => {
          URL.revokeObjectURL(blobUrl);
          reject(e);
        };
        img.src = blobUrl;
      });
    }
  } catch (err) {
    console.warn("Proxy fetch failed:", err);
  }

  // Final fallback: standard image load
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ img, cleanup: () => {} });
    img.onerror = reject;
    img.src = src;
  });
}

export default function ImageCropModal({
  isOpen,
  imageUrl,
  initialOffsetY = 50,
  initialZoom = 1,
  onApply,
  onClose,
  aspectRatio = 16 / 9,
}: ImageCropModalProps) {
  const [offsetY, setOffsetY] = useState(initialOffsetY); // 0 = top, 50 = center, 100 = bottom
  const [offsetX, setOffsetX] = useState(50);
  const [zoom, setZoom] = useState(initialZoom);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!isOpen || !imageUrl) return;
    setOffsetY(initialOffsetY);
    setOffsetX(50);
    setZoom(initialZoom);
    setApplyError(null);
  }, [isOpen, imageUrl, initialOffsetY, initialZoom]);

  if (!isOpen || !imageUrl) return null;

  const handleApply = async () => {
    setIsApplying(true);
    setApplyError(null);
    let cleanupFn: (() => void) | null = null;

    try {
      const { img, cleanup } = await loadImageForCanvas(imageUrl);
      cleanupFn = cleanup;

      const W = img.naturalWidth || img.width;
      const H = img.naturalHeight || img.height;
      const imgAspect = W / H;

      const targetW = 1200;
      const targetH = Math.round(targetW / aspectRatio); // 675 for 16:9

      let sWidth: number;
      let sHeight: number;
      let sX = 0;
      let sY = 0;

      if (imgAspect < aspectRatio) {
        // Image is taller than 16:9 (portrait / 4:3)
        sWidth = W / zoom;
        sHeight = sWidth / aspectRatio;
        const maxOffsetY = Math.max(0, H - sHeight);
        sY = maxOffsetY * (offsetY / 100);
        sX = (W - sWidth) * (offsetX / 100);
      } else {
        // Image is wider than 16:9
        sHeight = H / zoom;
        sWidth = sHeight * aspectRatio;
        const maxOffsetX = Math.max(0, W - sWidth);
        sX = maxOffsetX * (offsetX / 100);
        sY = (H - sHeight) * (offsetY / 100);
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not initialize 2D canvas context");
      }

      // Draw cropped slice
      ctx.drawImage(img, sX, sY, sWidth, sHeight, 0, 0, targetW, targetH);

      let croppedDataUrl = imageUrl;
      try {
        croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      } catch (taintErr) {
        console.warn("Canvas export tainted, using original image with focal alignment:", taintErr);
      }

      // Apply crop and framing
      await onApply(croppedDataUrl, offsetY);
      setIsApplying(false);
      onClose();
    } catch (e: any) {
      console.error("Error cropping image:", e);
      // Fallback: apply framing offset even if canvas fails completely
      try {
        await onApply(imageUrl, offsetY);
        setIsApplying(false);
        onClose();
      } catch (fallbackErr: any) {
        setApplyError("Could not save cropped image: " + (fallbackErr?.message || e?.message || "Unknown error"));
        setIsApplying(false);
      }
    } finally {
      if (cleanupFn) cleanupFn();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "620px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#0f172a" }}>
              ✂️ Adjust Banner Framing (16:9)
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
              Drag the slider to frame Swamiji & sacred elements perfectly for devotee phones.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Live 16:9 Banner Preview Box */}
        <div style={{ padding: "20px 20px 10px 20px" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              maxHeight: "310px",
              borderRadius: "14px",
              overflow: "hidden",
              background: "#0f172a",
              border: "2px solid #f59e0b",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            }}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop preview"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: `${offsetX}% ${offsetY}%`,
                transform: `scale(${zoom})`,
                transformOrigin: `${offsetX}% ${offsetY}%`,
                transition: "object-position 0.08s ease-out, transform 0.1s ease",
              }}
            />

            {/* Dotted Grid Overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                border: "1px dashed rgba(255,255,255,0.3)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gridTemplateRows: "1fr 1fr 1fr",
              }}
            >
              <div style={{ borderRight: "1px dashed rgba(255,255,255,0.2)", borderBottom: "1px dashed rgba(255,255,255,0.2)" }} />
              <div style={{ borderRight: "1px dashed rgba(255,255,255,0.2)", borderBottom: "1px dashed rgba(255,255,255,0.2)" }} />
              <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.2)" }} />
              <div style={{ borderRight: "1px dashed rgba(255,255,255,0.2)", borderBottom: "1px dashed rgba(255,255,255,0.2)" }} />
              <div style={{ borderRight: "1px dashed rgba(255,255,255,0.2)", borderBottom: "1px dashed rgba(255,255,255,0.2)" }} />
              <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.2)" }} />
              <div style={{ borderRight: "1px dashed rgba(255,255,255,0.2)" }} />
              <div style={{ borderRight: "1px dashed rgba(255,255,255,0.2)" }} />
              <div />
            </div>

            {/* Banner live badge */}
            <div
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                background: "rgba(0,0,0,0.65)",
                color: "#fff",
                fontSize: "0.72rem",
                fontWeight: "700",
                padding: "3px 8px",
                borderRadius: "12px",
                backdropFilter: "blur(4px)",
              }}
            >
              📱 Live Devotee Banner View
            </div>
          </div>
        </div>

        {/* Framing Controls */}
        <div style={{ padding: "10px 20px 20px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Quick Preset Buttons */}
          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
              Quick Position:
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setOffsetY(10)}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: offsetY <= 20 ? "2px solid #f59e0b" : "1px solid #cbd5e1",
                  background: offsetY <= 20 ? "#fef3c7" : "#f8fafc",
                  color: offsetY <= 20 ? "#b45309" : "#334155",
                  fontWeight: "700",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                ⬆️ Top (Heads & Face)
              </button>
              <button
                type="button"
                onClick={() => setOffsetY(50)}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: offsetY > 30 && offsetY < 70 ? "2px solid #f59e0b" : "1px solid #cbd5e1",
                  background: offsetY > 30 && offsetY < 70 ? "#fef3c7" : "#f8fafc",
                  color: offsetY > 30 && offsetY < 70 ? "#b45309" : "#334155",
                  fontWeight: "700",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                ⏺️ Center (Balanced)
              </button>
              <button
                type="button"
                onClick={() => setOffsetY(85)}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: offsetY >= 75 ? "2px solid #f59e0b" : "1px solid #cbd5e1",
                  background: offsetY >= 75 ? "#fef3c7" : "#f8fafc",
                  color: offsetY >= 75 ? "#b45309" : "#334155",
                  fontWeight: "700",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                ⬇️ Bottom Focus
              </button>
            </div>
          </div>

          {/* Vertical Framing Slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155" }}>
                Fine-tune Vertical Position:
              </label>
              <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#f59e0b" }}>
                {offsetY}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={offsetY}
              onChange={(e) => setOffsetY(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#f59e0b", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#64748b", marginTop: "2px" }}>
              <span>Show Top</span>
              <span>Center</span>
              <span>Show Bottom</span>
            </div>
          </div>

          {/* Zoom Slider */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#334155" }}>
                Zoom / Scale:
              </label>
              <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#f59e0b" }}>
                {zoom.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="2"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#f59e0b", cursor: "pointer" }}
            />
          </div>
        </div>

        {/* Error notice if cropping fails */}
        {applyError && (
          <div
            style={{
              margin: "0 20px 10px 20px",
              padding: "10px 14px",
              background: "#fee2e2",
              border: "1px solid #f87171",
              borderRadius: "8px",
              color: "#991b1b",
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>⚠️</span>
            <span>{applyError}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div
          style={{
            padding: "14px 20px",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isApplying}
            style={{ padding: "8px 18px", fontSize: "0.9rem" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying}
            className="btn btn-primary"
            style={{
              padding: "8px 22px",
              fontSize: "0.9rem",
              fontWeight: "800",
              background: isApplying ? "#d97706" : "#f59e0b",
              borderColor: "#d97706",
            }}
          >
            {isApplying ? "⏳ Applying & Saving..." : "✂️ Apply & Save 16:9 Banner"}
          </button>
        </div>
      </div>
    </div>
  );
}
