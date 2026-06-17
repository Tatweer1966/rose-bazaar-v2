import { useState, useEffect, useRef } from "react";
import { Upload, Grid, List, Search, Image as ImageIcon, Film, FileText, Trash2, Eye, X, Filter } from "lucide-react";
import useCmsApi from "../hooks/useCmsApi";

export default function MediaManager() {
  const { get, post } = useCmsApi();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    loadMedia();
  }, []);

  async function loadMedia() {
    try {
      const res = await get("/admin/media");
      setMedia(res?.data || res || []);
    } catch (e) {
      console.error("Media load error:", e);
      // Demo data for when API is not ready
      setMedia([
        { id: 1, filename: "hero-banner.jpg", type: "image", url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=300", size: 245000, created_at: new Date().toISOString() },
        { id: 2, filename: "wedding-cake.jpg", type: "image", url: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=300", size: 189000, created_at: new Date().toISOString() },
        { id: 3, filename: "venue-garden.jpg", type: "image", url: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=300", size: 312000, created_at: new Date().toISOString() },
        { id: 4, filename: "flowers-arrangement.jpg", type: "image", url: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=300", size: 278000, created_at: new Date().toISOString() },
        { id: 5, filename: "invitation-design.jpg", type: "image", url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=300", size: 156000, created_at: new Date().toISOString() },
        { id: 6, filename: "bridal-dress.jpg", type: "image", url: "https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=300", size: 198000, created_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  async function handleUpload(files) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        await post("/admin/media/upload", formData);
      }
      await loadMedia();
    } catch (e) {
      console.error("Upload error:", e);
      alert("Upload not available yet — media API endpoint needed.");
    } finally {
      setUploading(false);
    }
  }

  const filtered = media.filter(m =>
    m.filename?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--card-bg)", border: "1px solid var(--card-border)",
            borderRadius: "var(--radius-md)", padding: "7px 12px", width: 240,
          }}>
            <Search size={16} style={{ color: "var(--slate-400)" }} />
            <input
              type="text" placeholder="Search media..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, width: "100%", fontFamily: "'DM Sans', sans-serif", color: "var(--slate-700)" }}
            />
          </div>
          <div style={{ display: "flex", border: "1px solid var(--card-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
            <button onClick={() => setView("grid")} style={{
              padding: "7px 10px", border: "none", cursor: "pointer",
              background: view === "grid" ? "var(--coral)" : "var(--card-bg)",
              color: view === "grid" ? "#fff" : "var(--slate-500)",
            }} aria-label="Grid view"><Grid size={16} /></button>
            <button onClick={() => setView("list")} style={{
              padding: "7px 10px", border: "none", cursor: "pointer",
              background: view === "list" ? "var(--coral)" : "var(--card-bg)",
              color: view === "list" ? "#fff" : "var(--slate-500)",
            }} aria-label="List view"><List size={16} /></button>
          </div>
        </div>
        <button onClick={() => fileRef.current?.click()} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 18px", borderRadius: "var(--radius-md)",
          background: "var(--coral)", color: "#fff", border: "none",
          cursor: "pointer", fontSize: 13, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          transition: "all var(--transition-fast)",
        }}>
          <Upload size={16} /> Upload Files
        </button>
        <input ref={fileRef} type="file" multiple hidden onChange={e => handleUpload(e.target.files)} accept="image/*,video/*,.pdf" />
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${dragOver ? "var(--coral)" : "var(--card-border)"}`,
          borderRadius: "var(--radius-lg)",
          padding: dragOver ? 40 : 0,
          marginBottom: dragOver ? 20 : 0,
          textAlign: "center",
          background: dragOver ? "rgba(254,105,114,0.04)" : "transparent",
          transition: "all var(--transition-normal)",
          height: dragOver ? "auto" : 0,
          overflow: "hidden",
        }}
      >
        <Upload size={32} style={{ color: "var(--coral)", marginBottom: 8 }} />
        <div style={{ fontSize: 14, color: "var(--slate-600)" }}>Drop files here to upload</div>
      </div>

      {/* Media Grid / List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--slate-400)" }}>Loading media...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--slate-400)" }}>
          <ImageIcon size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div>No media found</div>
        </div>
      ) : view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          {filtered.map(item => (
            <div key={item.id} onClick={() => setSelectedItem(item)} style={{
              background: "var(--card-bg)", border: "1px solid var(--card-border)",
              borderRadius: "var(--radius-md)", overflow: "hidden",
              cursor: "pointer", transition: "all var(--transition-fast)",
              boxShadow: "var(--card-shadow)",
            }}>
              <div style={{ height: 140, background: "var(--slate-100)", overflow: "hidden" }}>
                <img src={item.url} alt={item.filename} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => { e.target.style.display = "none"; }} />
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--slate-700)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.filename}
                </div>
                <div style={{ fontSize: 11, color: "var(--slate-400)", marginTop: 2 }}>{formatSize(item.size || 0)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {filtered.map((item, i) => (
            <div key={item.id} onClick={() => setSelectedItem(item)} style={{
              padding: "12px 16px", display: "flex", alignItems: "center", gap: 14,
              borderBottom: i < filtered.length - 1 ? "1px solid var(--card-border)" : "none",
              cursor: "pointer", transition: "background var(--transition-fast)",
            }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-sm)", overflow: "hidden", background: "var(--slate-100)", flexShrink: 0 }}>
                <img src={item.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => { e.target.style.display = "none"; }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--slate-900)" }}>{item.filename}</div>
                <div style={{ fontSize: 11, color: "var(--slate-400)" }}>{formatSize(item.size || 0)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selectedItem && (
        <div style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: 380, background: "var(--card-bg)",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
          zIndex: 50, padding: 24, overflowY: "auto",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, fontFamily: "'Playfair Display', serif" }}>Media Details</h3>
            <button onClick={() => setSelectedItem(null)} style={{
              background: "none", border: "none", cursor: "pointer", color: "var(--slate-500)", padding: 4,
            }} aria-label="Close"><X size={20} /></button>
          </div>
          <div style={{ borderRadius: "var(--radius-md)", overflow: "hidden", marginBottom: 20 }}>
            <img src={selectedItem.url} alt={selectedItem.filename} style={{ width: "100%", display: "block" }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--slate-900)", marginBottom: 12 }}>{selectedItem.filename}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--slate-500)" }}>Size</span>
              <span style={{ color: "var(--slate-700)" }}>{formatSize(selectedItem.size || 0)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--slate-500)" }}>Type</span>
              <span style={{ color: "var(--slate-700)" }}>{selectedItem.type || "image"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
