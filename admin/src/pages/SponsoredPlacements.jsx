import { useState, useEffect } from "react";
import {
  Megaphone, Plus, X, CheckCircle, XCircle, Clock, Crown,
  Star, Home, BarChart3, TrendingUp, Eye, Edit, Trash2, RefreshCw
} from "lucide-react";
import DataTable from "../components/DataTable";

const API = "/api";

const PLACEMENT_META = {
  featured:        { label: "Featured Listing",  color: "#FE6972", icon: Star,     price: 500  },
  homepage_banner: { label: "Homepage Banner",   color: "#D4AF37", icon: Home,     price: 1500 },
  category_boost:  { label: "Category Boost",   color: "#6366f1", icon: TrendingUp,price: 300  },
  top_listing:     { label: "Top of Page",       color: "#22c55e", icon: Crown,    price: 800  },
};

const STATUS_STYLES = {
  active:    { bg: "rgba(34,197,94,0.1)",  color: "#22c55e", label: "Active"    },
  pending:   { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Pending"   },
  paused:    { bg: "rgba(100,116,139,0.1)",color: "#64748b", label: "Paused"    },
  expired:   { bg: "rgba(239,68,68,0.1)",  color: "#ef4444", label: "Expired"   },
  cancelled: { bg: "rgba(239,68,68,0.1)",  color: "#ef4444", label: "Cancelled" },
};

function daysLeft(end) {
  const d = Math.ceil((new Date(end) - new Date()) / (1000*60*60*24));
  return d;
}

export default function SponsoredPlacements({ onNavigate }) {
  const [placements, setPlacements] = useState([]);
  const [pricing,    setPricing]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("active");
  const [showForm,   setShowForm]   = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [form,       setForm]       = useState({
    vendor_id: "", product_id: "", placement_type: "featured",
    weeks_paid: 1, price_per_week: 500, start_date: "", auto_renew: false, notes: ""
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [plRes, prRes] = await Promise.all([
        fetch(API + "/admin/sponsored").then(r => r.json()),
        fetch(API + "/admin/sponsored/pricing").then(r => r.json()),
      ]);
      if (plRes.success) setPlacements(plRes.data || []);
      if (prRes.success) setPricing(prRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    setSaving(true);
    try {
      const res = await fetch(API + "/admin/sponsored", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, weeks_paid: parseInt(form.weeks_paid), price_per_week: parseFloat(form.price_per_week) })
      });
      const data = await res.json();
      if (data.success) { setShowForm(false); load(); }
      else alert(data.error || "Failed");
    } catch { alert("Network error"); }
    finally { setSaving(false); }
  }

  async function handleStatusChange(id, status) {
    await fetch(API + "/admin/sponsored/" + id, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setPlacements(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  }

  async function handleDelete(id) {
    if (!confirm("Remove this placement?")) return;
    await fetch(API + "/admin/sponsored/" + id, { method: "DELETE" });
    setPlacements(prev => prev.filter(p => p.id !== id));
  }

  const filtered = filter === "all" ? placements : placements.filter(p => p.status === filter);

  // Stats
  const activePlacements = placements.filter(p => p.status === "active").length;
  const totalRevenue = placements.filter(p => p.status !== "cancelled").reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);
  const expiringSoon = placements.filter(p => p.status === "active" && daysLeft(p.end_date) <= 3).length;

  const columns = [
    {
      key: "product_name", label: "Listing / Vendor",
      render: (v, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", background: "#f1f5f9", flexShrink: 0 }}>
            {row.product_image
              ? <img src={row.product_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <Megaphone size={18} style={{ color: "#94a3b8", margin: "11px auto", display: "block" }} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{v || "—"}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{row.business_name}</div>
          </div>
        </div>
      )
    },
    {
      key: "placement_type", label: "Type",
      render: v => {
        const m = PLACEMENT_META[v] || PLACEMENT_META.featured;
        const Icon = m.icon;
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: m.color + "15", color: m.color }}>
            <Icon size={11} />{m.label}
          </span>
        );
      }
    },
    {
      key: "total_amount", label: "Revenue",
      render: (v, row) => <span style={{ fontWeight: 700, color: "#D4AF37" }}>{Number(v||0).toLocaleString()} {row.currency}</span>
    },
    {
      key: "end_date", label: "Expires",
      render: v => {
        const days = daysLeft(v);
        return (
          <div>
            <div style={{ fontSize: 12 }}>{new Date(v).toLocaleDateString()}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: days <= 0 ? "#ef4444" : days <= 3 ? "#f59e0b" : "#64748b" }}>
              {days <= 0 ? "Expired" : days <= 3 ? `${days}d left!` : `${days} days left`}
            </div>
          </div>
        );
      }
    },
    {
      key: "status", label: "Status",
      render: v => {
        const s = STATUS_STYLES[v] || STATUS_STYLES.pending;
        return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>;
      }
    },
    {
      key: "auto_renew", label: "Auto Renew",
      render: v => v
        ? <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>✓ Yes</span>
        : <span style={{ fontSize: 11, color: "#94a3b8" }}>No</span>
    },
  ];

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Active Placements", value: activePlacements,             color: "#22c55e" },
          { label: "Total Revenue",     value: "EGP " + totalRevenue.toLocaleString(), color: "#D4AF37" },
          { label: "Expiring Soon",     value: expiringSoon,                  color: expiringSoon > 0 ? "#f59e0b" : "#64748b" },
          { label: "Total Placements",  value: placements.length,             color: "#6366f1" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pricing reference */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, margin: "0 0 12px" }}>Placement Pricing</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Object.entries(PLACEMENT_META).map(([type, meta]) => {
            const Icon = meta.icon;
            const pp = pricing.find(p => p.placement_type === type);
            return (
              <div key={type} style={{ flex: 1, minWidth: 160, padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: meta.color + "05" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Icon size={14} style={{ color: meta.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                  EGP {Number(pp?.price_per_week || meta.price).toLocaleString()}
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>per week</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[["all","All"],["active","Active"],["pending","Pending"],["expired","Expired"],["cancelled","Cancelled"]].map(([val,label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: filter===val?"none":"1px solid #e2e8f0", background: filter===val?"var(--coral, #FE6972)":"#fff", color: filter===val?"#fff":"#64748b" }}>
              {label} ({val==="all" ? placements.length : placements.filter(p=>p.status===val).length})
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <RefreshCw size={13} />Refresh
          </button>
          <button onClick={() => setShowForm(true)}
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#D4AF37", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
            <Plus size={14} />New Placement
          </button>
        </div>
      </div>

      {loading ? <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Loading...</div> : (
        <DataTable
          columns={columns}
          data={filtered}
          pageSize={15}
          emptyMessage="No sponsored placements found"
          onRowClick={setSelected}
          actions={row => {
            const btns = [];
            if (row.status === "active") {
              btns.push(<button key="pause" onClick={e => { e.stopPropagation(); handleStatusChange(row.id, "paused"); }}
                style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 11 }}>Pause</button>);
            }
            if (row.status === "paused") {
              btns.push(<button key="resume" onClick={e => { e.stopPropagation(); handleStatusChange(row.id, "active"); }}
                style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "rgba(34,197,94,0.1)", color: "#22c55e", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Resume</button>);
            }
            btns.push(<button key="del" onClick={e => { e.stopPropagation(); handleDelete(row.id); }}
              style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", fontSize: 11 }}><Trash2 size={12} /></button>);
            return btns;
          }}
        />
      )}

      {/* Create Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 480, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, margin: 0 }}>New Sponsored Placement</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Vendor ID *</label>
                <input value={form.vendor_id} onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))} placeholder="Vendor UUID..."
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Product ID (optional)</label>
                <input value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))} placeholder="Product UUID..."
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Placement Type *</label>
                <select value={form.placement_type} onChange={e => { const m = PLACEMENT_META[e.target.value]; setForm(f => ({ ...f, placement_type: e.target.value, price_per_week: m?.price || 500 })); }}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }}>
                  {Object.entries(PLACEMENT_META).map(([k,v]) => <option key={k} value={k}>{v.label} — EGP {v.price}/week</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Weeks *</label>
                  <input type="number" min="1" value={form.weeks_paid} onChange={e => setForm(f => ({ ...f, weeks_paid: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Price/Week (EGP)</label>
                  <input type="number" value={form.price_per_week} onChange={e => setForm(f => ({ ...f, price_per_week: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Total: </span>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#D4AF37" }}>EGP {(parseInt(form.weeks_paid||1) * parseFloat(form.price_per_week||0)).toLocaleString()}</span>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Start Date</label>
                <input type="datetime-local" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={form.auto_renew} onChange={e => setForm(f => ({ ...f, auto_renew: e.target.checked }))} />
                Auto-renew when expires
              </label>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Admin Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={handleCreate} disabled={saving || !form.vendor_id}
                style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: saving || !form.vendor_id ? "#e2e8f0" : "#D4AF37", color: "#fff", cursor: saving || !form.vendor_id ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14 }}>
                {saving ? "Creating..." : "Create Placement"}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 400, background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 50, padding: 24, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, margin: 0 }}>Placement Details</h3>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
          </div>
          {selected.product_image && <img src={selected.product_image} alt="" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, marginBottom: 16 }} />}
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{selected.product_name || "General Placement"}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{selected.business_name}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              ["Type",       PLACEMENT_META[selected.placement_type]?.label || selected.placement_type],
              ["Revenue",    "EGP " + Number(selected.total_amount||0).toLocaleString()],
              ["Start",      new Date(selected.start_date).toLocaleDateString()],
              ["End",        new Date(selected.end_date).toLocaleDateString()],
              ["Days Left",  Math.max(0, daysLeft(selected.end_date)) + " days"],
              ["Auto Renew", selected.auto_renew ? "Yes" : "No"],
            ].map(([label, val]) => (
              <div key={label} style={{ padding: 10, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
          {selected.notes && <div style={{ padding: 12, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Admin Notes</div>
            <div style={{ fontSize: 13, color: "#334155" }}>{selected.notes}</div>
          </div>}
          <div style={{ display: "flex", gap: 8 }}>
            {selected.status === "active" && (
              <button onClick={() => { handleStatusChange(selected.id, "paused"); setSelected(null); }}
                style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                Pause
              </button>
            )}
            {selected.status === "paused" && (
              <button onClick={() => { handleStatusChange(selected.id, "active"); setSelected(null); }}
                style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                Resume
              </button>
            )}
            <button onClick={() => { handleDelete(selected.id); setSelected(null); }}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


