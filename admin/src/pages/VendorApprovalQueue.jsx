import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Eye, Clock, Building2, Mail, Phone, FileText } from "lucide-react";
import DataTable from "../components/DataTable";

const API = "/api/cms";

const STATUS_STYLES = {
  pending: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Pending" },
  approved: { bg: "rgba(34,197,94,0.1)", color: "#22c55e", label: "Approved" },
  rejected: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", label: "Rejected" },
};

export default function VendorApprovalQueue() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("pending");

  useEffect(() => { loadVendors(); }, []);

  async function loadVendors() {
    setLoading(true);
    try {
      const res = await fetch(API + "/admin/vendors").then(r => { if (!r.ok) throw new Error("API not ready"); return r.json(); });
      setVendors(Array.isArray(res) ? res : res?.data || []);
    } catch (e) {
      console.error("Load vendors:", e);
      // Demo data
      setVendors([
        { id: 1, business_name: "Bloom & Petal Florals", business_name_ar: "بلوم آند بيتال", email: "info@bloompetal.sa", phone: "+966501234567", category: "flowers", status: "pending", created_at: "2026-05-10T10:00:00Z", city: "Riyadh" },
        { id: 2, business_name: "Royal Venue Events", business_name_ar: "رويال فينيو", email: "book@royalvenue.sa", phone: "+966507654321", category: "venues", status: "pending", created_at: "2026-05-11T14:00:00Z", city: "Jeddah" },
        { id: 3, business_name: "Lens of Love Photography", business_name_ar: "عدسة الحب", email: "hello@lensoflove.sa", phone: "+966509876543", category: "photography", status: "approved", created_at: "2026-05-08T09:00:00Z", city: "Riyadh" },
        { id: 4, business_name: "Sweet Layers Bakery", business_name_ar: "سويت ليرز", email: "orders@sweetlayers.sa", phone: "+966503456789", category: "catering", status: "rejected", created_at: "2026-05-09T11:00:00Z", city: "Dammam" },
        { id: 5, business_name: "Elegance Planners", business_name_ar: "أناقة للتخطيط", email: "plan@elegance.sa", phone: "+966506543210", category: "planning", status: "pending", created_at: "2026-05-12T16:00:00Z", city: "Riyadh" },
      ]);
    } finally { setLoading(false); }
  }

  async function updateStatus(id, status) {
    try {
      await fetch(API + `/admin/vendors/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      setVendors(prev => prev.map(v => v.id === id ? { ...v, status } : v));
      setSelected(null);
    } catch (e) {
      // Demo: update locally
      setVendors(prev => prev.map(v => v.id === id ? { ...v, status } : v));
      setSelected(null);
    }
  }

  const filtered = filter === "all" ? vendors : vendors.filter(v => v.status === filter);

  const columns = [
    { key: "business_name", label: "Business Name" },
    { key: "category", label: "Category", render: v => <span style={{ textTransform: "capitalize" }}>{v}</span> },
    { key: "city", label: "City" },
    { key: "email", label: "Email" },
    { key: "status", label: "Status", render: v => { const s = STATUS_STYLES[v] || STATUS_STYLES.pending; return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>; } },
    { key: "created_at", label: "Applied", render: v => v ? new Date(v).toLocaleDateString() : "—" },
  ];

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["all", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: "7px 16px", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600,
            border: filter === val ? "none" : "1px solid var(--card-border)",
            background: filter === val ? "var(--coral)" : "var(--card-bg)",
            color: filter === val ? "#fff" : "var(--slate-600)",
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}>{label} {val !== "all" && `(${vendors.filter(v => v.status === val).length})`}</button>
        ))}
      </div>

      {loading ? <div style={{ padding: 40, textAlign: "center", color: "var(--slate-400)" }}>Loading vendors...</div> : (
        <DataTable
          columns={columns}
          data={filtered}
          pageSize={10}
          emptyMessage="No vendors found"
          onRowClick={setSelected}
          actions={(row) => row.status === "pending" ? [
            <button key="approve" onClick={() => updateStatus(row.id, "approved")} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "rgba(34,197,94,0.1)", color: "#22c55e", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle size={14} /> Approve</button>,
            <button key="reject" onClick={() => updateStatus(row.id, "rejected")} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><XCircle size={14} /> Reject</button>,
          ] : [
            <button key="view" onClick={() => setSelected(row)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--slate-600)", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><Eye size={14} /> View</button>,
          ]}
          bulkActions={[
            { label: "Approve", color: "rgba(34,197,94,0.1)", textColor: "#22c55e", onClick: ids => ids.forEach(id => updateStatus(id, "approved")) },
            { label: "Reject", color: "rgba(239,68,68,0.1)", textColor: "#ef4444", onClick: ids => ids.forEach(id => updateStatus(id, "rejected")) },
          ]}
        />
      )}

      {/* Detail Drawer */}
      {selected && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 400, background: "var(--card-bg)", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 50, padding: 24, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Vendor Details</h3>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--slate-400)", fontSize: 20 }}>&times;</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><div style={{ fontSize: 11, color: "var(--slate-400)", marginBottom: 2 }}>Business Name</div><div style={{ fontSize: 15, fontWeight: 600, color: "var(--slate-900)" }}>{selected.business_name}</div><div style={{ fontSize: 13, color: "var(--slate-500)" }}>{selected.business_name_ar}</div></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={{ fontSize: 11, color: "var(--slate-400)", marginBottom: 2 }}>Category</div><div style={{ fontSize: 13, textTransform: "capitalize", color: "var(--slate-700)" }}>{selected.category}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--slate-400)", marginBottom: 2 }}>City</div><div style={{ fontSize: 13, color: "var(--slate-700)" }}>{selected.city}</div></div>
            </div>
            <div><div style={{ fontSize: 11, color: "var(--slate-400)", marginBottom: 2 }}>Email</div><div style={{ fontSize: 13, color: "var(--slate-700)" }}>{selected.email}</div></div>
            <div><div style={{ fontSize: 11, color: "var(--slate-400)", marginBottom: 2 }}>Phone</div><div style={{ fontSize: 13, color: "var(--slate-700)" }}>{selected.phone}</div></div>
            {selected.status === "pending" && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => updateStatus(selected.id, "approved")} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Approve</button>
                <button onClick={() => updateStatus(selected.id, "rejected")} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Reject</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
