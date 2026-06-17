import { useState, useEffect } from "react";
import { Package, Eye, Trash2, Plus, Star, CheckCircle, XCircle, AlertTriangle, MessageSquare, Filter, ChevronDown, X } from "lucide-react";
import DataTable from "../components/DataTable";

const API = "/api/cms";

const STATUSES = {
  pending_review: { label: "Pending Review", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: AlertTriangle },
  approved: { label: "Approved", color: "#22c55e", bg: "rgba(34,197,94,0.1)", icon: CheckCircle },
  rejected: { label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: XCircle },
  draft: { label: "Draft", color: "#64748b", bg: "rgba(100,116,139,0.1)", icon: Package },
  needs_changes: { label: "Needs Changes", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", icon: MessageSquare },
};

const REJECTION_REASONS = [
  "Poor quality images",
  "Incomplete listing information",
  "Invalid or misleading pricing",
  "Duplicate content",
  "Inappropriate content",
  "Vendor not verified",
  "Other",
];

const DEMO = [
  { id: 1, title: "Premium Rose Bouquet Collection", vendor_name: "Bloom & Petal Florals", vendor_status: "approved", category: "flowers", price: 450, currency: "SAR", status: "approved", featured: true, created_at: "2026-05-10T10:00:00Z", images: 5, description: "Premium hand-picked rose arrangements for wedding ceremonies and receptions." },
  { id: 2, title: "Grand Ballroom Package", vendor_name: "Royal Venue Events", vendor_status: "approved", category: "venues", price: 15000, currency: "SAR", status: "approved", featured: true, created_at: "2026-05-11T14:00:00Z", images: 12, description: "Luxury ballroom with full decoration, lighting, and catering for up to 500 guests." },
  { id: 3, title: "Full Day Photography", vendor_name: "Lens of Love Photography", vendor_status: "approved", category: "photography", price: 3500, currency: "SAR", status: "pending_review", featured: false, created_at: "2026-05-13T09:00:00Z", images: 8, description: "Complete wedding day coverage including pre-ceremony, ceremony, and reception." },
  { id: 4, title: "3-Tier Wedding Cake", vendor_name: "Sweet Layers Bakery", vendor_status: "pending", category: "catering", price: 2200, currency: "SAR", status: "pending_review", featured: false, created_at: "2026-05-13T11:00:00Z", images: 3, description: "Custom designed three-tier cake with fondant decoration." },
  { id: 5, title: "Complete Wedding Planning", vendor_name: "Elegance Planners", vendor_status: "approved", category: "planning", price: 25000, currency: "SAR", status: "approved", featured: true, created_at: "2026-05-12T16:00:00Z", images: 6, description: "Full-service wedding coordination from venue selection to day-of management." },
  { id: 6, title: "Garden Ceremony Setup", vendor_name: "Royal Venue Events", vendor_status: "approved", category: "decorations", price: 5000, currency: "SAR", status: "pending_review", featured: false, created_at: "2026-05-14T08:00:00Z", images: 2, description: "Outdoor garden ceremony setup with arch, seating, and floral arrangements." },
  { id: 7, title: "Budget Flower Package", vendor_name: "Quick Flowers Co.", vendor_status: "pending", category: "flowers", price: 50, currency: "SAR", status: "rejected", featured: false, created_at: "2026-05-12T10:00:00Z", images: 1, rejection_reason: "Poor quality images", description: "Basic flower arrangement." },
  { id: 8, title: "DJ & Entertainment", vendor_name: "Party Sounds", vendor_status: "approved", category: "entertainment", price: 4000, currency: "SAR", status: "needs_changes", featured: false, created_at: "2026-05-13T15:00:00Z", images: 0, description: "Professional DJ services for weddings.", admin_note: "Please add portfolio images and detailed package breakdown." },
];

export default function ListingManager() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending_review");
  const [selected, setSelected] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => { loadListings(); }, []);

  async function loadListings() {
    setLoading(true);
    try {
      const res = await fetch(API + "/admin/listings").then(r => { if (!r.ok) throw new Error("API"); return r.json(); });
      setListings(Array.isArray(res) ? res : res?.data || []);
    } catch { setListings(DEMO); }
    finally { setLoading(false); }
  }

  function updateStatus(id, status, extra = {}) {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status, ...extra } : l));
    setSelected(null);
    setShowRejectModal(null);
  }

  function handleReject(id) {
    updateStatus(id, "rejected", { rejection_reason: rejectReason, admin_note: rejectNote });
    setRejectReason("");
    setRejectNote("");
  }

  const filtered = filter === "all" ? listings : listings.filter(l => l.status === filter);
  const pendingCount = listings.filter(l => l.status === "pending_review").length;
  const flagged = listings.filter(l => l.images < 3 || l.price < 100 || !l.description);

  const columns = [
    { key: "title", label: "Listing", render: (v, row) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(254,105,114,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Package size={18} style={{ color: "var(--coral)" }} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
            {row.vendor_name}
            {row.vendor_status === "pending" && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontWeight: 700 }}>UNVERIFIED</span>}
          </div>
        </div>
      </div>
    )},
    { key: "category", label: "Category", render: v => <span style={{ textTransform: "capitalize", fontSize: 12, padding: "2px 8px", borderRadius: 4, background: "#f1f5f9", color: "#475569" }}>{v}</span> },
    { key: "price", label: "Price", render: (v, row) => <span style={{ fontWeight: 700, fontSize: 14 }}>{v?.toLocaleString()} {row.currency}</span> },
    { key: "status", label: "Status", render: v => {
      const s = STATUSES[v] || STATUSES.draft;
      const Icon = s.icon;
      return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon size={12} />{s.label}</span>;
    }},
    { key: "featured", label: "Featured", render: v => v ? <Star size={16} style={{ color: "#D4AF37", fill: "#D4AF37" }} /> : <Star size={16} style={{ color: "#e2e8f0" }} /> },
    { key: "images", label: "Images", render: v => (
      <span style={{ fontSize: 12, color: v < 3 ? "#ef4444" : "#64748b", fontWeight: v < 3 ? 600 : 400 }}>
        {v || 0} {v < 3 && <AlertTriangle size={11} style={{ marginLeft: 2 }} />}
      </span>
    )},
  ];

  return (
    <div>
      {/* Pending Alert Banner */}
      {pendingCount > 0 && (
        <div style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(254,105,114,0.08))", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "12px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={18} style={{ color: "#f59e0b" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#92400e" }}>{pendingCount} listings awaiting your review</span>
          </div>
          <button onClick={() => setFilter("pending_review")} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Review Now</button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[["all","All",null],["pending_review","Pending","#f59e0b"],["approved","Approved","#22c55e"],["needs_changes","Needs Changes","#8b5cf6"],["rejected","Rejected","#ef4444"],["draft","Draft","#64748b"]].map(([val,label,dot]) => {
            const count = val === "all" ? listings.length : listings.filter(l => l.status === val).length;
            return (
              <button key={val} onClick={() => setFilter(val)} style={{
                padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: filter === val ? "none" : "1px solid #e2e8f0",
                background: filter === val ? "var(--coral)" : "#fff",
                color: filter === val ? "#fff" : "#64748b",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}>
                {dot && <span style={{ width: 7, height: 7, borderRadius: "50%", background: filter === val ? "#fff" : dot }} />}
                {label} ({count})
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>{filtered.length} listings shown</div>
      </div>

      {loading ? <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading...</div> : (
        <DataTable
          columns={columns}
          data={filtered}
          pageSize={10}
          emptyMessage={filter === "pending_review" ? "No pending listings to review" : "No listings found"}
          onRowClick={setSelected}
          actions={row => {
            const btns = [];
            if (row.status === "pending_review" || row.status === "needs_changes") {
              btns.push(<button key="approve" onClick={() => updateStatus(row.id, "approved")} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "rgba(34,197,94,0.1)", color: "#22c55e", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle size={13} /> Approve</button>);
              btns.push(<button key="reject" onClick={() => setShowRejectModal(row)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><XCircle size={13} /> Reject</button>);
            }
            btns.push(<button key="view" onClick={() => setSelected(row)} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><Eye size={13} /></button>);
            return btns;
          }}
          bulkActions={[
            { label: "Approve", color: "rgba(34,197,94,0.1)", textColor: "#22c55e", onClick: ids => ids.forEach(id => updateStatus(id, "approved")) },
            { label: "Reject", color: "rgba(239,68,68,0.1)", textColor: "#ef4444", onClick: ids => ids.forEach(id => updateStatus(id, "rejected", { rejection_reason: "Bulk rejected" })) },
          ]}
        />
      )}

      {/* Review Detail Drawer */}
      {selected && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 420, background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 50, padding: 24, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Listing Review</h3>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 20 }}><X size={20} /></button>
          </div>

          {/* Status */}
          {(() => { const s = STATUSES[selected.status] || STATUSES.draft; const Icon = s.icon; return <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 20, background: s.bg, color: s.color, fontSize: 12, fontWeight: 600, marginBottom: 16 }}><Icon size={14} />{s.label}</div>; })()}

          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>{selected.title}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
            {selected.vendor_name}
            {selected.vendor_status === "pending" && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontWeight: 700 }}>UNVERIFIED VENDOR</span>}
            {selected.vendor_status === "approved" && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "rgba(34,197,94,0.15)", color: "#22c55e", fontWeight: 700 }}>VERIFIED</span>}
          </div>

          {/* Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 12, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Price</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.price?.toLocaleString()} {selected.currency}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Category</div>
              <div style={{ fontSize: 14, fontWeight: 600, textTransform: "capitalize" }}>{selected.category}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Images</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: selected.images < 3 ? "#ef4444" : "#0f172a" }}>{selected.images || 0} {selected.images < 3 && "- Low!"}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Featured</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{selected.featured ? "Yes" : "No"}</div>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Description</div>
            <div style={{ fontSize: 13, color: "#334155", background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", lineHeight: 1.6 }}>{selected.description || "No description provided"}</div>
          </div>

          {/* Rejection info */}
          {selected.rejection_reason && (
            <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, marginBottom: 4 }}>Rejection Reason</div>
              <div style={{ fontSize: 13, color: "#7f1d1d" }}>{selected.rejection_reason}</div>
            </div>
          )}
          {selected.admin_note && (
            <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <div style={{ fontSize: 11, color: "#8b5cf6", fontWeight: 600, marginBottom: 4 }}>Admin Note</div>
              <div style={{ fontSize: 13, color: "#4c1d95" }}>{selected.admin_note}</div>
            </div>
          )}

          {/* Quality Flags */}
          {(selected.images < 3 || selected.price < 100) && (
            <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600, marginBottom: 6 }}>Quality Flags</div>
              {selected.images < 3 && <div style={{ fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={12} /> Low image count ({selected.images})</div>}
              {selected.price < 100 && <div style={{ fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={12} /> Unusually low price</div>}
            </div>
          )}

          {/* Actions */}
          {(selected.status === "pending_review" || selected.status === "needs_changes") && (
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={() => updateStatus(selected.id, "approved")} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><CheckCircle size={16} /> Approve</button>
              <button onClick={() => { setShowRejectModal(selected); setSelected(null); }} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><XCircle size={16} /> Reject</button>
              <button onClick={() => updateStatus(selected.id, "needs_changes", { admin_note: "Please improve listing" })} style={{ padding: "11px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#8b5cf6", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}><MessageSquare size={14} /> Request Changes</button>
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 420, maxHeight: "80vh", overflowY: "auto" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 4 }}>Reject Listing</h3>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{showRejectModal.title} by {showRejectModal.vendor_name}</div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Reason *</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {REJECTION_REASONS.map(r => (
                  <label key={r} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155", cursor: "pointer", padding: "6px 10px", borderRadius: 6, background: rejectReason === r ? "rgba(239,68,68,0.08)" : "#f8fafc", border: rejectReason === r ? "1px solid rgba(239,68,68,0.3)" : "1px solid #e2e8f0" }}>
                    <input type="radio" name="reason" checked={rejectReason === r} onChange={() => setRejectReason(r)} style={{ accentColor: "#ef4444" }} />
                    {r}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Additional Notes</label>
              <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Optional feedback for the vendor..." rows={3}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, resize: "vertical", fontFamily: "'DM Sans', sans-serif" }} />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => handleReject(showRejectModal.id)} disabled={!rejectReason} style={{
                flex: 1, padding: "10px", borderRadius: 8, border: "none",
                background: rejectReason ? "#ef4444" : "#e2e8f0", color: rejectReason ? "#fff" : "#94a3b8",
                cursor: rejectReason ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 14,
              }}>Reject Listing</button>
              <button onClick={() => { setShowRejectModal(null); setRejectReason(""); setRejectNote(""); }} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
