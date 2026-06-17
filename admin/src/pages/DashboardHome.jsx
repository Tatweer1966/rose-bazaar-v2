import { useState, useEffect } from "react";
import { FileText, Clock, Plus, Upload, Settings, TrendingUp, Layers, CheckCircle, Users, Package, ShoppingBag, Star } from "lucide-react";

const API = "/api/cms";

const STAT_CARDS = [
  { key: "vendors", label: "Total Vendors", icon: Users, color: "var(--coral)", bg: "rgba(254,105,114,0.08)" },
  { key: "listings", label: "Active Listings", icon: Package, color: "var(--gold)", bg: "rgba(212,175,55,0.08)" },
  { key: "pages", label: "CMS Pages", icon: FileText, color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
  { key: "pending", label: "Pending Approvals", icon: Clock, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
];

const QUICK_ACTIONS = [
  { label: "Review Vendors", icon: Users, page: "vendors", color: "var(--coral)" },
  { label: "Manage Listings", icon: Package, page: "listings", color: "var(--gold)" },
  { label: "Edit Pages", icon: FileText, page: "pages", color: "#6366f1" },
  { label: "Settings", icon: Settings, page: "settings", color: "#64748b" },
];

export default function DashboardHome({ onNavigate }) {
  const [stats, setStats] = useState({ vendors: 0, listings: 0, pages: 0, pending: 0 });
  const [recentVendors, setRecentVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pagesRes, vendorsRes] = await Promise.all([
          fetch(API + "/admin/pages").then(r => { if (!r.ok) throw new Error("API not ready"); return r.json(); }),
          fetch(API + "/admin/vendors").then(r => { if (!r.ok) throw new Error("API not ready"); return r.json(); }),
        ]);
        const pages = Array.isArray(pagesRes) ? pagesRes : pagesRes?.data || [];
        const vendors = Array.isArray(vendorsRes) ? vendorsRes : vendorsRes?.data || [];
        const pending = vendors.filter(v => v.status === "pending").length;
        setStats({ vendors: vendors.length, listings: 0, pages: pages.length, pending });
        setRecentVendors(vendors.slice(0, 5));
      } catch (e) {
        console.error("Dashboard load:", e);
        // Demo stats
        setStats({ vendors: 12, listings: 47, pages: 7, pending: 3 });
        setRecentVendors([
          { id: 1, business_name: "Bloom & Petal Florals", category: "flowers", status: "pending" },
          { id: 2, business_name: "Royal Venue Events", category: "venues", status: "approved" },
          { id: 3, business_name: "Lens of Love Photography", category: "photography", status: "pending" },
        ]);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const statusColor = { pending: "#f59e0b", approved: "#22c55e", rejected: "#ef4444" };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        {STAT_CARDS.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.key} style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", padding: 20, boxShadow: "var(--card-shadow)", cursor: "pointer", transition: "all 200ms" }} onClick={() => card.key === "pending" ? onNavigate("vendors") : onNavigate(card.key === "vendors" ? "vendors" : card.key === "listings" ? "listings" : "pages")}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: "var(--radius-md)", background: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={20} style={{ color: card.color }} />
                </div>
                <TrendingUp size={16} style={{ color: "var(--slate-400)" }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "var(--slate-900)" }}>
                {loading ? "—" : stats[card.key]}
              </div>
              <div style={{ fontSize: 13, color: "var(--slate-500)", marginTop: 2 }}>{card.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, fontFamily: "'Playfair Display', serif" }}>Recent Vendors</h2>
            <button onClick={() => onNavigate("vendors")} style={{ fontSize: 12, color: "var(--coral)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>View All</button>
          </div>
          {loading ? <div style={{ padding: 40, textAlign: "center", color: "var(--slate-400)" }}>Loading...</div> :
           recentVendors.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: "var(--slate-400)" }}>No vendors yet</div> :
           recentVendors.map((v, i) => (
            <div key={v.id || i} style={{ padding: "12px 20px", borderBottom: i < recentVendors.length - 1 ? "1px solid var(--card-border)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--slate-900)" }}>{v.business_name}</div>
                <div style={{ fontSize: 12, color: "var(--slate-400)", marginTop: 2, textTransform: "capitalize" }}>{v.category}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: `${statusColor[v.status] || "#64748b"}18`, color: statusColor[v.status] || "#64748b", textTransform: "capitalize" }}>{v.status}</span>
            </div>
          ))}
        </div>

        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--card-shadow)", padding: 20, height: "fit-content" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, fontFamily: "'Playfair Display', serif" }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {QUICK_ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <button key={action.label} onClick={() => onNavigate(action.page)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--card-border)", background: "var(--card-bg)", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "var(--slate-700)", fontFamily: "'DM Sans', sans-serif", width: "100%", textAlign: "left" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "var(--radius-sm)", background: action.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={17} style={{ color: action.color }} />
                  </div>
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
