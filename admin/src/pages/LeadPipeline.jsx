import { useState, useEffect } from "react";
import {
  MessageSquare, Phone, Mail, Clock, CheckCircle, XCircle,
  ArrowRight, Send, AlertTriangle, Star, Edit, RefreshCw,
  ChevronDown, ShoppingBag, Users, TrendingUp, Flag
} from "lucide-react";
import DataTable from "../components/DataTable";

const API = "/api/cms";

const STAGES = [
  { id: "new",           label: "New",           color: "#6366f1", bg: "rgba(99,102,241,0.1)"  },
  { id: "contacted",     label: "Contacted",      color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  { id: "qualified",     label: "Qualified",      color: "#3b82f6", bg: "rgba(59,130,246,0.1)"  },
  { id: "proposal_sent", label: "Proposal Sent",  color: "#8b5cf6", bg: "rgba(139,92,246,0.1)"  },
  { id: "won",           label: "Won",            color: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
  { id: "lost",          label: "Lost",           color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
];

const PRIORITIES = {
  urgent: { color: "#ef4444", label: "Urgent"  },
  high:   { color: "#f59e0b", label: "High"    },
  medium: { color: "#6366f1", label: "Medium"  },
  low:    { color: "#94a3b8", label: "Low"     },
};

export default function LeadPipeline() {
  const [leads,       setLeads]       = useState([]);
  const [inquiries,   setInquiries]   = useState([]);
  const [funnel,      setFunnel]      = useState({});
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("all");
  const [source,      setSource]      = useState("leads"); // "leads" | "inquiries"
  const [selected,    setSelected]    = useState(null);
  const [stageEdit,   setStageEdit]   = useState(null);
  const [stageNote,   setStageNote]   = useState("");
  const [saving,      setSaving]      = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [leadsRes, inqRes] = await Promise.all([
        fetch("/api/admin/leads/pipeline").then(r => r.json()),
        fetch("/api/admin/leads/inquiries").then(r => r.json()),
      ]);
      if (leadsRes.success) { setLeads(leadsRes.data || []); setFunnel(leadsRes.funnel || {}); }
      if (inqRes.success)   setInquiries(inqRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function updateStage(id, stage) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/leads/" + id + "/stage", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, note: stageNote })
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l));
        setFunnel(prev => ({ ...prev }));
        setStageEdit(null); setStageNote("");
        if (selected?.id === id) setSelected(prev => prev ? { ...prev, stage } : null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function updatePriority(id, priority) {
    await fetch("/api/admin/leads/" + id, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority })
    });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, priority } : l));
  }

  const displayData = source === "leads" ? leads : inquiries;
  const filtered = filter === "all"
    ? displayData
    : source === "leads"
      ? displayData.filter(l => l.stage === filter)
      : displayData.filter(l => l.status === filter);

  const totalLeads = leads.length;
  const convRate   = totalLeads > 0 ? Math.round((funnel.won || 0) / totalLeads * 100) : 0;

  const leadsColumns = [
    {
      key: "couple_name", label: "Lead",
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{v || row.name || "—"}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{row.email}</div>
          {row.priority && row.priority !== "medium" && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: PRIORITIES[row.priority]?.color + "20", color: PRIORITIES[row.priority]?.color }}>
              {PRIORITIES[row.priority]?.label}
            </span>
          )}
        </div>
      )
    },
    {
      key: "vendor_name", label: "Vendor",
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{v || row.vendor_business_name || "—"}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "capitalize" }}>{row.category}</div>
        </div>
      )
    },
    {
      key: "stage", label: "Stage",
      render: (v, row) => {
        const s = STAGES.find(st => st.id === v) || STAGES[0];
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>
          </div>
        );
      }
    },
    {
      key: "estimated_value", label: "Value",
      render: v => v ? <span style={{ fontWeight: 600, color: "#22c55e" }}>EGP {Number(v).toLocaleString()}</span> : <span style={{ color: "#94a3b8" }}>—</span>
    },
    {
      key: "wedding_date", label: "Wedding",
      render: v => v ? new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"
    },
    {
      key: "follow_up_date", label: "Follow Up",
      render: v => {
        if (!v) return <span style={{ color: "#94a3b8" }}>—</span>;
        const d = new Date(v);
        const overdue = d < new Date();
        return <span style={{ fontSize: 12, color: overdue ? "#ef4444" : "#64748b", fontWeight: overdue ? 600 : 400 }}>{d.toLocaleDateString()}{overdue ? " ⚠" : ""}</span>;
      }
    },
    {
      key: "created_at", label: "Date",
      render: v => <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(v).toLocaleDateString()}</span>
    },
  ];

  const inquiryColumns = [
    {
      key: "name", label: "Customer",
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{row.email || row.phone}</div>
        </div>
      )
    },
    {
      key: "product_name", label: "Product",
      render: (v, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {row.product_image && <img src={row.product_image} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} />}
          <div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{v}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{row.category_name}</div>
          </div>
        </div>
      )
    },
    {
      key: "vendor_name", label: "Vendor",
      render: v => <span style={{ fontSize: 12 }}>{v || "—"}</span>
    },
    {
      key: "product_price", label: "Value",
      render: v => v ? <span style={{ fontWeight: 600, color: "#22c55e", fontSize: 12 }}>EGP {Number(v).toLocaleString()}</span> : "—"
    },
    {
      key: "status", label: "Status",
      render: v => {
        const map = {
          new:      { color: "#6366f1", bg: "rgba(99,102,241,0.1)"  },
          read:     { color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
          replied:  { color: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
          closed:   { color: "#94a3b8", bg: "rgba(100,116,139,0.1)" },
        };
        const s = map[v] || map.new;
        return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color, textTransform: "capitalize" }}>{v}</span>;
      }
    },
    {
      key: "created_at", label: "Date",
      render: v => <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(v).toLocaleDateString()}</span>
    },
  ];

  return (
    <div>
      {/* Source toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button onClick={() => { setSource("leads"); setFilter("all"); }}
          style={{ padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: source==="leads"?"none":"1px solid #e2e8f0", background: source==="leads"?"var(--coral,#FE6972)":"#fff", color: source==="leads"?"#fff":"#64748b", display: "flex", alignItems: "center", gap: 6 }}>
          <Users size={15} />General Leads ({leads.length})
        </button>
        <button onClick={() => { setSource("inquiries"); setFilter("all"); }}
          style={{ padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: source==="inquiries"?"none":"1px solid #e2e8f0", background: source==="inquiries"?"var(--coral,#FE6972)":"#fff", color: source==="inquiries"?"#fff":"#64748b", display: "flex", alignItems: "center", gap: 6 }}>
          <ShoppingBag size={15} />Shop Inquiries ({inquiries.length})
        </button>
        <button onClick={load} style={{ marginLeft: "auto", padding: "9px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <RefreshCw size={13} />Refresh
        </button>
      </div>

      {/* Funnel (leads only) */}
      {source === "leads" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "stretch", overflowX: "auto" }}>
          {STAGES.map((stage, i) => (
            <div key={stage.id} style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, minWidth: 100 }}>
              <div onClick={() => setFilter(stage.id)}
                style={{ flex: 1, background: "#fff", border: filter===stage.id ? `2px solid ${stage.color}` : "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: stage.color }}>{funnel[stage.id] || 0}</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{stage.label}</div>
              </div>
              {i < STAGES.length - 1 && <ArrowRight size={14} style={{ color: "#e2e8f0", flexShrink: 0 }} />}
            </div>
          ))}
          <div style={{ flex: 1, minWidth: 100 }}>
            <div style={{ background: "linear-gradient(135deg,rgba(254,105,114,0.08),rgba(212,175,55,0.08))", border: "1px solid rgba(254,105,114,0.2)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: "#FE6972" }}>{convRate}%</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>Conversion</div>
            </div>
          </div>
        </div>
      )}

      {/* Stage filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => setFilter("all")} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: filter==="all"?"none":"1px solid #e2e8f0", background: filter==="all"?"var(--coral,#FE6972)":"#fff", color: filter==="all"?"#fff":"#64748b" }}>
          All ({displayData.length})
        </button>
        {source === "leads"
          ? STAGES.map(s => (
            <button key={s.id} onClick={() => setFilter(s.id)}
              style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: filter===s.id?"none":"1px solid #e2e8f0", background: filter===s.id?s.color:"#fff", color: filter===s.id?"#fff":"#64748b" }}>
              {s.label} ({funnel[s.id] || 0})
            </button>
          ))
          : [["new","New"],["read","Read"],["replied","Replied"],["closed","Closed"]].map(([val,label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: filter===val?"none":"1px solid #e2e8f0", background: filter===val?"var(--coral,#FE6972)":"#fff", color: filter===val?"#fff":"#64748b" }}>
              {label} ({displayData.filter(l => l.status===val).length})
            </button>
          ))
        }
      </div>

      {loading
        ? <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Loading...</div>
        : <DataTable
            columns={source === "leads" ? leadsColumns : inquiryColumns}
            data={filtered}
            pageSize={15}
            emptyMessage={`No ${source === "leads" ? "leads" : "inquiries"} found`}
            onRowClick={setSelected}
            actions={source === "leads" ? row => [
              <div key="stage" style={{ position: "relative" }}>
                <button onClick={e => { e.stopPropagation(); setStageEdit(stageEdit === row.id ? null : row.id); }}
                  style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                  Move <ChevronDown size={10} />
                </button>
                {stageEdit === row.id && (
                  <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10, width: 160, padding: 6 }} onClick={e => e.stopPropagation()}>
                    {STAGES.map(s => (
                      <button key={s.id} onClick={() => updateStage(row.id, s.id)}
                        style={{ display: "block", width: "100%", padding: "6px 10px", borderRadius: 6, border: "none", background: row.stage===s.id ? s.bg : "transparent", color: row.stage===s.id ? s.color : "#334155", cursor: "pointer", fontSize: 12, fontWeight: row.stage===s.id ? 700 : 400, textAlign: "left" }}>
                        {row.stage===s.id ? "✓ " : ""}{s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ] : undefined}
          />
      }

      {/* Lead Detail Drawer */}
      {selected && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 420, background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 50, padding: 24, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, margin: 0 }}>
              {source === "leads" ? "Lead Details" : "Inquiry Details"}
            </h3>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 20 }}>×</button>
          </div>

          {source === "leads" ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display',serif", marginBottom: 4 }}>{selected.couple_name || selected.name}</div>
              {/* Stage badges */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                {(() => { const s = STAGES.find(st => st.id === selected.stage) || STAGES[0]; return <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>; })()}
                {selected.priority && <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 20, background: PRIORITIES[selected.priority]?.color + "15", color: PRIORITIES[selected.priority]?.color }}>{PRIORITIES[selected.priority]?.label} Priority</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  ["Wedding", selected.wedding_date ? new Date(selected.wedding_date).toLocaleDateString() : "—"],
                  ["Guests", selected.guest_count || "—"],
                  ["Budget", selected.budget || "—"],
                  ["Est. Value", selected.estimated_value ? "EGP " + Number(selected.estimated_value).toLocaleString() : "—"],
                  ["Category", selected.category || "—"],
                  ["Vendor", selected.vendor_name || selected.vendor_business_name || "—"],
                ].map(([label, val]) => (
                  <div key={label} style={{ padding: 10, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Contact</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {selected.phone && <a href={`tel:${selected.phone}`} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#334155", textDecoration: "none" }}><Phone size={12} />{selected.phone}</a>}
                  {selected.email && <a href={`mailto:${selected.email}`} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#334155", textDecoration: "none" }}><Mail size={12} />{selected.email}</a>}
                </div>
              </div>
              {selected.message && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Message</div>
                  <div style={{ fontSize: 13, color: "#334155", background: "#f8fafc", padding: 12, borderRadius: 8, lineHeight: 1.5 }}>{selected.message}</div>
                </div>
              )}
              {/* Stage change */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Move to Stage</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {STAGES.map(s => (
                    <button key={s.id} onClick={() => updateStage(selected.id, s.id)} disabled={saving}
                      style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: selected.stage===s.id ? s.color : s.bg, color: selected.stage===s.id ? "#fff" : s.color, cursor: "pointer", fontSize: 11, fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
                      {selected.stage===s.id ? "✓ " : ""}{s.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Priority */}
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Priority</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.entries(PRIORITIES).map(([key, val]) => (
                    <button key={key} onClick={() => { updatePriority(selected.id, key); setSelected(s => s ? { ...s, priority: key } : s); }}
                      style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: selected.priority===key ? val.color : val.color+"15", color: selected.priority===key ? "#fff" : val.color, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{selected.name}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{selected.product_name}</div>
              {selected.product_image && <img src={selected.product_image} alt="" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10, marginBottom: 12 }} />}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                {selected.phone && <a href={`tel:${selected.phone}`} style={{ padding: 10, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 12, color: "#334155", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}><Phone size={12} />{selected.phone}</a>}
                {selected.email && <a href={`mailto:${selected.email}`} style={{ padding: 10, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 12, color: "#334155", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}><Mail size={12} />{selected.email}</a>}
              </div>
              {selected.message && <div style={{ fontSize: 13, color: "#334155", background: "#f8fafc", padding: 12, borderRadius: 8, lineHeight: 1.5 }}>{selected.message}</div>}
            </>
          )}
        </div>
      )}
    </div>
  );
}


