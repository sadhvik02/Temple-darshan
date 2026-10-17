import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";

export interface PresetImage {
  label: string;
  url: string;
  color?: string;
  badge?: string;
}

interface ImageUploadInputProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  placeholder?: string;
  presets?: PresetImage[];
  helperText?: string;
}

/**
 * Compresses an image in-memory using an HTML5 canvas in ~50ms.
 * Produces a crisp, lightweight JPEG (~30KB-60KB) that saves instantly into Firestore
 * and renders with zero lag on both Web and Flutter mobile app.
 */
function compressImage(file: File, maxWidth = 800, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        // Fallback to raw data url if canvas load fails
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ImageUploadInput({
  value,
  onChange,
  folder = "services",
  label = "Cover Image",
  placeholder = "Paste direct image URL or /path.jpg",
  presets = [],
  helperText,
}: ImageUploadInputProps) {
  const [mode, setMode] = useState<"file" | "url">("file");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isWebPageLink =
    value &&
    (value.includes("chatgpt.com/") ||
      value.includes("google.com/search") ||
      value.includes("bing.com/search") ||
      value.includes("pinterest.com/pin/"));

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadNotice(null);

    try {
      // 1. Instantly compress image in browser (<100ms)
      const compressedDataUrl = await compressImage(file);

      // Immediately set the image so user gets instant preview without waiting!
      onChange(compressedDataUrl);

      // 2. Cloud storage upload attempt
      try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${folder}/${Date.now()}_${cleanName}`;
        const storageRef = ref(storage, storagePath);

        const res = await fetch(compressedDataUrl);
        const blob = await res.blob();

        const uploadTask = uploadBytes(storageRef, blob, {
          contentType: "image/jpeg",
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Storage timeout")), 10000)
        );

        const snap = await Promise.race([uploadTask, timeoutPromise]);
        const cloudUrl = await getDownloadURL(snap.ref);
        onChange(cloudUrl);
        setUploadNotice(null);
      } catch (storageErr: any) {
        console.warn("Storage upload status:", storageErr);
        if (storageErr?.status_ === 404 || storageErr?.code === "storage/unknown") {
          setUploadNotice(
            "⚠️ Cloud Storage is not activated yet in Firebase Console. This photo is currently saved locally. To make uploaded computer photos appear on ALL devotee phones: enable Storage in Firebase Console (1 click), or use presets below / paste an image URL."
          );
        }
      } finally {
        setIsUploading(false);
      }
    } catch (err: any) {
      console.error("Error processing image:", err);
      setUploadError("Could not process image file. Please try another image.");
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <label style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text)" }}>
          {label}
        </label>
        {/* Source Mode Toggle: Computer vs URL */}
        <div
          style={{
            display: "inline-flex",
            background: "#f1f5f9",
            padding: "2px",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
          }}
        >
          <button
            type="button"
            onClick={() => setMode("file")}
            style={{
              padding: "4px 10px",
              fontSize: "0.78rem",
              fontWeight: 600,
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              background: mode === "file" ? "#ffffff" : "transparent",
              color: mode === "file" ? "var(--color-primary)" : "var(--color-text-secondary)",
              boxShadow: mode === "file" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            💻 From Computer
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            style={{
              padding: "4px 10px",
              fontSize: "0.78rem",
              fontWeight: 600,
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              background: mode === "url" ? "#ffffff" : "transparent",
              color: mode === "url" ? "var(--color-primary)" : "var(--color-text-secondary)",
              boxShadow: mode === "url" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            🔗 Image Link
          </button>
        </div>
      </div>

      {/* Mode 1: Upload from Computer */}
      {mode === "file" && (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/*"
            style={{ display: "none" }}
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: isDragging
                ? "2px dashed var(--color-primary)"
                : "2px dashed #cbd5e1",
              background: isDragging ? "rgba(217, 119, 6, 0.05)" : "#f8fafc",
              borderRadius: "12px",
              padding: "1.25rem 1rem",
              textAlign: "center",
              cursor: isUploading ? "wait" : "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {isUploading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.6rem" }}>⏳</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primary)" }}>
                  Processing Image...
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "1.8rem" }}>📁</span>
                <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--color-text)" }}>
                  Click to choose image from computer
                </div>
                <div style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
                  or drag & drop your image file here (JPG, PNG, WEBP)
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Paste Direct Link */}
      {mode === "url" && (
        <div>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setUploadError(null);
              onChange(e.target.value);
            }}
            placeholder={placeholder}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              fontSize: "0.88rem",
            }}
          />
        </div>
      )}

      {/* Warning if user pasted a web page / chat link instead of direct image */}
      {isWebPageLink && (
        <div
          style={{
            marginTop: "6px",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "#fffbeb",
            border: "1px solid #fde68a",
            color: "#b45309",
            fontSize: "0.78rem",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>⚠️</span>
          <span>
            This looks like a web page link rather than a direct image file. Please click{" "}
            <strong>From Computer</strong> above to upload the actual image file directly.
          </span>
        </div>
      )}

      {uploadError && (
        <div style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: "4px" }}>
          {uploadError}
        </div>
      )}

      {uploadNotice && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.35)",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "0.78rem",
            color: "#d97706",
            marginTop: "6px",
            lineHeight: 1.45,
          }}
        >
          {uploadNotice}
        </div>
      )}

      {/* Quick Preset Buttons */}
      {presets.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginTop: "8px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>
            Presets:
          </span>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setUploadError(null);
                onChange(p.url);
              }}
              style={{
                fontSize: "0.75rem",
                background: p.color ? `rgba(${p.color}, 0.1)` : "rgba(217, 119, 6, 0.1)",
                border: `1px solid ${p.color ? `rgba(${p.color}, 0.3)` : "rgba(217, 119, 6, 0.3)"}`,
                borderRadius: "6px",
                padding: "3px 8px",
                color: "var(--color-text)",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.15s ease",
              }}
            >
              {p.label}
            </button>
          ))}
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              style={{
                fontSize: "0.75rem",
                background: "none",
                border: "none",
                color: "#ef4444",
                cursor: "pointer",
                fontWeight: 600,
                marginLeft: "4px",
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      )}

      {/* Helper text */}
      {helperText && (
        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
          {helperText}
        </div>
      )}

      {/* Image Preview Box */}
      {value && (
        <div
          style={{
            marginTop: "12px",
            position: "relative",
            height: "190px",
            borderRadius: "12px",
            background: "#0f172a",
            border: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <img
            src={value}
            alt="Cover Preview"
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
          <button
            type="button"
            onClick={() => onChange("")}
            title="Remove image"
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: "rgba(239, 68, 68, 0.9)",
              color: "#ffffff",
              border: "none",
              borderRadius: "50%",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 700,
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            }}
          >
            ✕
          </button>
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              left: "8px",
              background: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(4px)",
              color: "#ffffff",
              fontSize: "0.72rem",
              padding: "2px 8px",
              borderRadius: "4px",
              maxWidth: "80%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {value.startsWith("data:") ? (
              <span style={{ color: "#fbbf24", fontWeight: 600 }}>
                ⚠️ Local Device Only (Enable Storage for All Phones)
              </span>
            ) : value.startsWith("https://firebasestorage") || value.startsWith("https://temple-darshan") ? (
              <span style={{ color: "#34d399", fontWeight: 600 }}>
                ☁️ Live on All Phones (CDN)
              </span>
            ) : (
              value
            )}
          </div>
        </div>
      )}
    </div>
  );
}
