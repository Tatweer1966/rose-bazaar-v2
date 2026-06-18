import { useState, useEffect } from "react";
import {
  Package, Eye, Trash2, Star, CheckCircle, XCircle,
  AlertTriangle, MessageSquare, X, ShoppingBag,
  Crown, Zap, Check, Flame, Shield, MapPin, RefreshCw,
} from "lucide-react";
import DataTable from "../components/DataTable";

const API = "http://localhost:9000";

const STATUSES = {
  pending:  { label: "Pending Review", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  icon: AlertTriangle },
  active:   { label: "Live",           color: "#22c55e", bg: "rgba(34,197,94,0.1)",   icon: CheckCircle  },
  rejected: { label: "Rejected",       color: "#ef4444", bg: "rgba(239,68,68,0.1)",   icon: XCircle      },
  paused:   { label: "Paused",         color: "#64748b", bg: "rgba(100,116,139,0.1)", icon: Package      },
  expired:  { label: "Expired",        color: "#f97316", bg: "rgba(249,115,22,0.1)",  icon: AlertTriangle},
};

const PLANS = {
  TOP:   { label: "Top",   color: "#D4AF37", icon: Crown },
  PRO:   { label: "Pro",   color: "#6366f1", icon: Zap   },
  BASIC: { label: "Basic", color: "#22c55e", icon: Check },
  LITE:  { label: "Lite",  color: "#94a3b8", icon: null  },
};

const REJECTION_REASONS = [
  "Poor quality or missing images",
  "Incomplete listing information",
  "Invalid or misleading pricing",
  "Duplicate content",
  "Inappropriate content",
  "Vendor not verified",
  "Price below minimum threshold",
  "Other",
];

const MENU_SECTIONS = [
  { id: "shop",     label: "Shop Products",    desc: "Wedding products marketplace" },
  { id: "services", label: "Wedding Services", desc: "Photography, makeup, etc."    },
  { id: "venues",   label: "Wedding Venues",   desc: "Halls and outdoor venues"     },
  { id: "happyhour",label: "Happy Hour",       desc: "Time-limited vendor deals"    },
];

export default function ListingManager() {
  const [listings,     setListings]     = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState("pending");
  const [section,      setSection]      = useState("shop");
  const [selected,     setSelected]     = useState(null);
  const [showReject,   setShowReject]   = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote,   setRejectNote]   = useState("");
  const [processing,   setProcessing]   = useState(null);
  const [planModal,    setPlanModal]    = useState(null);
  const [planForm,     setPlanForm]     = useState({ plan_type: "TOP", is_featured: false, is_verified: false });

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { loadListings(); }, [filter, section]);

  async function loadStats() {
    try {
      const res = await fetch(`${API}/api/shop/admin/stats`).then(r => r.json());
      if (res.success) setStats(res.data);
    } catch {}
  }

  async function loadListings() {
    setLoading(true);
    try {
      // Shop section hits real API
      if (section === "shop") {
        const url = filter === "all"
          ? `${API}/api/shop/admin/products`
          : `${API}/api/shop/admin/products?status=${filter}`;
        const res = await fetch(url).then(r => r.json());
        setListings(res.success ? (res.data || []) : []);
      } else {
        // Services/venues/happy-hour use vendor_profiles with vendor_type filter
        const typeMap = { services: "service", venues: "venue", happyhour: "happy_hour" };
        const res = await fetch(`${API}/api/admin/vendors`).then(r => r.json());
        const all = res.result?.data || res.data || [];
        setListings(all.filter(v =>
          filter === "all" ? true :
          filter === "pending" ? v.registration_status === "submitted" :
          filter === "active"  ? v.registration_status === "approved"  :
          v.registration_status === filter
        ));
      }
    } catch (e) {
      console.error(e);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id) {
    setProcessing(id);
    try {
      if (section === "shop") {
        await fetch(`${API}/api/shop/admin/products/${id}/approve`, { method: "PUT" });
        setListings(prev => prev.map(l => l.id === id ? { ...l, status: "active" } : l));
      } else {
        await fetch(`${API}/api/admin/approve/${id}`);
        setListings(prev => prev.map(l => l.id === id ? { ...l, registration_status: "approved", is_verified: true } : l));
      }
      setSelected(null);
      loadStats();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(id) {
    if (!rejectReason) return;
    setProcessing(id);
    try {
      if (section === "shop") {
        await fetch(`${API}/api/shop/admin/products/${id}/reject`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason + (rejectNote ? ` — ${rejectNote}` : "") }),
        });
        setListings(prev => prev.map(l => l.id === id ? { ...l, status: "rejected", rejection_reason: rejectReason } : l));
      } else {
        setListings(prev => prev.map(l => l.id === id ? { ...l, registration_status: "rejected" } : l));
      }
      setShowReject(null);
      setSelected(null);
      setRejectReason("");
      setRejectNote("");
      loadStats();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  }

  async function handleUpgradePlan(id) {
    try {
      await fetch(`${API}/api/shop/admin/products/${id}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planForm),
      });
      setListings(prev => prev.map(l => l.id === id ? { ...l, ...planForm } : l));
      setPlanModal(null);
    } catch (e) {
      console.error(e);
    }
  }

  // Derive status key for current section
  function getStatus(row) {
    if (section === "shop") return row.status || "pending";
    const s = row.registration_status;
    if (s === "submitted") return "pending";
    if (s === "approved")  return "active";
    return s || "pending";
  }

  const pendingCount = listings.filter(l => getStatus(l) === "pending").length;
  const filtered = filter === "all" ? listings : listings.filter(l => getStatus(l) === filter);

  const columns = [
    {
      key: "name", label: "Listing",
      render: (v, row) => {
        const img = row.cover_image || row.display_image;
        const name = row.name || row.title || row.business_name || "—";
        const vendor = row.business_name || row.vendor_name || row.vendor_email || "";
        const plan = PLANS[row.plan_type];
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, overflow: "hidden", background: "#f1f5f9", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {img
                ? <img src={img} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <ShoppingBag size={20} style={{ color: "#94a3b8" }} />
              }
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
                {name}
                {row.is_featured && <Flame size={11} style={{ color: "#FE6972" }} />}
                {row.is_verified && <Shield size={11} style={{ color: "#22c55e" }} />}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 5 }}>
                {vendor}
                {plan && (
                  <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: plan.color + "20", color: plan.color, fontWeight: 700 }}>
                    {plan.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: "category_name", label: "Category",
      render: (v, row) => (
        <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4, background: (row.category_color || "#FE6972") + "15", color: row.category_color || "#FE6972", fontWeight: 600 }}>
          {v || row.category || "—"}
        </span>
      )
    },
    {
      key: "price", label: "Price",
      render: (v, row) => v
        ? <span style={{ fontWeight: 700, fontSize: 13 }}>{parseFloat(v).toLocaleString()} {row.currency || "EGP"}</span>
        : <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>
    },
    {
      key: "city", label: "City",
      render: v => v
        ? <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} style={{ color: "#94a3b8" }} />{v}</span>
        : <span style={{ color: "#94a3b8" }}>—</span>
    },
    {
      key: "status", label: "Status",
      render: (v, row) => {
        const key = getStatus(row);
        const s = STATUSES[key] || STATUSES.pending;
        const Icon = s.icon;
        return (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Icon size={11} />{s.label}
          </span>
        );
      }
    },
    {
      key: "view_count", label: "Views",
      render: v => <span style={{ fontSize: 12, color: "#64748b" }}>{v || 0}</span>
    },
    {
      key: "inquiry_count", label: "Inquiries",
      render: v => v > 0
        ? <span style={{ fontSize: 12, fontWeight: 600, color: "#FE6972" }}>{v}</span>
        : <span style={{ fontSize: 12, color: "#94a3b8" }}>0</span>
    },
    {
      key: "created_at", label: "Submitted",
      render: v => v ? <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(v).toLocaleDateString()}</span> : "—"
    },
  ];

  return (
    <div>
      {/* Section selector — the 4 marketplace menus */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {MENU_SECTIONS.map(s => (
          <button key={s.id} onClick={() => { setSection(s.id); setFilter("pending"); }}
            style={{
              padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: section === s.id ? "none" : "1px solid #e2e8f0",
              background: section === s.id ? "var(--coral)" : "#fff",
              color: section === s.id ? "#fff" : "#64748b",
            }}>
            {s.label}
            <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.75, marginTop: 1 }}>{s.desc}</div>
          </button>
        ))}
      </div>

      {/* Stats row — shop only */}
      {section === "shop" && stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Total",     value: stats.total_listings,    color: "#64748b" },
            { label: "Pending",   value: stats.pending_listings,  color: "#f59e0b" },
            { label: "Live",      value: stats.active_listings,   color: "#22c55e" },
            { label: "Rejected",  value: stats.rejected_listings, color: "#ef4444" },
            { label: "Inquiries", value: stats.total_inquiries,   color: "#FE6972" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pending alert */}
      {pendingCount > 0 && (
        <div style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.08),rgba(254,105,114,0.08))", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "12px 20px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={18} style={{ color: "#f59e0b" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#92400e" }}>{pendingCount} listings awaiting review</span>
          </div>
          <button onClick={() => setFilter("pending")} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            Review Now
          </button>
        </div>
      )}

      {/* Status filter tabs */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            ["all",      "All"         ],
            ["pending",  "Pending"     ],
            ["active",   "Live"        ],
            ["rejected", "Rejected"    ],
            ["paused",   "Paused"      ],
          ].map(([val, label]) => {
            const count = val === "all" ? listings.length : listings.filter(l => getStatus(l) === val).length;
            const dot = { pending: "#f59e0b", active: "#22c55e", rejected: "#ef4444", paused: "#94a3b8" }[val];
            return (
              <button key={val} onClick={() => setFilter(val)}
                style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: filter === val ? "none" : "1px solid #e2e8f0", background: filter === val ? "var(--coral)" : "#fff", color: filter === val ? "#fff" : "#64748b", display: "flex", alignItems: "center", gap: 5 }}>
                {dot && <span style={{ width: 7, height: 7, borderRadius: "50%", background: filter === val ? "#fff" : dot }} />}
                {label} ({count})
              </button>
            );
          })}
        </div>
        <button onClick={loadListings} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <RefreshCw size={13} />Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Loading listings...</div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          pageSize={15}
          emptyMessage={filter === "pending" ? "No pending listings — all caught up! ✓" : "No listings found"}
          onRowClick={setSelected}
          actions={row => {
            const status = getStatus(row);
            const btns = [];
            if (status === "pending") {
              btns.push(
                <button key="approve" onClick={e => { e.stopPropagation(); handleApprove(row.id); }}
                  disabled={processing === row.id}
                  style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "rgba(34,197,94,0.1)", color: "#22c55e", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle size={13} />{processing === row.id ? "..." : "Approve"}
                </button>
              );
              btns.push(
                <button key="reject" onClick={e => { e.stopPropagation(); setShowReject(row); }}
                  style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <XCircle size={13} />Reject
                </button>
              );
            }
            if (section === "shop" && status === "active") {
              btns.push(
                <button key="plan" onClick={e => { e.stopPropagation(); setPlanModal(row); setPlanForm({ plan_type: row.plan_type || "TOP", is_featured: row.is_featured || false, is_verified: row.is_verified || false }); }}
                  style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#D4AF37", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  <Crown size={13} />
                </button>
              );
            }
            btns.push(
              <button key="view" onClick={e => { e.stopPropagation(); setSelected(row); }}
                style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                <Eye size={13} />
              </button>
            );
            return btns;
          }}
          bulkActions={[
            { label: "✓ Approve All", color: "rgba(34,197,94,0.1)", textColor: "#22c55e", onClick: ids => ids.forEach(id => handleApprove(id)) },
            { label: "✕ Reject All",  color: "rgba(239,68,68,0.1)", textColor: "#ef4444", onClick: ids => { if (confirm(`Reject ${ids.length} listings?`)) ids.forEach(id => { fetch(`${API}/api/shop/admin/products/${id}/reject`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: "Bulk rejected" }) }); setListings(prev => prev.map(l => ids.includes(l.id) ? { ...l, status: "rejected" } : l)); }); } },
          ]}
        />
      )}

      {/* ── DETAIL DRAWER ─────────────────────────────────────── */}
      {selected && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 440, background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 50, overflowY: "auto" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, margin: 0 }}>Listing Review</h3>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
          </div>

          <div style={{ padding: 24 }}>
            {/* Cover image */}
            {selected.cover_image && (
              <img src={selected.cover_image} alt="" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 12, marginBottom: 16 }} />
            )}

            {/* Status */}
            {(() => {
              const key = getStatus(selected);
              const s = STATUSES[key] || STATUSES.pending;
              const Icon = s.icon;
              return (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 20, background: s.bg, color: s.color, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
                  <Icon size={13} />{s.label}
                </div>
              );
            })()}

            <div style={{ fontSize: 19, fontWeight: 700, fontFamily: "'Playfair Display',serif", marginBottom: 4 }}>
              {selected.name || selected.title || selected.business_name}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
              {selected.business_name || selected.vendor_name || selected.vendor_email}
              {selected.is_verified && <span style={{ marginLeft: 6, fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "rgba(34,197,94,0.1)", color: "#22c55e", fontWeight: 700 }}>VERIFIED</span>}
            </div>

            {/* Details grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                ["Price",    selected.price ? `${parseFloat(selected.price).toLocaleString()} ${selected.currency || "EGP"}` : "—"],
                ["Category", selected.category_name || selected.category || "—"],
                ["City",     selected.city || selected.vendor_city || "—"],
                ["Plan",     selected.plan_type || "LITE"],
                ["Views",    selected.view_count || 0],
                ["Inquiries",selected.inquiry_count || 0],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: 10, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{String(val)}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            {(selected.description || selected.bio) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Description</div>
                <div style={{ fontSize: 13, color: "#334155", background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", lineHeight: 1.6 }}>
                  {selected.description || selected.bio}
                </div>
              </div>
            )}

            {/* Tags */}
            {selected.tags?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
                {selected.tags.map(t => (
                  <span key={t} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 12, background: "#f1f5f9", color: "#475569" }}>{t}</span>
                ))}
              </div>
            )}

            {/* Rejection reason */}
            {selected.rejection_reason && (
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, marginBottom: 4 }}>Rejection Reason</div>
                <div style={{ fontSize: 13, color: "#7f1d1d" }}>{selected.rejection_reason}</div>
              </div>
            )}

            {/* Quality flags */}
            {((!selected.cover_image) || parseFloat(selected.price) < 100) && (
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600, marginBottom: 6 }}>⚠ Quality Flags</div>
                {!selected.cover_image && <div style={{ fontSize: 12, color: "#92400e", marginBottom: 3 }}>• No cover image uploaded</div>}
                {parseFloat(selected.price) < 100 && <div style={{ fontSize: 12, color: "#92400e" }}>• Price below 100 EGP — verify this is correct</div>}
              </div>
            )}

            {/* Action buttons */}
            {getStatus(selected) === "pending" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleApprove(selected.id)} disabled={processing === selected.id}
                  style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <CheckCircle size={16} />{processing === selected.id ? "Approving..." : "Approve & Publish"}
                </button>
                <button onClick={() => { setShowReject(selected); setSelected(null); }}
                  style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <XCircle size={16} />Reject
                </button>
              </div>
            )}
            {getStatus(selected) === "active" && section === "shop" && (
              <button onClick={() => { setPlanModal(selected); setPlanForm({ plan_type: selected.plan_type || "TOP", is_featured: selected.is_featured || false, is_verified: selected.is_verified || false }); setSelected(null); }}
                style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", background: "#D4AF37", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Crown size={16} />Upgrade Plan / Feature
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ──────────────────────────────────────── */}
      {showReject && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 440, maxHeight: "80vh", overflowY: "auto" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, marginBottom: 4 }}>Reject Listing</h3>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
              {showReject.name || showReject.title || showReject.business_name}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 8 }}>Reason *</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {REJECTION_REASONS.map(r => (
                  <label key={r} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", padding: "7px 10px", borderRadius: 6, background: rejectReason === r ? "rgba(239,68,68,0.06)" : "#f8fafc", border: rejectReason === r ? "1px solid rgba(239,68,68,0.3)" : "1px solid #e2e8f0" }}>
                    <input type="radio" checked={rejectReason === r} onChange={() => setRejectReason(r)} style={{ accentColor: "#ef4444" }} />
                    {r}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Additional feedback for vendor</label>
              <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Optional — will be shown to the vendor..." rows={3}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, resize: "vertical", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => handleReject(showReject.id)} disabled={!rejectReason || processing === showReject.id}
                style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", background: rejectReason ? "#ef4444" : "#e2e8f0", color: rejectReason ? "#fff" : "#94a3b8", cursor: rejectReason ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 14 }}>
                {processing === showReject.id ? "Rejecting..." : "Reject Listing"}
              </button>
              <button onClick={() => { setShowReject(null); setRejectReason(""); setRejectNote(""); }}
                style={{ padding: "11px 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PLAN UPGRADE MODAL ────────────────────────────────── */}
      {planModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 380 }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, marginBottom: 4 }}>Upgrade Listing Plan</h3>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>{planModal.name || planModal.title}</div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 8 }}>Plan Type</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["LITE","BASIC","PRO","TOP"].map(p => {
                  const plan = PLANS[p];
                  return (
                    <button key={p} onClick={() => setPlanForm(f => ({ ...f, plan_type: p }))}
                      style={{ padding: "8px 16px", borderRadius: 8, border: planForm.plan_type === p ? "none" : "1px solid #e2e8f0", background: planForm.plan_type === p ? plan.color : "#fff", color: planForm.plan_type === p ? "#fff" : "#64748b", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                      {plan.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={planForm.is_featured} onChange={e => setPlanForm(f => ({ ...f, is_featured: e.target.checked }))} style={{ accentColor: "#FE6972" }} />
                Featured Badge
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={planForm.is_verified} onChange={e => setPlanForm(f => ({ ...f, is_verified: e.target.checked }))} style={{ accentColor: "#22c55e" }} />
                Verified Badge
              </label>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => handleUpgradePlan(planModal.id)}
                style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", background: "#D4AF37", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                Save Changes
              </button>
              <button onClick={() => setPlanModal(null)}
                style={{ padding: "11px 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
