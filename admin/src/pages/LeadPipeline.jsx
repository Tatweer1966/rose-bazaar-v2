import { useState, useEffect } from "react";
import { MessageSquare, Phone, Mail, Clock, CheckCircle, XCircle, ArrowRight, Send } from "lucide-react";
import DataTable from "../components/DataTable";

const API = "/api/cms";

const DEMO_LEADS = [
  { id: 1, couple_name: "Ahmed & Sara Al-Rashid", wedding_date: "2026-10-15", guest_count: 250, vendor_name: "Grand Plaza Hall", category: "venues", budget: "50,000 SAR", status: "new", message: "Looking for a grand ballroom for 250 guests with outdoor garden access.", created_at: "2026-05-14T10:30:00Z", phone: "+966501234567", email: "ahmed.sara@gmail.com" },
  { id: 2, couple_name: "Khalid & Noura Hassan", wedding_date: "2026-11-20", guest_count: 150, vendor_name: "Bloom & Petal Florals", category: "flowers", budget: "8,000 SAR", status: "vendor_responded", message: "Need full floral decoration — roses and orchids theme.", created_at: "2026-05-13T14:00:00Z", phone: "+966507654321", email: "khalid.noura@gmail.com" },
  { id: 3, couple_name: "Omar & Layla Mansour", wedding_date: "2026-09-05", guest_count: 300, vendor_name: "Luna Photography", category: "photography", budget: "12,000 SAR", status: "confirmed", message: "Full day coverage + pre-wedding shoot + drone footage.", created_at: "2026-05-12T09:00:00Z", phone: "+966509876543", email: "omar.layla@gmail.com" },
  { id: 4, couple_name: "Faisal & Reem Al-Otaibi", wedding_date: "2026-12-01", guest_count: 400, vendor_name: "Royal Catering Co.", category: "catering", budget: "75,000 SAR", status: "declined", message: "Arabic cuisine for 400 guests, premium menu.", created_at: "2026-05-11T16:00:00Z", phone: "+966503456789", email: "faisal.reem@gmail.com" },
  { id: 5, couple_name: "Tariq & Hana Bakr", wedding_date: "2026-08-22", guest_count: 100, vendor_name: "Elegance Planners", category: "planning", budget: "30,000 SAR", status: "new", message: "Full wedding coordination — intimate garden ceremony.", created_at: "2026-05-14T08:00:00Z", phone: "+966506543210", email: "tariq.hana@gmail.com" },
];

const STATUS_MAP = {
  new: { label: "New Lead", color: "#6366f1", bg: "rgba(99,102,241,0.1)", icon: MessageSquare },
  vendor_responded: { label: "Vendor Responded", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: Send },
  confirmed: { label: "Booking Confirmed", color: "#22c55e", bg: "rgba(34,197,94,0.1)", icon: CheckCircle },
  declined: { label: "Declined", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: XCircle },
};

export default function LeadPipeline() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(API + "/admin/leads").then(r => { if (!r.ok) throw new Error("API"); return r.json(); });
        setLeads(Array.isArray(res) ? res : res?.data || []);
      } catch { setLeads(DEMO_LEADS); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = filter === "all" ? leads : leads.filter(l => l.status === filter);

  // Funnel stats
  const funnel = { total: leads.length, new: leads.filter(l => l.status === "new").length, responded: leads.filter(l => l.status === "vendor_responded").length, confirmed: leads.filter(l => l.status === "confirmed").length, declined: leads.filter(l => l.status === "declined").length };
  const convRate = funnel.total > 0 ? Math.round((funnel.confirmed / funnel.total) * 100) : 0;

  const columns = [
    { key: "couple_name", label: "Couple", render: (v, row) => (
      <div><div style={{ fontWeight: 600 }}>{v}</div><div style={{ fontSize: 11, color: "var(--slate-400)" }}>{row.email}</div></div>
    )},
    { key: "vendor_name", label: "Vendor", render: (v, row) => (
      <div><div style={{ fontWeight: 500 }}>{v}</div><div style={{ fontSize: 11, color: "var(--slate-400)", textTransform: "capitalize" }}>{row.category}</div></div>
    )},
    { key: "wedding_date", label: "Wedding Date", render: v => v ? new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—" },
    { key: "guest_count", label: "Guests" },
    { key: "budget", label: "Budget" },
    { key: "status", label: "Status", render: v => { const s = STATUS_MAP[v] || STATUS_MAP.new; const Icon = s.icon; return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon size={12} />{s.label}</span>; }},
  ];

  return (
    <div>
      {/* Conversion Funnel */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "stretch" }}>
        {[
          { label: "Total Inquiries", value: funnel.total, color: "var(--slate-900)" },
          { label: "New Leads", value: funnel.new, color: "#6366f1" },
          { label: "Vendor Responded", value: funnel.responded, color: "#f59e0b" },
          { label: "Confirmed", value: funnel.confirmed, color: "#22c55e" },
          { label: "Conversion Rate", value: convRate + "%", color: "var(--coral)" },
        ].map((stat, i) => (
          <div key={i} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-md)", padding: "12px 16px", flex: 1, boxShadow: "var(--card-shadow)", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "var(--slate-400)" }}>{stat.label}</div>
            </div>
            {i < 4 && <ArrowRight size={16} style={{ color: "var(--slate-300)", flexShrink: 0 }} />}
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["all", "All"], ["new", "New"], ["vendor_responded", "Responded"], ["confirmed", "Confirmed"], ["declined", "Declined"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: "7px 16px", borderRadius: "var(--radius-md)", fontSize: 13, fontWeight: 600,
            border: filter === val ? "none" : "1px solid var(--card-border)",
            background: filter === val ? "var(--coral)" : "var(--card-bg)",
            color: filter === val ? "#fff" : "var(--slate-600)",
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
          }}>{label}</button>
        ))}
      </div>

      {loading ? <div style={{ padding: 40, textAlign: "center", color: "var(--slate-400)" }}>Loading...</div> : (
        <DataTable columns={columns} data={filtered} pageSize={10} emptyMessage="No leads found" onRowClick={setSelected} />
      )}

      {/* Lead Detail Drawer */}
      {selected && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 400, background: "var(--card-bg)", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 50, padding: 24, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Lead Details</h3>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--slate-400)", fontSize: 20 }}>&times;</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "var(--slate-900)" }}>{selected.couple_name}</div>
            <div style={{ display: "flex", gap: 8 }}>
              {(() => { const s = STATUS_MAP[selected.status]; const Icon = s.icon; return <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: s.bg, color: s.color, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon size={14} />{s.label}</span>; })()}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><div style={{ fontSize: 11, color: "var(--slate-400)" }}>Wedding Date</div><div style={{ fontSize: 13, fontWeight: 600 }}>{new Date(selected.wedding_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--slate-400)" }}>Guests</div><div style={{ fontSize: 13, fontWeight: 600 }}>{selected.guest_count}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--slate-400)" }}>Budget</div><div style={{ fontSize: 13, fontWeight: 600 }}>{selected.budget}</div></div>
              <div><div style={{ fontSize: 11, color: "var(--slate-400)" }}>Category</div><div style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{selected.category}</div></div>
            </div>
            <div><div style={{ fontSize: 11, color: "var(--slate-400)" }}>Vendor</div><div style={{ fontSize: 14, fontWeight: 600 }}>{selected.vendor_name}</div></div>
            <div><div style={{ fontSize: 11, color: "var(--slate-400)" }}>Contact</div><div style={{ display: "flex", gap: 8, marginTop: 4 }}><span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--slate-600)" }}><Phone size={12} />{selected.phone}</span><span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--slate-600)" }}><Mail size={12} />{selected.email}</span></div></div>
            <div><div style={{ fontSize: 11, color: "var(--slate-400)" }}>Message</div><div style={{ fontSize: 13, color: "var(--slate-700)", background: "var(--slate-50)", padding: 12, borderRadius: 8, marginTop: 4, lineHeight: 1.5 }}>{selected.message}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
