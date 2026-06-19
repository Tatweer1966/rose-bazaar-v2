import { useState, useEffect } from "react";
import {
  Users, DollarSign, MessageSquare, TrendingUp, ShoppingBag,
  Building2, Clock, Star, Crown, Zap, Check, Megaphone,
  AlertTriangle, CheckCircle, RefreshCw, ArrowUpRight,
  Package, BarChart3, Flame, Shield, Eye, Receipt
} from "lucide-react";

const API = "/api/cms";

const PLAN_COLORS = { TOP: "#D4AF37", PRO: "#6366f1", BASIC: "#22c55e", LITE: "#94a3b8", free: "#94a3b8" };

function StatBox({ label, value, color = "#0f172a", bg = "#f8fafc", alert = false, good = false, onClick }) {
  return (
    <div onClick={onClick}
      style={{ padding: "10px 12px", borderRadius: 8, background: alert ? "rgba(245,158,11,0.06)" : good ? "rgba(34,197,94,0.06)" : bg, border: `1px solid ${alert ? "rgba(245,158,11,0.2)" : good ? "rgba(34,197,94,0.15)" : "#f1f5f9"}`, cursor: onClick ? "pointer" : "default" }}>
      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: alert ? "#f59e0b" : good ? "#22c55e" : color }}>{value ?? "—"}</div>
      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{label}</div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, color, children, onNavigate, page }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={16} style={{ color }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{title}</span>
        </div>
        {page && <button onClick={() => onNavigate(page)} style={{ fontSize: 11, color, background: "none", border: "none", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
          View All <ArrowUpRight size={11} />
        </button>}
      </div>
      {children}
    </div>
  );
}

export default function DashboardHome({ onNavigate }) {
  const [data,        setData]        = useState(null);
  const [marketplace, setMarketplace] = useState(null);
  const [vendors,     setVendors]     = useState([]);
  const [pendingShop, setPendingShop] = useState([]);
  const [topCats,     setTopCats]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [dashRes, mktRes, vendorRes, shopRes, catsRes] = await Promise.all([
        fetch(API + "/admin/stats/dashboard").then(r => r.ok ? r.json() : null),
        fetch(API + "/admin/stats/marketplace").then(r => r.ok ? r.json() : null),
        fetch(API + "/admin/vendors").then(r => r.ok ? r.json() : null),
        fetch(API + "/shop/admin/products?status=pending").then(r => r.ok ? r.json() : null),
        fetch(API + "/services/categories/with-counts").then(r => r.ok ? r.json() : null),
      ]);
      if (dashRes?.success)  setData(dashRes.data);
      if (mktRes?.success)   setMarketplace(mktRes.data);
      if (vendorRes?.result?.data || vendorRes?.data) setVendors((vendorRes?.result?.data || vendorRes?.data || []).slice(0, 5));
      if (shopRes?.success)  setPendingShop(shopRes.data?.slice(0, 4) || []);
      if (catsRes?.success)  setTopCats((catsRes.data || []).slice(0, 5));
      setLastUpdated(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const d  = data || {};
  const s  = d.shop    || {};
  const v  = d.vendors || {};
  const l  = d.leads   || {};
  const r  = d.revenue || {};
  const mk = marketplace || {};

  const hasPending = (s.pending_listings || 0) > 0 || (v.pending_vendors || 0) > 0;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, margin: 0, color: "#0f172a" }}>
            Marketplace Dashboard
          </h1>
          {lastUpdated && <p style={{ fontSize: 11, color: "#94a3b8", margin: "3px 0 0" }}>
            Updated {lastUpdated.toLocaleTimeString()}
          </p>}
        </div>
        <button onClick={load} disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 12 }}>
          <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />Refresh
        </button>
      </div>

      {/* ── Alert Banner ── */}
      {!loading && hasPending && (
        <div style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.08),rgba(254,105,114,0.08))", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "12px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <AlertTriangle size={18} style={{ color: "#f59e0b", flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#92400e" }}>
            Action Required —
            {(s.pending_listings || 0) > 0 && ` ${s.pending_listings} shop listings pending. `}
            {(v.pending_vendors  || 0) > 0 && ` ${v.pending_vendors} vendors awaiting approval.`}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(s.pending_listings || 0) > 0 && <button onClick={() => onNavigate("listings")} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#FE6972", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Review Listings</button>}
            {(v.pending_vendors  || 0) > 0 && <button onClick={() => onNavigate("vendor-approvals")} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#f59e0b", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Approve Vendors</button>}
          </div>
        </div>
      )}

      {/* ── ROW 1: Executive KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Vendors",    value: (parseInt(v.active_vendors||0) + parseInt(v.pending_vendors||0)),  icon: Users,       color: "#6366f1", page: "vendors"   },
          { label: "Total Leads",      value: parseInt(l.total_leads||0),                                         icon: MessageSquare,color: "#FE6972", page: "leads"     },
          { label: "Total Revenue",    value: "EGP " + Number(r.total_revenue||0).toLocaleString(),               icon: DollarSign,  color: "#D4AF37", page: "reports"   },
          { label: "Conversion Rate",  value: (l.conversion_rate||0) + "%",                                       icon: TrendingUp,  color: "#22c55e", page: "analytics" },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} onClick={() => onNavigate(kpi.page)}
              style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", transition: "all 200ms" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: kpi.color + "12", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} style={{ color: kpi.color }} />
                </div>
                <ArrowUpRight size={14} style={{ color: "#94a3b8" }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: "#0f172a" }}>{loading ? "—" : kpi.value}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── ROW 2: Marketplace Inventory ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {/* Shop Products */}
        <SectionCard title="Shop Products" icon={ShoppingBag} color="#FE6972" onNavigate={onNavigate} page="listings">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <StatBox label="Live"     value={s.active_listings   || 0} good />
            <StatBox label="Pending"  value={s.pending_listings  || 0} alert={s.pending_listings > 0} onClick={() => onNavigate("listings")} />
            <StatBox label="Featured" value={s.featured_listings || 0} color="#D4AF37" />
            <StatBox label="Rejected" value={s.rejected_listings || 0} />
          </div>
        </SectionCard>

        {/* Wedding Services */}
        <SectionCard title="Wedding Services" icon={Star} color="#6366f1" onNavigate={onNavigate} page="vendor-list">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <StatBox label="Active"   value={mk.services_active  || 0} good />
            <StatBox label="Pending"  value={mk.services_pending || 0} alert={mk.services_pending > 0} />
            <StatBox label="Verified" value={mk.services_verified|| 0} color="#22c55e" />
            <StatBox label="TOP Plan" value={mk.services_top     || 0} color="#D4AF37" />
          </div>
        </SectionCard>

        {/* Venues */}
        <SectionCard title="Wedding Venues" icon={Building2} color="#8b5cf6" onNavigate={onNavigate} page="vendor-list">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <StatBox label="Active"    value={mk.venues_active   || 0} good />
            <StatBox label="Pending"   value={mk.venues_pending  || 0} alert={mk.venues_pending > 0} />
            <StatBox label="Inquiries" value={mk.venues_inquiries|| 0} color="#8b5cf6" />
            <StatBox label="Cities"    value={mk.venues_cities   || 0} />
          </div>
        </SectionCard>

        {/* Happy Hour */}
        <SectionCard title="Happy Hour" icon={Flame} color="#f59e0b" onNavigate={onNavigate} page="listings">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <StatBox label="Active Deals"    value={mk.deals_active        || 0} good />
            <StatBox label="Expiring Today"  value={mk.deals_expiring_today|| 0} alert={mk.deals_expiring_today > 0} />
            <StatBox label="This Week"       value={mk.deals_expiring_week || 0} />
            <StatBox label="Happy Hr Vendors"value={mk.happyhour_vendors   || 0} color="#f59e0b" />
          </div>
        </SectionCard>
      </div>

      {/* ── ROW 3: Revenue Sources ── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#D4AF3712", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={16} style={{ color: "#D4AF37" }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Revenue Breakdown</span>
          </div>
          <button onClick={() => onNavigate("reports")} style={{ fontSize: 11, color: "#D4AF37", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Full Report →</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
          {[
            { label: "Subscriptions",    value: r.subscription_revenue || 0, color: "#6366f1" },
            { label: "Sponsored Ads",    value: r.featured_revenue     || 0, color: "#D4AF37" },
            { label: "Listing Fees",     value: r.listing_revenue      || 0, color: "#FE6972" },
            { label: "Lead Fees",        value: 0,                           color: "#22c55e" },
            { label: "Commissions",      value: r.commission_revenue   || 0, color: "#f59e0b" },
          ].map(rev => (
            <div key={rev.label} style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #f1f5f9", background: rev.color + "05", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: rev.color }}>
                {loading ? "—" : "EGP " + Number(rev.value).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{rev.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ROW 4: Operations ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Pending Queue */}
        <SectionCard title="Pending Review Queue" icon={AlertTriangle} color="#f59e0b" onNavigate={onNavigate} page="listings">
          {loading ? <div style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>Loading...</div>
          : pendingShop.length === 0
            ? <div style={{ padding: 20, textAlign: "center" }}>
                <CheckCircle size={28} style={{ color: "#22c55e", marginBottom: 6, display: "block", margin: "0 auto 6px" }} />
                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>All caught up!</p>
              </div>
            : pendingShop.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < pendingShop.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", background: "#f1f5f9", flexShrink: 0 }}>
                  {p.cover_image ? <img src={p.cover_image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ShoppingBag size={16} style={{ color: "#94a3b8", margin: "10px auto", display: "block" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{p.category_name} · EGP {Number(p.price).toLocaleString()}</div>
                </div>
                <button onClick={() => onNavigate("listings")} style={{ padding: "3px 8px", borderRadius: 5, border: "none", background: "rgba(34,197,94,0.1)", color: "#22c55e", cursor: "pointer", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>Review</button>
              </div>
            ))}
        </SectionCard>

        {/* Vendor Health */}
        <SectionCard title="Vendor Health" icon={Shield} color="#22c55e" onNavigate={onNavigate} page="vendors">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <StatBox label="Active Vendors"   value={v.active_vendors   || 0} good />
            <StatBox label="Pending Approval" value={v.pending_vendors  || 0} alert={v.pending_vendors > 0} onClick={() => onNavigate("vendor-approvals")} />
            <StatBox label="TOP Plan"         value={v.top_plan_vendors || 0} color="#D4AF37" />
            <StatBox label="PRO Plan"         value={v.pro_plan_vendors || 0} color="#6366f1" />
          </div>
          <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: "linear-gradient(135deg,rgba(212,175,55,0.08),rgba(99,102,241,0.08))", border: "1px solid rgba(212,175,55,0.15)" }}>
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>Subscription Plans</div>
            <div style={{ display: "flex", gap: 10" }}>
              {[["TOP","#D4AF37",v.top_plan_vendors||0],["PRO","#6366f1",v.pro_plan_vendors||0],["BASIC","#22c55e",0],["LITE","#94a3b8",0]].map(([plan,color,count]) => (
                <div key={plan} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color }}>{count}</div>
                  <div style={{ fontSize: 9, color: "#94a3b8" }}>{plan}</div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── ROW 5: Sponsored Placements + Lead Pipeline + Top Categories ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Sponsored Placements */}
        <SectionCard title="Advertising" icon={Megaphone} color="#D4AF37" onNavigate={onNavigate} page="sponsored">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
            <StatBox label="Active Campaigns" value={0} good />
            <StatBox label="Revenue"          value={"EGP " + Number(r.featured_revenue||0).toLocaleString()} color="#D4AF37" />
          </div>
          {[
            { label: "Featured Listing",   price: "EGP 500/wk",  color: "#FE6972" },
            { label: "Homepage Banner",    price: "EGP 1,500/wk",color: "#D4AF37" },
            { label: "Category Boost",     price: "EGP 300/wk",  color: "#6366f1" },
            { label: "Top of Page",        price: "EGP 800/wk",  color: "#22c55e" },
          ].map(p => (
            <div key={p.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f8fafc" }}>
              <span style={{ fontSize: 11, color: "#475569" }}>{p.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{p.price}</span>
            </div>
          ))}
          <button onClick={() => onNavigate("sponsored")} style={{ width: "100%", marginTop: 10, padding: "8px", borderRadius: 8, border: "none", background: "#D4AF37", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            + New Placement
          </button>
        </SectionCard>

        {/* Lead Pipeline */}
        <SectionCard title="Lead Pipeline" icon={MessageSquare} color="#FE6972" onNavigate={onNavigate} page="leads">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
            <StatBox label="New Leads"      value={l.new_leads       || 0} alert={l.new_leads > 0} />
            <StatBox label="Won"            value={l.won_leads        || 0} good />
            <StatBox label="Shop Inquiries" value={s.total_inquiries  || 0} color="#6366f1" />
            <StatBox label="Conversion"     value={(l.conversion_rate || 0) + "%"} color="#FE6972" />
          </div>
          {/* Mini funnel */}
          {[
            { label: "New",          count: l.new_leads       || 0, color: "#6366f1" },
            { label: "Contacted",    count: l.contacted_leads || 0, color: "#f59e0b" },
            { label: "Won",          count: l.won_leads       || 0, color: "#22c55e" },
          ].map(stage => {
            const pct = l.total_leads > 0 ? Math.round(stage.count / l.total_leads * 100) : 0;
            return (
              <div key={stage.label} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 10, color: "#64748b" }}>{stage.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: stage.color }}>{stage.count} ({pct}%)</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, background: stage.color, width: pct + "%" }} />
                </div>
              </div>
            );
          })}
        </SectionCard>

        {/* Top Categories */}
        <SectionCard title="Top Service Categories" icon={BarChart3} color="#8b5cf6" onNavigate={onNavigate} page="analytics">
          {topCats.length === 0
            ? <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>No category data yet</div>
            : topCats.map((cat, i) => {
              const maxCount = Math.max(...topCats.map(c => c.vendor_count || 0), 1);
              return (
                <div key={cat.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>#{i+1}</span>
                      <span style={{ fontSize: 11, color: "#334155" }}>{cat.name}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cat.color || "#8b5cf6" }}>{cat.vendor_count || 0}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "#f1f5f9", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 2, background: cat.color || "#8b5cf6", width: ((cat.vendor_count || 0) / maxCount * 100) + "%" }} />
                  </div>
                </div>
              );
            })}
        </SectionCard>
      </div>

      {/* ── ROW 6: Recent Vendors ── */}
      <SectionCard title="Recent Vendors" icon={Users} color="#6366f1" onNavigate={onNavigate} page="vendors">
        {loading ? <div style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}>Loading...</div>
        : vendors.length === 0
          ? <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No vendors yet</div>
          : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10" }}>
              {vendors.map((vnd, i) => {
                const status = vnd.registration_status || vnd.status;
                const statusColor = { approved: "#22c55e", submitted: "#f59e0b", rejected: "#ef4444" }[status] || "#94a3b8";
                return (
                  <div key={vnd.id || i} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #f1f5f9", background: "#f8fafc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", lineHeight: 1.3 }}>{vnd.business_name}</div>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10, background: statusColor + "18", color: statusColor, whiteSpace: "nowrap", marginLeft: 4 }}>{status}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3, textTransform: "capitalize" }}>{vnd.category_name || vnd.category || vnd.vendor_type}</div>
                    {vnd.plan_type && vnd.plan_type !== "LITE" && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: (PLAN_COLORS[vnd.plan_type] || "#94a3b8") + "18", color: PLAN_COLORS[vnd.plan_type] || "#94a3b8" }}>{vnd.plan_type}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
      </SectionCard>
    </div>
  );
}
