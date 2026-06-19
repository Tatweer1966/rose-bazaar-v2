import { useState, useEffect } from "react";
import {
  DollarSign, Crown, Zap, Check, Clock, AlertTriangle,
  CheckCircle, Wallet, CreditCard, TrendingUp, X,
  ArrowUpRight, RefreshCw, Plus, Receipt
} from "lucide-react";
import DataTable from "../components/DataTable";

const API = "/api/cms";
const ADMIN_API = "/api";

const PLAN_META = {
  TOP:   { label: "Top",   color: "#D4AF37", icon: Crown, price_monthly: 1299, price_annual: 12990, max_listings: -1  },
  PRO:   { label: "Pro",   color: "#6366f1", icon: Zap,   price_monthly: 699,  price_annual: 6990,  max_listings: 3   },
  BASIC: { label: "Basic", color: "#22c55e", icon: Check, price_monthly: 299,  price_annual: 2990,  max_listings: 1   },
  LITE:  { label: "Lite",  color: "#94a3b8", icon: null,  price_monthly: 0,    price_annual: 0,     max_listings: 3   },
};

const STATUS_STYLES = {
  active:    { bg: "rgba(34,197,94,0.1)",  color: "#22c55e", label: "Active"    },
  trial:     { bg: "rgba(99,102,241,0.1)", color: "#6366f1", label: "Trial"     },
  expired:   { bg: "rgba(239,68,68,0.1)",  color: "#ef4444", label: "Expired"   },
  cancelled: { bg: "rgba(100,116,139,0.1)",color: "#64748b", label: "Cancelled" },
  paused:    { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Paused"    },
};

function daysLeft(end) {
  return Math.ceil((new Date(end) - new Date()) / (1000*60*60*24));
}

export default function FeeContractManager() {
  const [subs,     setSubs]     = useState([]);
  const [stats,    setStats]    = useState(null);
  const [wallets,  setWallets]  = useState([]);
  const [revenue,  setRevenue]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ vendor_id: "", plan_id: "PRO", billing_cycle: "monthly", price_paid: "", payment_ref: "" });
  const [saving,   setSaving]   = useState(false);
  const [activeTab,setActiveTab]= useState("subscriptions"); // "subscriptions" | "wallets" | "revenue"

  async function load() {
    setLoading(true);
    try {
      const [subsRes, statsRes, walletsRes, revRes] = await Promise.all([
        fetch("/api/admin/subscriptions").then(r => r.json()),
        fetch("/api/admin/subscriptions/stats").then(r => r.json()),
        fetch("/api/cms/admin/wallets").then(r => r.ok ? r.json() : { data: [] }),
        fetch("/api/admin/revenue/summary").then(r => r.json()),
      ]);
      if (subsRes.success)   setSubs(subsRes.data || []);
      if (statsRes.success)  setStats(statsRes.data);
      if (walletsRes?.result?.data || walletsRes?.data) setWallets(walletsRes?.result?.data || walletsRes?.data || []);
      if (revRes.success)    setRevenue(revRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreateSub() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price_paid: parseFloat(form.price_paid || 0) })
      });
      const data = await res.json();
      if (data.success) { setShowForm(false); load(); }
      else alert(data.error || "Failed");
    } catch { alert("Network error"); }
    finally { setSaving(false); }
  }

  async function handleCancel(id) {
    if (!confirm("Cancel this subscription?")) return;
    await fetch("/api/admin/subscriptions/" + id + "/cancel", { method: "PUT" });
    setSubs(prev => prev.map(s => s.id === id ? { ...s, status: "cancelled" } : s));
  }

  const s = stats || {};

  const subColumns = [
    {
      key: "business_name", label: "Vendor",
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{row.vendor_email} · {row.city}</div>
        </div>
      )
    },
    {
      key: "plan_id", label: "Plan",
      render: v => {
        const p = PLAN_META[v] || PLAN_META.LITE;
        const Icon = p.icon;
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: p.color + "15", color: p.color }}>
            {Icon && <Icon size={10} />}{p.label}
          </span>
        );
      }
    },
    {
      key: "status", label: "Status",
      render: (v, row) => {
        const s = STATUS_STYLES[v] || STATUS_STYLES.active;
        const days = row.expires_at ? daysLeft(row.expires_at) : null;
        return (
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>
            {days !== null && days > 0 && days <= 7 && <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600, marginTop: 2 }}>{days}d left</div>}
            {days !== null && days <= 0 && v === "active" && <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 600, marginTop: 2 }}>Expired!</div>}
          </div>
        );
      }
    },
    {
      key: "price_paid", label: "Revenue",
      render: (v, row) => <span style={{ fontWeight: 700, color: "#D4AF37" }}>{Number(v||0).toLocaleString()} {row.currency}</span>
    },
    {
      key: "billing_cycle", label: "Cycle",
      render: v => <span style={{ fontSize: 11, textTransform: "capitalize", color: "#64748b" }}>{v}</span>
    },
    {
      key: "expires_at", label: "Expires",
      render: v => v ? <span style={{ fontSize: 11, color: "#64748b" }}>{new Date(v).toLocaleDateString()}</span> : "—"
    },
  ];

  const walletColumns = [
    { key: "vendor_name", label: "Vendor", render: (v, row) => <div><div style={{ fontWeight: 600 }}>{v}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{row.plan?.toUpperCase()}</div></div> },
    { key: "balance", label: "Balance", render: (v, row) => <span style={{ fontWeight: 700, color: parseFloat(v)>0?"#22c55e":"#94a3b8" }}>{Number(v||0).toLocaleString()} {row.currency}</span> },
    { key: "plan_listings_used", label: "Used", render: (v, row) => <span style={{ fontSize: 12 }}>{v}/{row.plan_listings_limit===-1?"∞":row.plan_listings_limit}</span> },
    { key: "trial_end", label: "Trial End", render: v => v ? <span style={{ fontSize: 11, color: new Date(v)<new Date()?"#ef4444":"#64748b" }}>{new Date(v).toLocaleDateString()}</span> : "—" },
  ];

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Active Subs",    value: s.active_subs || 0,    color: "#22c55e" },
          { label: "Trial",          value: s.trial_subs  || 0,    color: "#6366f1" },
          { label: "Expired",        value: s.expired_subs|| 0,    color: "#ef4444" },
          { label: "Expiring ≤7d",  value: s.expiring_soon||0,    color: s.expiring_soon > 0 ? "#f59e0b" : "#94a3b8" },
          { label: "Monthly Rev",    value: "EGP " + Number(s.mrr||0).toLocaleString(), color: "#D4AF37" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue by type */}
      {revenue?.by_type?.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, margin: "0 0 12px" }}>Revenue Breakdown</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {revenue.by_type.map(rt => (
              <div key={rt.revenue_type} style={{ flex: 1, minWidth: 130, padding: "10px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "capitalize", marginBottom: 4 }}>{rt.revenue_type.replace("_"," ")}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#D4AF37" }}>EGP {Number(rt.total_amount||0).toLocaleString()}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>{rt.transaction_count} transactions</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, margin: "0 0 12px" }}>Subscription Plans</h3>
        <div style={{ display: "flex", gap: 10 }}>
          {Object.entries(PLAN_META).map(([id, p]) => {
            const Icon = p.icon;
            const count = subs.filter(s => s.plan_id === id && s.status === "active").length;
            return (
              <div key={id} style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: p.color + "05" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                  {Icon && <Icon size={13} style={{ color: p.color }} />}
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.label}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{p.price_monthly === 0 ? "Free" : `EGP ${p.price_monthly}`}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>/month</div>
                <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: p.color }}>{count} active</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 1, marginBottom: 16, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[["subscriptions","Subscriptions"],["wallets","Wallets"]].map(([id,label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: activeTab===id?"#fff":"transparent", color: activeTab===id?"#0f172a":"#64748b", boxShadow: activeTab===id?"0 1px 3px rgba(0,0,0,0.08)":"none" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: "#64748b" }}>{activeTab === "subscriptions" ? subs.length : wallets.length} records</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <RefreshCw size={13} />Refresh
          </button>
          {activeTab === "subscriptions" && (
            <button onClick={() => setShowForm(true)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#D4AF37", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              <Plus size={14} />New Subscription
            </button>
          )}
        </div>
      </div>

      {loading
        ? <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Loading...</div>
        : activeTab === "subscriptions"
          ? <DataTable columns={subColumns} data={subs} pageSize={15} emptyMessage="No subscriptions yet" onRowClick={setSelected}
              actions={row => row.status === "active" ? [
                <button key="cancel" onClick={e => { e.stopPropagation(); handleCancel(row.id); }}
                  style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Cancel</button>
              ] : []}
            />
          : <DataTable columns={walletColumns} data={wallets} pageSize={15} emptyMessage="No wallets found" onRowClick={setSelected} />
      }

      {/* Create subscription modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, margin: 0 }}>New Subscription</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Vendor ID *</label>
                <input value={form.vendor_id} onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))} placeholder="Vendor UUID..."
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Plan *</label>
                  <select value={form.plan_id} onChange={e => { const p = PLAN_META[e.target.value]; setForm(f => ({ ...f, plan_id: e.target.value, price_paid: p?.price_monthly || "" })); }}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }}>
                    {Object.entries(PLAN_META).filter(([k]) => k !== "LITE").map(([k, v]) => <option key={k} value={k}>{v.label} — EGP {v.price_monthly}/mo</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Billing Cycle</label>
                  <select value={form.billing_cycle} onChange={e => setForm(f => ({ ...f, billing_cycle: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }}>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Amount Paid (EGP)</label>
                <input type="number" value={form.price_paid} onChange={e => setForm(f => ({ ...f, price_paid: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 6 }}>Payment Reference</label>
                <input value={form.payment_ref} onChange={e => setForm(f => ({ ...f, payment_ref: e.target.value }))} placeholder="Invoice or transaction ID..."
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={handleCreateSub} disabled={saving || !form.vendor_id}
                style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: !form.vendor_id ? "#e2e8f0" : "#D4AF37", color: "#fff", cursor: !form.vendor_id ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14 }}>
                {saving ? "Creating..." : "Create Subscription"}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" }}>
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
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, margin: 0 }}>Details</h3>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{selected.business_name || selected.vendor_name}</div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{selected.vendor_email}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {Object.entries({
              Plan:      selected.plan_id || selected.plan?.toUpperCase() || "—",
              Status:    selected.status || "—",
              Revenue:   "EGP " + Number(selected.price_paid || selected.balance || 0).toLocaleString(),
              Expires:   selected.expires_at ? new Date(selected.expires_at).toLocaleDateString() : selected.trial_end ? new Date(selected.trial_end).toLocaleDateString() : "—",
            }).map(([label, val]) => (
              <div key={label} style={{ padding: 10, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
          {selected.id && selected.status === "active" && (
            <button onClick={() => { handleCancel(selected.id); setSelected(null); }}
              style={{ width: "100%", marginTop: 16, padding: 12, borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
              Cancel Subscription
            </button>
          )}
        </div>
      )}
    </div>
  );
}


