// ============================================================
// MarketplaceProducts.jsx  — Shop Products specialized page
// ============================================================
import { useState, useEffect } from "react";
import { ShoppingBag, Eye, MessageCircle, Star, Edit, Trash2, CheckCircle, XCircle, RefreshCw, Plus, X, AlertTriangle, Tag, Package } from "lucide-react";
import DataTable from "../components/DataTable";

const API = "/api/cms";

const STATUS = {
  pending:  { label: "Pending",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  active:   { label: "Live",     color: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
  rejected: { label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
  paused:   { label: "Paused",   color: "#64748b", bg: "rgba(100,116,139,0.1)" },
};

const CONDITION = {
  new:      { label: "New",       color: "#22c55e" },
  like_new: { label: "Like New",  color: "#6366f1" },
  excellent:{ label: "Excellent", color: "#3b82f6" },
  good:     { label: "Good",      color: "#f59e0b" },
  used:     { label: "Used",      color: "#94a3b8" },
};

const PLAN_COLORS = { TOP: "#D4AF37", PRO: "#6366f1", BASIC: "#22c55e", LITE: "#94a3b8" };

export function MarketplaceProducts({ onNavigate }) {
  const [items,         setItems]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState("all");
  const [typeFilter,    setTypeFilter]    = useState("all"); // all|new|used
  const [selected,      setSelected]      = useState(null);
  const [rejectReason,  setRejectReason]  = useState("");
  const [showReject,    setShowReject]    = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/shop/admin/products").then(r => r.json());
      if (res.success) setItems(res.data || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function approve(id) {
    await fetch("/api/shop/admin/products/" + id + "/approve", { method: "PUT" });
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: "active" } : i));
    if (selected?.id === id) setSelected(p => p ? { ...p, status: "active" } : null);
  }

  async function reject(id) {
    if (!rejectReason) return;
    await fetch("/api/shop/admin/products/" + id + "/reject", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason })
    });
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: "rejected", rejection_reason: rejectReason } : i));
    setShowReject(null); setRejectReason(""); setSelected(null);
  }

  async function del(id) {
    if (!confirm("Delete this listing?")) return;
    await fetch("/api/shop/vendor/undefined/products/" + id, { method: "DELETE" }).catch(() => {});
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const filtered = items.filter(i => {
    const sMatch = filter === "all" ? true : i.status === filter;
    const tMatch = typeFilter === "all" ? true : i.item_type === typeFilter;
    return sMatch && tMatch;
  });

  const stats = {
    total:    items.length,
    live:     items.filter(i => i.status === "active").length,
    pending:  items.filter(i => i.status === "pending").length,
    featured: items.filter(i => i.is_featured).length,
    used:     items.filter(i => i.item_type === "used").length,
    new_items:items.filter(i => i.item_type === "new" || !i.item_type).length,
  };

  const columns = [
    {
      key: "name", label: "Product",
      render: (v, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", background: "#f1f5f9", flexShrink: 0 }}>
            {row.cover_image
              ? <img src={row.cover_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <ShoppingBag size={18} style={{ color: "#94a3b8", margin: "13px auto", display: "block" }} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
            <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
              {row.item_type === "used" && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "rgba(148,163,184,0.15)", color: "#64748b" }}>USED</span>
              )}
              {row.condition && row.condition !== "new" && (
                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: (CONDITION[row.condition]?.color||"#94a3b8") + "15", color: CONDITION[row.condition]?.color||"#94a3b8" }}>
                  {CONDITION[row.condition]?.label || row.condition}
                </span>
              )}
              {row.is_featured && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "rgba(212,175,55,0.15)", color: "#D4AF37" }}>FEATURED</span>}
            </div>
          </div>
        </div>
      )
    },
    { key: "category_name", label: "Category", render: v => <span style={{ fontSize: 12, color: "#475569" }}>{v || "—"}</span> },
    { key: "price", label: "Price", render: (v, row) => (
      <div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>EGP {Number(v).toLocaleString()}</div>
        {row.price_original && <div style={{ fontSize: 10, color: "#94a3b8", textDecoration: "line-through" }}>EGP {Number(row.price_original).toLocaleString()}</div>}
      </div>
    )},
    { key: "city", label: "City", render: v => <span style={{ fontSize: 12 }}>{v || "—"}</span> },
    { key: "plan_type", label: "Plan", render: v => <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: (PLAN_COLORS[v]||"#94a3b8")+"15", color: PLAN_COLORS[v]||"#94a3b8" }}>{v||"LITE"}</span> },
    { key: "view_count",    label: "Views",     render: v => <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}><Eye size={12} style={{ color: "#94a3b8" }} />{v||0}</span> },
    { key: "inquiry_count", label: "Inquiries", render: v => <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}><MessageCircle size={12} style={{ color: "#94a3b8" }} />{v||0}</span> },
    {
      key: "status", label: "Status",
      render: v => { const s = STATUS[v] || STATUS.pending; return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>; }
    },
    { key: "created_at", label: "Submitted", render: v => <span style={{ fontSize: 11, color: "#94a3b8" }}>{v ? new Date(v).toLocaleDateString() : "—"}</span> },
  ];

  return (
    <div>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 18 }}>
        {[
          { label: "Live Products",    value: stats.live,      color: "#22c55e" },
          { label: "Pending Review",   value: stats.pending,   color: "#f59e0b", alert: stats.pending > 0 },
          { label: "Featured",         value: stats.featured,  color: "#D4AF37" },
          { label: "New Products",     value: stats.new_items, color: "#6366f1" },
          { label: "Used Products",    value: stats.used,      color: "#94a3b8" },
          { label: "Total",            value: stats.total,     color: "#334155" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: s.alert ? "1px solid rgba(245,158,11,0.3)" : "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[["all","All"],["pending","Pending"],["active","Live"],["rejected","Rejected"],["paused","Paused"]].map(([val,label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ padding: "6px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: filter===val?"none":"1px solid #e2e8f0", background: filter===val?"#FE6972":"#fff", color: filter===val?"#fff":"#64748b" }}>
              {label} ({val==="all"?items.length:items.filter(i=>i.status===val).length})
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
          {[["all","All Types"],["new","New Only"],["used","Used Only"]].map(([val,label]) => (
            <button key={val} onClick={() => setTypeFilter(val)}
              style={{ padding: "5px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer", border: typeFilter===val?"none":"1px solid #e2e8f0", background: typeFilter===val?"#334155":"#fff", color: typeFilter===val?"#fff":"#64748b" }}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={load} style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
          <RefreshCw size={12} />Refresh
        </button>
      </div>

      {loading ? <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Loading...</div> : (
        <DataTable columns={columns} data={filtered} pageSize={15} emptyMessage="No products found" onRowClick={setSelected}
          actions={row => {
            const btns = [];
            if (row.status === "pending") {
              btns.push(<button key="approve" onClick={e => { e.stopPropagation(); approve(row.id); }} style={{ padding: "4px 10px", borderRadius: 5, border: "none", background: "rgba(34,197,94,0.1)", color: "#22c55e", cursor: "pointer", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}><CheckCircle size={11} />Approve</button>);
              btns.push(<button key="reject" onClick={e => { e.stopPropagation(); setShowReject(row); }} style={{ padding: "4px 10px", borderRadius: 5, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}><XCircle size={11} />Reject</button>);
            }
            btns.push(<button key="del" onClick={e => { e.stopPropagation(); del(row.id); }} style={{ padding: "4px 8px", borderRadius: 5, border: "none", background: "rgba(239,68,68,0.06)", color: "#ef4444", cursor: "pointer", fontSize: 11 }}><Trash2 size={11} /></button>);
            return btns;
          }}
        />
      )}

      {/* Detail drawer */}
      {selected && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 420, background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 50, overflowY: "auto", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, margin: 0 }}>Product Details</h3>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
          </div>
          {selected.cover_image && <img src={selected.cover_image} alt="" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 10, marginBottom: 14 }} />}
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{selected.name}</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
            {(() => { const s = STATUS[selected.status]||STATUS.pending; return <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: s.bg, color: s.color }}>{s.label}</span>; })()}
            {selected.item_type === "used" && <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: "rgba(148,163,184,0.1)", color: "#64748b" }}>Used Item</span>}
            {selected.condition && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: (CONDITION[selected.condition]?.color||"#94a3b8")+"15", color: CONDITION[selected.condition]?.color||"#94a3b8" }}>{CONDITION[selected.condition]?.label||selected.condition}</span>}
            {selected.is_featured && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "rgba(212,175,55,0.1)", color: "#D4AF37" }}>Featured</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[
              ["Price",     "EGP " + Number(selected.price||0).toLocaleString()],
              ["Category",  selected.category_name || "—"],
              ["City",      selected.city || "—"],
              ["Plan",      selected.plan_type || "LITE"],
              ["Views",     selected.view_count || 0],
              ["Inquiries", selected.inquiry_count || 0],
            ].map(([label, val]) => (
              <div key={label} style={{ padding: 10, borderRadius: 7, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
          {selected.description && <div style={{ fontSize: 13, color: "#334155", background: "#f8fafc", padding: 10, borderRadius: 8, lineHeight: 1.6, marginBottom: 14 }}>{selected.description}</div>}
          {selected.rejection_reason && <div style={{ padding: 10, borderRadius: 7, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 14 }}><div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, marginBottom: 3 }}>Rejection Reason</div><div style={{ fontSize: 12 }}>{selected.rejection_reason}</div></div>}

          {/* Compliance checklist */}
          <div style={{ padding: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Content Checklist</div>
            {[
              ["Has title",          !!selected.name],
              ["Has description",    (selected.description?.length||0)>20],
              ["Has cover image",    !!selected.cover_image],
              ["Has price",          !!(selected.price > 0)],
              ["Has category",       !!selected.category_name],
              ["Condition specified", !!selected.condition],
              ["City specified",     !!selected.city],
            ].map(([label, done]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                {done ? <CheckCircle size={12} style={{ color: "#22c55e" }} /> : <AlertTriangle size={12} style={{ color: "#f59e0b" }} />}
                <span style={{ fontSize: 11, color: done ? "#334155" : "#94a3b8" }}>{label}</span>
              </div>
            ))}
          </div>

          {selected.status === "pending" && (
            <div style={{ display: "flex", gap: 7 }}>
              <button onClick={() => approve(selected.id)} style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Approve</button>
              <button onClick={() => { setShowReject(selected); setSelected(null); }} style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Reject</button>
            </div>
          )}
        </div>
      )}

      {/* Reject modal */}
      {showReject && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 22, width: 400 }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, marginBottom: 4 }}>Reject Listing</h3>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>{showReject.name}</div>
            {["Poor image quality","Incorrect category","Misleading description","Wrong/missing price","Duplicate listing","Prohibited item","Other"].map(r => (
              <label key={r} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, cursor: "pointer", padding: "5px 8px", borderRadius: 5, background: rejectReason===r?"rgba(239,68,68,0.06)":"#f8fafc", border: rejectReason===r?"1px solid rgba(239,68,68,0.3)":"1px solid #e2e8f0", marginBottom: 4 }}>
                <input type="radio" checked={rejectReason===r} onChange={() => setRejectReason(r)} style={{ accentColor: "#ef4444" }} />{r}
              </label>
            ))}
            <div style={{ display: "flex", gap: 7, marginTop: 12 }}>
              <button onClick={() => reject(showReject.id)} disabled={!rejectReason} style={{ flex: 1, padding: 10, borderRadius: 7, border: "none", background: rejectReason?"#ef4444":"#e2e8f0", color: "#fff", cursor: rejectReason?"pointer":"not-allowed", fontWeight: 700, fontSize: 13 }}>Reject</button>
              <button onClick={() => { setShowReject(null); setRejectReason(""); }} style={{ padding: "10px 16px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MarketplaceServices.jsx — Wedding Services specialized page
// ============================================================
export function MarketplaceServices({ onNavigate }) {
  const [vendors,  setVendors]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("all");
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(API + "/admin/vendors?type=service").then(r => r.json());
      const data = res?.result?.data || res?.data || [];
      setVendors(data.filter(v => v.vendor_type === "service" || !v.vendor_type));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function approve(id) {
    await fetch(API + "/admin/approve/" + id);
    setVendors(prev => prev.map(v => v.id === id ? { ...v, registration_status: "approved", is_active: true } : v));
  }

  const filtered = filter === "all" ? vendors : vendors.filter(v => v.registration_status === filter);
  const stats = {
    active:   vendors.filter(v => v.registration_status === "approved" && v.is_active).length,
    pending:  vendors.filter(v => v.registration_status === "submitted").length,
    verified: vendors.filter(v => v.is_verified).length,
    top_plan: vendors.filter(v => v.plan_type === "TOP").length,
    total:    vendors.length,
  };

  const columns = [
    {
      key: "business_name", label: "Service Provider",
      render: (v, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", background: "#f1f5f9", flexShrink: 0 }}>
            {row.cover_image ? <img src={row.cover_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Star size={16} style={{ color: "#94a3b8", margin: "12px auto", display: "block" }} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{row.category_name || "—"}</div>
          </div>
        </div>
      )
    },
    { key: "city",         label: "City",           render: v => <span style={{ fontSize: 12 }}>{v||"—"}</span> },
    { key: "price_min",    label: "Starting Price",  render: v => v ? <span style={{ fontWeight: 600, fontSize: 12 }}>EGP {Number(v).toLocaleString()}</span> : <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span> },
    { key: "rating",       label: "Rating",          render: v => v ? <span style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}><Star size={11} style={{ color: "#D4AF37", fill: "#D4AF37" }} />{v}</span> : <span style={{ color: "#94a3b8", fontSize: 12 }}>New</span> },
    { key: "profile_views",label: "Views",           render: v => <span style={{ fontSize: 12 }}>{v||0}</span> },
    { key: "plan_type",    label: "Plan",            render: v => <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: (PLAN_COLORS[v]||"#94a3b8")+"15", color: PLAN_COLORS[v]||"#94a3b8" }}>{v||"LITE"}</span> },
    { key: "is_verified",  label: "Verified",        render: v => v ? <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 700 }}>✓ Verified</span> : <span style={{ fontSize: 10, color: "#94a3b8" }}>—</span> },
    {
      key: "registration_status", label: "Status",
      render: v => { const s = { approved: { bg: "rgba(34,197,94,0.1)", color: "#22c55e", label: "Active" }, submitted: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Pending" }, rejected: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", label: "Rejected" }, draft: { bg: "rgba(100,116,139,0.1)", color: "#64748b", label: "Draft" } }[v] || { bg: "rgba(100,116,139,0.1)", color: "#64748b", label: v }; return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>; }
    },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 18 }}>
        {[
          { label: "Active Services",  value: stats.active,   color: "#22c55e" },
          { label: "Pending Approval", value: stats.pending,  color: "#f59e0b", alert: stats.pending > 0 },
          { label: "Verified",         value: stats.verified, color: "#6366f1" },
          { label: "TOP Plan",         value: stats.top_plan, color: "#D4AF37" },
          { label: "Total",            value: stats.total,    color: "#334155" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: s.alert ? "1px solid rgba(245,158,11,0.3)" : "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
        {[["all","All"],["submitted","Pending"],["approved","Active"],["rejected","Rejected"],["draft","Draft"]].map(([val,label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: filter===val?"none":"1px solid #e2e8f0", background: filter===val?"#6366f1":"#fff", color: filter===val?"#fff":"#64748b" }}>
            {label}
          </button>
        ))}
        <button onClick={load} style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><RefreshCw size={12} />Refresh</button>
      </div>
      {loading ? <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Loading...</div> :
        <DataTable columns={columns} data={filtered} pageSize={15} emptyMessage="No services found" onRowClick={setSelected}
          actions={row => row.registration_status === "submitted" ? [
            <button key="approve" onClick={e => { e.stopPropagation(); approve(row.id); }} style={{ padding: "4px 10px", borderRadius: 5, border: "none", background: "rgba(34,197,94,0.1)", color: "#22c55e", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Approve</button>
          ] : []}
        />
      }
    </div>
  );
}

// ============================================================
// MarketplaceVenues.jsx — Wedding Venues specialized page
// ============================================================
export function MarketplaceVenues({ onNavigate }) {
  const [venues,  setVenues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(API + "/admin/vendors").then(r => r.json());
      const data = res?.result?.data || res?.data || [];
      setVenues(data.filter(v => v.vendor_type === "venue"));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function approve(id) {
    await fetch(API + "/admin/approve/" + id);
    setVenues(prev => prev.map(v => v.id === id ? { ...v, registration_status: "approved", is_active: true } : v));
  }

  const filtered = filter === "all" ? venues : venues.filter(v => v.registration_status === filter);
  const stats = {
    active:    venues.filter(v => v.registration_status === "approved").length,
    pending:   venues.filter(v => v.registration_status === "submitted").length,
    cities:    new Set(venues.map(v => v.city).filter(Boolean)).size,
    inquiries: 0,
    total:     venues.length,
  };

  const columns = [
    {
      key: "business_name", label: "Venue",
      render: (v, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", background: "#f1f5f9", flexShrink: 0 }}>
            {row.cover_image ? <img src={row.cover_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Building2 size={18} style={{ color: "#94a3b8", margin: "13px auto", display: "block" }} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{row.city || "—"}</div>
          </div>
        </div>
      )
    },
    { key: "city",      label: "Location",      render: v => <span style={{ fontSize: 12 }}>{v||"—"}</span> },
    { key: "price_min", label: "Price/Event",   render: v => v ? <span style={{ fontWeight: 600, fontSize: 12 }}>EGP {Number(v).toLocaleString()}</span> : <span style={{ color: "#94a3b8" }}>—</span> },
    { key: "profile_views", label: "Views",     render: v => <span style={{ fontSize: 12 }}>{v||0}</span> },
    { key: "plan_type", label: "Plan",          render: v => <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: (PLAN_COLORS[v]||"#94a3b8")+"15", color: PLAN_COLORS[v]||"#94a3b8" }}>{v||"LITE"}</span> },
    { key: "registration_status", label: "Status", render: v => { const m = {approved:{bg:"rgba(34,197,94,0.1)",color:"#22c55e",label:"Active"},submitted:{bg:"rgba(245,158,11,0.1)",color:"#f59e0b",label:"Pending"},draft:{bg:"rgba(100,116,139,0.1)",color:"#64748b",label:"Draft"}}[v]||{bg:"rgba(100,116,139,0.1)",color:"#64748b",label:v}; return <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,background:m.bg,color:m.color}}>{m.label}</span>; } },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 18 }}>
        {[
          { label: "Active Venues",    value: stats.active,    color: "#22c55e" },
          { label: "Pending Approval", value: stats.pending,   color: "#f59e0b", alert: stats.pending > 0 },
          { label: "Cities Covered",   value: stats.cities,    color: "#8b5cf6" },
          { label: "Inquiries",        value: stats.inquiries, color: "#FE6972" },
          { label: "Total Venues",     value: stats.total,     color: "#334155" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: s.alert ? "1px solid rgba(245,158,11,0.3)" : "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
        {[["all","All"],["submitted","Pending"],["approved","Active"],["draft","Draft"]].map(([val,label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: filter===val?"none":"1px solid #e2e8f0", background: filter===val?"#8b5cf6":"#fff", color: filter===val?"#fff":"#64748b" }}>
            {label}
          </button>
        ))}
        <button onClick={load} style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><RefreshCw size={12} />Refresh</button>
      </div>
      {loading ? <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Loading...</div> :
        venues.length === 0
          ? <div style={{ padding: 60, textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}><Building2 size={32} style={{ color: "#e2e8f0", marginBottom: 8, display: "block", margin: "0 auto 8px" }} /><p style={{ color: "#94a3b8", margin: 0 }}>No venues registered yet</p></div>
          : <DataTable columns={columns} data={filtered} pageSize={15} emptyMessage="No venues found" onRowClick={() => {}}
              actions={row => row.registration_status === "submitted" ? [
                <button key="approve" onClick={e => { e.stopPropagation(); approve(row.id); }} style={{ padding: "4px 10px", borderRadius: 5, border: "none", background: "rgba(34,197,94,0.1)", color: "#22c55e", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Approve</button>
              ] : []}
            />
      }
    </div>
  );
}

// ============================================================
// MarketplaceHappyHour.jsx — Happy Hour Deals specialized page
// ============================================================
export function MarketplaceHappyHour({ onNavigate }) {
  const [vendors,  setVendors]  = useState([]);
  const [deals,    setDeals]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [view,     setView]     = useState("vendors"); // vendors|deals

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(API + "/admin/vendors").then(r => r.json());
      const data = res?.result?.data || res?.data || [];
      setVendors(data.filter(v => v.vendor_type === "happy_hour"));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function approve(id) {
    await fetch(API + "/admin/approve/" + id);
    setVendors(prev => prev.map(v => v.id === id ? { ...v, registration_status: "approved", is_active: true } : v));
  }

  const stats = {
    active:   vendors.filter(v => v.registration_status === "approved" && v.is_active).length,
    pending:  vendors.filter(v => v.registration_status === "submitted").length,
    total:    vendors.length,
  };

  const vendorColumns = [
    {
      key: "business_name", label: "Happy Hour Vendor",
      render: (v, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", background: "#fff8e1", flexShrink: 0 }}>
            {row.cover_image ? <img src={row.cover_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Flame size={16} style={{ color: "#f59e0b", margin: "12px auto", display: "block" }} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{row.city || "—"}</div>
          </div>
        </div>
      )
    },
    { key: "city",     label: "City",        render: v => <span style={{ fontSize: 12 }}>{v||"—"}</span> },
    { key: "phone",    label: "Phone",        render: v => <span style={{ fontSize: 11, color: "#64748b" }}>{v||"—"}</span> },
    { key: "plan_type",label: "Plan",         render: v => <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: (PLAN_COLORS[v]||"#94a3b8")+"15", color: PLAN_COLORS[v]||"#94a3b8" }}>{v||"LITE"}</span> },
    { key: "registration_status", label: "Status", render: v => { const m={approved:{bg:"rgba(34,197,94,0.1)",color:"#22c55e",label:"Active"},submitted:{bg:"rgba(245,158,11,0.1)",color:"#f59e0b",label:"Pending"},draft:{bg:"rgba(100,116,139,0.1)",color:"#64748b",label:"Draft"}}[v]||{bg:"rgba(100,116,139,0.1)",color:"#64748b",label:v}; return <span style={{fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,background:m.bg,color:m.color}}>{m.label}</span>; } },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
        {[
          { label: "Active Vendors",   value: stats.active,  color: "#22c55e" },
          { label: "Pending Approval", value: stats.pending, color: "#f59e0b", alert: stats.pending > 0 },
          { label: "Active Deals",     value: 0,             color: "#f59e0b" },
          { label: "Total Vendors",    value: stats.total,   color: "#334155" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: s.alert ? "1px solid rgba(245,158,11,0.3)" : "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button onClick={() => setView("vendors")} style={{ padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", border: view==="vendors"?"none":"1px solid #e2e8f0", background: view==="vendors"?"#f59e0b":"#fff", color: view==="vendors"?"#fff":"#64748b" }}>Vendors ({vendors.length})</button>
        <button onClick={() => setView("deals")} style={{ padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", border: view==="deals"?"none":"1px solid #e2e8f0", background: view==="deals"?"#f59e0b":"#fff", color: view==="deals"?"#fff":"#64748b" }}>Active Deals (0)</button>
        <button onClick={load} style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><RefreshCw size={12} />Refresh</button>
      </div>
      {loading ? <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Loading...</div>
      : view === "vendors"
        ? <DataTable columns={vendorColumns} data={vendors} pageSize={15} emptyMessage="No happy hour vendors" onRowClick={() => {}}
            actions={row => row.registration_status === "submitted" ? [
              <button key="approve" onClick={e => { e.stopPropagation(); approve(row.id); }} style={{ padding: "4px 10px", borderRadius: 5, border: "none", background: "rgba(34,197,94,0.1)", color: "#22c55e", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Approve</button>
            ] : []}
          />
        : <div style={{ padding: 60, textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0" }}><Flame size={32} style={{ color: "#f59e0b", marginBottom: 8, display: "block", margin: "0 auto 8px" }} /><p style={{ color: "#94a3b8", margin: 0 }}>Active deals will appear here once vendors create them</p></div>
      }
    </div>
  );
}
