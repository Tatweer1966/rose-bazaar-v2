import { useState } from "react";
import { DollarSign, TrendingUp, Users, Package, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";

const DEMO_STATS = {
  gmv: 285000, brokerRevenue: 28500, activeVendors: 18, totalLeads: 47, conversionRate: 34, avgDealSize: 15000,
  monthlyGmv: [42000, 55000, 38000, 67000, 48000, 35000],
  topCategories: [
    { name: "Venues", leads: 15, revenue: 12000, conversion: 40 },
    { name: "Photography", leads: 10, revenue: 4375, conversion: 35 },
    { name: "Catering", leads: 8, revenue: 5250, conversion: 25 },
    { name: "Flowers", leads: 7, revenue: 3500, conversion: 43 },
    { name: "Planning", leads: 5, revenue: 3000, conversion: 40 },
    { name: "Attire", leads: 2, revenue: 375, conversion: 50 },
  ],
  topVendors: [
    { name: "Grand Plaza Hall", category: "venues", leads: 8, revenue: 8000, rating: 4.9 },
    { name: "Luna Photography", category: "photography", leads: 6, revenue: 2625, rating: 4.8 },
    { name: "Bloom & Petal", category: "flowers", leads: 5, revenue: 2500, rating: 4.7 },
    { name: "Royal Catering", category: "catering", leads: 4, revenue: 2100, rating: 4.6 },
  ],
};

function StatCard({ icon: Icon, label, value, prefix = "", suffix = "", change, color }) {
  const up = change >= 0;
  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", padding: 20, boxShadow: "var(--card-shadow)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: "var(--radius-md)", background: color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={20} style={{ color }} />
        </div>
        {change !== undefined && (
          <div style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12, fontWeight: 600, color: up ? "#22c55e" : "#ef4444" }}>
            {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(change)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "var(--slate-900)" }}>{prefix}{typeof value === "number" ? value.toLocaleString() : value}{suffix}</div>
      <div style={{ fontSize: 13, color: "var(--slate-500)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function BrokerAnalytics() {
  const [period, setPeriod] = useState("month");
  const s = DEMO_STATS;

  return (
    <div>
      {/* Period filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {["week", "month", "quarter", "year"].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: "6px 14px", borderRadius: "var(--radius-md)", fontSize: 12, fontWeight: 600, textTransform: "capitalize",
            border: period === p ? "none" : "1px solid var(--card-border)",
            background: period === p ? "var(--coral)" : "var(--card-bg)",
            color: period === p ? "#fff" : "var(--slate-600)", cursor: "pointer",
          }}>{p}</button>
        ))}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard icon={DollarSign} label="Gross Marketplace Value" value={s.gmv} prefix="" suffix=" SAR" change={12} color="var(--coral)" />
        <StatCard icon={TrendingUp} label="Net Broker Revenue" value={s.brokerRevenue} prefix="" suffix=" SAR" change={8} color="var(--gold)" />
        <StatCard icon={Users} label="Active Vendors" value={s.activeVendors} change={5} color="#6366f1" />
        <StatCard icon={Package} label="Total Leads" value={s.totalLeads} change={15} color="#22c55e" />
        <StatCard icon={BarChart3} label="Conversion Rate" value={s.conversionRate} suffix="%" change={3} color="#f59e0b" />
        <StatCard icon={DollarSign} label="Avg Deal Size" value={s.avgDealSize} suffix=" SAR" change={-2} color="#64748b" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Top Categories */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--card-border)" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, margin: 0 }}>Revenue by Category</h3>
          </div>
          {s.topCategories.map((cat, i) => {
            const maxRev = Math.max(...s.topCategories.map(c => c.revenue));
            return (
              <div key={i} style={{ padding: "10px 20px", borderBottom: i < s.topCategories.length - 1 ? "1px solid var(--card-border)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{cat.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--coral)" }}>{cat.revenue.toLocaleString()} SAR</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "var(--slate-100)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, background: "var(--coral)", width: (cat.revenue / maxRev * 100) + "%", transition: "width 500ms" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2, fontSize: 11, color: "var(--slate-400)" }}>
                  <span>{cat.leads} leads</span><span>{cat.conversion}% conversion</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Vendors */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--card-border)" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, margin: 0 }}>Top Performing Vendors</h3>
          </div>
          {s.topVendors.map((v, i) => (
            <div key={i} style={{ padding: "12px 20px", borderBottom: i < s.topVendors.length - 1 ? "1px solid var(--card-border)" : "none", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(254,105,114,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--coral)" }}>
                #{i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{v.name}</div>
                <div style={{ fontSize: 11, color: "var(--slate-400)", textTransform: "capitalize" }}>{v.category} · {v.leads} leads</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gold)" }}>{v.revenue.toLocaleString()} SAR</div>
                <div style={{ fontSize: 11, color: "var(--slate-400)" }}>Rating: {v.rating}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
