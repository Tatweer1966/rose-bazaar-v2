import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Users, Package, BarChart3, ArrowUpRight, ArrowDownRight, Receipt, Calendar } from "lucide-react";

const API = "/api/cms";

export default function FinancialReports() {
  const [kpis, setKpis] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const [kpiRes, txRes] = await Promise.all([
          fetch(API + "/admin/kpis/monetization").then(r => r.ok ? r.json() : null),
          fetch(API + "/admin/transactions").then(r => r.ok ? r.json() : { data: [] }),
        ]);
        setKpis(kpiRes);
        setTransactions(txRes?.data || []);
      } catch (e) { console.error("Reports load:", e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const txByType = kpis?.transactions_by_type || {};
  const planCounts = kpis?.vendors_by_plan || {};

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Loading reports...</div>;

  return (
    <div>
      {/* Period selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {["all", "month", "week"].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, textTransform: "capitalize", border: period === p ? "none" : "1px solid #e2e8f0", background: period === p ? "var(--coral, #FE6972)" : "#fff", color: period === p ? "#fff" : "#64748b", cursor: "pointer" }}>{p === "all" ? "All Time" : "This " + p}</button>
        ))}
      </div>

      {/* Revenue KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <DollarSign size={20} style={{ color: "var(--coral, #FE6972)", marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{(kpis?.total_revenue || 0).toLocaleString()} EGP</div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Total Revenue</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <TrendingUp size={20} style={{ color: "#22c55e", marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{(kpis?.total_wallet_balance || 0).toLocaleString()} EGP</div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Wallet Balances</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <Users size={20} style={{ color: "#6366f1", marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{kpis?.total_vendors || 0}</div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Total Vendors</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <Receipt size={20} style={{ color: "#f59e0b", marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{transactions.length}</div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Total Transactions</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Revenue by Type */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, margin: 0 }}>Revenue by Type</h3>
          </div>
          {Object.entries(txByType).length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No transactions yet</div>
          ) : Object.entries(txByType).map(([type, data], i, arr) => {
            const maxTotal = Math.max(...Object.values(txByType).map(d => d.total));
            const colors = { subscription: "#6366f1", listing_fee: "#f59e0b", wallet_topup: "#22c55e", deduction: "#ef4444" };
            return (
              <div key={type} style={{ padding: "12px 20px", borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, textTransform: "capitalize" }}>{type.replace("_", " ")}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: colors[type] || "#0f172a" }}>{data.total.toLocaleString()} EGP</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, background: colors[type] || "#64748b", width: (data.total / maxTotal * 100) + "%", transition: "width 500ms" }} />
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{data.count} transactions</div>
              </div>
            );
          })}
        </div>

        {/* Vendors by Plan */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, margin: 0 }}>Vendors by Plan</h3>
          </div>
          {Object.entries(planCounts).length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No vendor data</div>
          ) : Object.entries(planCounts).map(([plan, count], i) => {
            const colors = { free: "#6366f1", basic: "#f59e0b", pro: "var(--coral, #FE6972)" };
            const total = Object.values(planCounts).reduce((s, c) => s + c, 0);
            return (
              <div key={plan} style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: i < Object.entries(planCounts).length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: (colors[plan] || "#64748b") + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: colors[plan] || "#64748b" }}>
                  {count}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, textTransform: "capitalize" }}>{plan} Plan</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{total > 0 ? Math.round(count / total * 100) : 0}% of vendors</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, marginTop: 20, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0" }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, margin: 0 }}>Recent Transactions</h3>
        </div>
        {transactions.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No transactions yet</div>
        ) : transactions.slice(0, 15).map((tx, i) => {
          const colors = { subscription: "#6366f1", listing_fee: "#f59e0b", wallet_topup: "#22c55e", deduction: "#ef4444" };
          return (
            <div key={tx.id || i} style={{ padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: i < Math.min(transactions.length, 15) - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.description || tx.type}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{tx.vendor_name}</span>
                  <span style={{ textTransform: "capitalize", fontSize: 10, padding: "1px 6px", borderRadius: 4, background: (colors[tx.type] || "#64748b") + "18", color: colors[tx.type] || "#64748b" }}>{(tx.type || "").replace("_", " ")}</span>
                  <span>{tx.created_at ? new Date(tx.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}</span>
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: tx.type === "deduction" ? "#ef4444" : "#22c55e" }}>
                {tx.type === "deduction" ? "-" : "+"}{parseFloat(tx.amount).toLocaleString()} {tx.currency || "EGP"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
