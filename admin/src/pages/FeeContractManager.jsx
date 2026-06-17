import { useState, useEffect } from "react";
import { DollarSign, Edit3, Save, X, Gift, CreditCard, Clock, TrendingUp, AlertTriangle, CheckCircle, Star, Wallet, Receipt, ArrowUpRight, ArrowDownRight } from "lucide-react";
import DataTable from "../components/DataTable";

const API = "/api/cms";
const CURRENCIES = ["EGP", "USD", "EUR", "GBP", "AED", "KWD", "BHD", "QAR"];

const CATEGORY_FEES = {
  venues: 200, photography: 100, catering: 150, flowers: 80,
  planning: 120, decorations: 90, invitations: 50, entertainment: 100, attire: 75,
};

const PLANS = [
  { id: "free", name: "Free Trial", price: 0, listings: 3, duration: "30 days", color: "#6366f1", features: ["3 free listings", "30 day trial", "Basic profile"] },
  { id: "basic", name: "Basic", price: 300, listings: 10, duration: "/month", color: "#f59e0b", features: ["10 listings/month", "No per-listing fee", "Standard support"] },
  { id: "pro", name: "Pro", price: 1000, listings: "Unlimited", duration: "/month", color: "var(--coral)", features: ["Unlimited listings", "Featured discount", "Priority placement", "Premium support"] },
];

const DEMO_VENDORS = [
  { id: 1, vendor_name: "Grand Plaza Hall", category: "venues", plan: "pro", currency: "EGP", wallet_balance: 2500, listing_fee: 200, free_remaining: 0, total_listings: 5, paid_listings: 5, total_paid: 3200, trial_start: "2026-03-15", trial_end: "2026-04-14", status: "active", last_payment: "2026-05-10", transactions: [
    { date: "2026-05-10", type: "payment", amount: 1000, desc: "Pro Plan - May" },
    { date: "2026-04-10", type: "payment", amount: 1000, desc: "Pro Plan - April" },
    { date: "2026-03-20", type: "listing_fee", amount: 200, desc: "Listing: Grand Ballroom" },
  ]},
  { id: 2, vendor_name: "Luna Photography", category: "photography", plan: "free", currency: "USD", wallet_balance: 0, listing_fee: 25, free_remaining: 1, total_listings: 2, paid_listings: 0, total_paid: 0, trial_start: "2026-05-01", trial_end: "2026-05-31", status: "trial", last_payment: null, transactions: [] },
  { id: 3, vendor_name: "Eternal Bridal", category: "attire", plan: "free", currency: "EGP", wallet_balance: 0, listing_fee: 75, free_remaining: 3, total_listings: 0, paid_listings: 0, total_paid: 0, trial_start: "2026-05-10", trial_end: "2026-06-09", status: "trial", last_payment: null, transactions: [] },
  { id: 4, vendor_name: "Bloom & Petal", category: "flowers", plan: "basic", currency: "EGP", wallet_balance: 150, listing_fee: 80, free_remaining: 0, total_listings: 7, paid_listings: 4, total_paid: 920, trial_start: "2026-02-20", trial_end: "2026-03-22", status: "active", last_payment: "2026-05-01", transactions: [
    { date: "2026-05-01", type: "payment", amount: 300, desc: "Basic Plan - May" },
    { date: "2026-04-15", type: "listing_fee", amount: 80, desc: "Listing: Spring Collection" },
    { date: "2026-04-01", type: "payment", amount: 300, desc: "Basic Plan - April" },
  ]},
  { id: 5, vendor_name: "Royal Catering Co.", category: "catering", plan: "free", currency: "EGP", wallet_balance: 0, listing_fee: 150, free_remaining: 2, total_listings: 1, paid_listings: 0, total_paid: 0, trial_start: "2026-04-28", trial_end: "2026-05-28", status: "trial", last_payment: null, transactions: [] },
  { id: 6, vendor_name: "Elegance Planners", category: "planning", plan: "free", currency: "EGP", wallet_balance: 0, listing_fee: 120, free_remaining: 0, total_listings: 4, paid_listings: 0, total_paid: 0, trial_start: "2026-01-15", trial_end: "2026-02-14", status: "expired", last_payment: null, transactions: [] },
];

function daysLeft(endDate) {
  const d = Math.ceil((new Date(endDate) - new Date()) / (1000*60*60*24));
  return d > 0 ? d : 0;
}

function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height: 6, borderRadius: 3, background: "#e2e8f0", width: 60, overflow: "hidden" }}>
      <div style={{ height: "100%", borderRadius: 3, background: color || "var(--coral)", width: pct + "%", transition: "width 300ms" }} />
    </div>
  );
}

export default function FeeContractManager() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [realKpis, setRealKpis] = useState(null);
  const [tab, setTab] = useState("overview");

  async function load() {
      try {
        const [walletsRes, kpisRes] = await Promise.all([
          fetch(API + "/admin/wallets").then(r => { if (!r.ok) throw new Error("API"); return r.json(); }),
          fetch(API + "/admin/kpis/monetization").then(r => r.ok ? r.json() : null),
        ]);
        const wallets = walletsRes?.data || [];
        // Map wallet data to vendor format
        const mapped = wallets.map(w => ({
          id: w.id,
          vendor_name: w.vendor_name,
          category: "vendor",
          plan: w.plan,
          currency: w.currency || "EGP",
          wallet_balance: parseFloat(w.balance) || 0,
          listing_fee: 100,
          free_remaining: w.plan_listings_limit === -1 ? -1 : Math.max(0, w.plan_listings_limit - (w.plan_listings_used || 0)),
          total_listings: w.plan_listings_used || 0,
          paid_listings: 0,
          total_paid: parseFloat(w.total_paid) || 0,
          trial_start: w.trial_start,
          trial_end: w.trial_end,
          status: w.plan === "free" && new Date(w.trial_end) < new Date() ? "expired" : w.plan === "free" ? "trial" : "active",
          last_payment: null,
          transactions: [],
          vendor_id: w.vendor_id,
        }));
        setVendors(mapped);
        if (kpisRes) setRealKpis(kpisRes);
      } catch(e) { console.error("Load:", e); setVendors(DEMO_VENDORS); }
      finally { setLoading(false); }
    }
useEffect(() => { load(); }, []);

  // Stats
  const totalRevenue = realKpis?.total_revenue || vendors.reduce((s, v) => s + (v.total_paid || 0), 0);
  const activeVendors = vendors.filter(v => v.status === "active").length;
  const trialVendors = vendors.filter(v => v.status === "trial").length;
  const expiredVendors = vendors.filter(v => v.status === "expired").length;
  const totalWallets = realKpis?.total_wallet_balance || vendors.reduce((s, v) => s + (v.wallet_balance || 0), 0);

  const statusStyle = {
    active: { bg: "rgba(34,197,94,0.1)", color: "#22c55e", label: "Active" },
    trial: { bg: "rgba(99,102,241,0.1)", color: "#6366f1", label: "Trial" },
    expired: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", label: "Expired" },
  };

  const columns = [
    { key: "vendor_name", label: "Vendor", render: (v, row) => (
      <div><div style={{ fontWeight: 600 }}>{v}</div><div style={{ fontSize: 11, color: "#94a3b8", textTransform: "capitalize" }}>{row.category}</div></div>
    )},
    { key: "plan", label: "Plan", render: v => {
      const p = PLANS.find(pl => pl.id === v) || PLANS[0];
      return <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: p.color + "18", color: p.color }}>{p.name}</span>;
    }},
    { key: "status", label: "Status", render: (v, row) => {
      const s = statusStyle[v] || statusStyle.trial;
      const days = v === "trial" ? daysLeft(row.trial_end) : null;
      return (
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>
          {days !== null && days <= 7 && <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 600, marginTop: 2 }}>{days}d left!</div>}
        </div>
      );
    }},
    { key: "free_remaining", label: "Free Posts", render: (v, row) => (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {v === -1 ? null : <ProgressBar value={v} max={3} color={v > 0 ? "#6366f1" : "#ef4444"} />}
        <span style={{ fontSize: 12, fontWeight: 600, color: v === -1 ? "#22c55e" : v > 0 ? "#6366f1" : "#ef4444" }}>{v === -1 ? "Unlimited" : v + "/3"}</span>
      </div>
    )},
    { key: "wallet_balance", label: "Wallet", render: (v, row) => (
      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: v > 0 ? "#22c55e" : "#94a3b8" }}>
        {v?.toLocaleString()} {row.currency}
      </span>
    )},
    { key: "total_paid", label: "Total Revenue", render: (v, row) => (
      <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{v?.toLocaleString()} {row.currency}</span>
    )},
  ];

  return (
    <div>
      {/* Revenue KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { icon: DollarSign, label: "Total Revenue", value: totalRevenue.toLocaleString() + " EGP", color: "var(--coral)", change: 12 },
          { icon: Wallet, label: "Wallet Balances", value: totalWallets.toLocaleString() + " EGP", color: "#22c55e", change: 5 },
          { icon: CheckCircle, label: "Active Vendors", value: activeVendors, color: "#6366f1", change: 8 },
          { icon: Clock, label: "On Trial", value: trialVendors, color: "#f59e0b", change: -3 },
          { icon: AlertTriangle, label: "Expired", value: expiredVendors, color: "#ef4444", change: 0 },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: stat.color + "12", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} style={{ color: stat.color }} />
                </div>
                {stat.change !== 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: stat.change > 0 ? "#22c55e" : "#ef4444", display: "flex", alignItems: "center", gap: 2 }}>
                    {stat.change > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{Math.abs(stat.change)}%
                  </span>
                )}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "#0f172a" }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Plans + Category Fees */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Subscription Plans */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, marginBottom: 12 }}>Subscription Plans</h3>
          <div style={{ display: "flex", gap: 8 }}>
            {PLANS.map(p => (
              <div key={p.id} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #e2e8f0", textAlign: "center", background: p.id === "pro" ? "linear-gradient(135deg, rgba(254,105,114,0.05), rgba(212,175,55,0.05))" : "#fff" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: p.color, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{p.price === 0 ? "Free" : p.price + " EGP"}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.duration}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{p.listings} listings</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Fees */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, marginBottom: 12 }}>Per-Listing Fees by Category</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {Object.entries(CATEGORY_FEES).map(([cat, fee]) => (
              <div key={cat} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "capitalize" }}>{cat}</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{fee} EGP</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 6, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
            <div style={{ fontSize: 10, color: "#D4AF37" }}>Featured Listing</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#D4AF37" }}>50 EGP/week</div>
          </div>
        </div>
      </div>

      {/* Vendor Table */}
      {loading ? <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading...</div> : (
        <DataTable
          columns={columns}
          data={vendors}
          pageSize={10}
          emptyMessage="No vendor contracts"
          onRowClick={row => (() => { setSelected(row); if (row.vendor_id) fetch(API + "/admin/transactions?vendor_id=" + row.vendor_id).then(r => r.ok ? r.json() : null).then(d => { if (d?.data) setSelected(prev => prev ? {...prev, transactions: d.data} : prev); }); })()}
          actions={row => [
            <button key="view" onClick={() => setSelected(row)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><Receipt size={13} /> Details</button>,
          ]}
        />
      )}

      {/* Vendor Detail Drawer with Payment History */}
      {selected && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 440, background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 50, padding: 24, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Vendor Billing</h3>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
          </div>

          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: 2 }}>{selected.vendor_name}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "capitalize", marginBottom: 16 }}>{selected.category}</div>

          {/* Plan + Status */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {(() => { const p = PLANS.find(pl => pl.id === selected.plan) || PLANS[0]; return <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: p.color + "18", color: p.color }}>{p.name}</span>; })()}
            {(() => { const s = statusStyle[selected.status]; return <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>; })()}
            {selected.status === "trial" && <span style={{ fontSize: 11, fontWeight: 600, color: daysLeft(selected.trial_end) <= 7 ? "#ef4444" : "#64748b" }}>{daysLeft(selected.trial_end)} days left</span>}
          </div>

          {/* Billing Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div style={{ padding: 12, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <Wallet size={16} style={{ color: "#22c55e", marginBottom: 4 }} />
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{selected.wallet_balance?.toLocaleString()} {selected.currency}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Wallet Balance</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <DollarSign size={16} style={{ color: "var(--coral)", marginBottom: 4 }} />
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{selected.total_paid?.toLocaleString()} {selected.currency}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Total Revenue</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <Gift size={16} style={{ color: "#6366f1", marginBottom: 4 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ProgressBar value={selected.free_remaining} max={3} color="#6366f1" />
                <span style={{ fontSize: 14, fontWeight: 700 }}>{selected.free_remaining === -1 ? "Unlimited" : selected.free_remaining + "/3"}</span>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Free Posts Left</div>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <CreditCard size={16} style={{ color: "#f59e0b", marginBottom: 4 }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>{selected.listing_fee} {selected.currency}/listing</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Per-Listing Fee</div>
            </div>
          </div>

          {/* Enforcement Warning */}
          {selected.free_remaining === 0 && selected.wallet_balance === 0 && selected.plan === "free" && (
            <div style={{ padding: 12, borderRadius: 8, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} style={{ color: "#ef4444" }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#ef4444" }}>Cannot publish new listings</div>
                <div style={{ fontSize: 11, color: "#7f1d1d" }}>Free posts used up. Vendor must upgrade or add wallet funds.</div>
              </div>
            </div>
          )}

          {/* Payment History */}
          <div style={{ marginTop: 8 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: "#0f172a" }}>Transaction History</h4>
            {(!selected.transactions || selected.transactions.length === 0) ? (
              <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13, background: "#f8fafc", borderRadius: 8 }}>No transactions yet</div>
            ) : selected.transactions.map((tx, i) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: i < selected.transactions.length - 1 ? "1px solid #f1f5f9" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#0f172a" }}>{tx.description || tx.desc || "Transaction"}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}><span style={{ textTransform: "capitalize", fontSize: 10, padding: "1px 6px", borderRadius: 4, background: tx.type === "subscription" ? "rgba(99,102,241,0.1)" : tx.type === "wallet_topup" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", color: tx.type === "subscription" ? "#6366f1" : tx.type === "wallet_topup" ? "#22c55e" : "#f59e0b" }}>{(tx.type || "payment").replace("_", " ")}</span>{tx.date || tx.created_at ? new Date(tx.date || tx.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Recent"}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: tx.type === "refund" ? "#ef4444" : "#22c55e" }}>
                  {tx.type === "refund" ? "-" : "+"}{tx.amount} {selected.currency}
                </div>
              </div>
            ))}
          </div>

          {/* Admin Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button onClick={() => { const amt = prompt("Enter amount to add (EGP):"); if (amt && !isNaN(amt) && selected.vendor_id) { fetch(API + "/admin/wallets/" + selected.vendor_id + "/add-funds", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({amount: parseFloat(amt)}) }).then(r => r.json()).then(() => { alert("Funds added!"); setSelected(null); load(); }); } }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Wallet size={14} /> Add Funds</button>
            <button onClick={() => { const plan = prompt("Enter plan (basic or pro):"); if (plan && selected.vendor_id) { fetch(API + "/admin/wallets/" + selected.vendor_id + "/upgrade", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({plan}) }).then(r => r.json()).then(d => { if (d.success) { alert("Plan upgraded to " + plan + "!"); setSelected(null); load(); } else alert(d.error || "Failed"); }); } }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#6366f1", cursor: "pointer", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><TrendingUp size={14} /> Upgrade Plan</button>
          </div>
        </div>
      )}
    </div>
  );
}
