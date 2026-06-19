import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, XCircle, Eye, Clock, Building2, Mail, Phone,
  FileText, Shield, User, Store, Globe, MessageSquare,
  AlertTriangle, Star, Package, RefreshCw, X, Plus,
  Crown, Zap, Check, TrendingUp, BarChart3, Flag,
  ShoppingBag, Flame, ChevronRight, Edit, Save
} from "lucide-react";
import DataTable from "../components/DataTable";

const API = "/api/cms";

const ACCOUNT_TYPES = {
  individual:       { label: "Individual",       color: "#6366f1", icon: User      },
  business:         { label: "Business",          color: "#FE6972", icon: Building2 },
  venue_owner:      { label: "Venue Owner",       color: "#8b5cf6", icon: Building2 },
  service_provider: { label: "Service Provider",  color: "#22c55e", icon: Star      },
  store:            { label: "Store",             color: "#f59e0b", icon: Store     },
};

const VERIFICATION_LEVELS = {
  unverified:       { label: "Unverified",        color: "#94a3b8", bg: "rgba(148,163,184,0.1)", score: 0  },
  phone_verified:   { label: "Phone Verified",    color: "#6366f1", bg: "rgba(99,102,241,0.1)",  score: 25 },
  verified:         { label: "Verified",          color: "#22c55e", bg: "rgba(34,197,94,0.1)",   score: 60 },
  premium_verified: { label: "Premium Verified",  color: "#D4AF37", bg: "rgba(212,175,55,0.1)",  score: 100},
};

const STATUS_STYLES = {
  submitted: { bg: "rgba(245,158,11,0.1)",  color: "#f59e0b", label: "Pending"   },
  approved:  { bg: "rgba(34,197,94,0.1)",   color: "#22c55e", label: "Approved"  },
  rejected:  { bg: "rgba(239,68,68,0.1)",   color: "#ef4444", label: "Rejected"  },
  suspended: { bg: "rgba(239,68,68,0.12)",  color: "#dc2626", label: "Suspended" },
  draft:     { bg: "rgba(100,116,139,0.1)", color: "#64748b", label: "Draft"     },
};

const LEAD_SOURCES = ["website","facebook","instagram","referral","sales_team","other"];
const PLAN_META = {
  LITE:  { label: "Lite",  color: "#94a3b8", icon: null  },
  BASIC: { label: "Basic", color: "#22c55e", icon: Check },
  PRO:   { label: "Pro",   color: "#6366f1", icon: Zap   },
  TOP:   { label: "Top",   color: "#D4AF37", icon: Crown },
};

const REJECT_REASONS = [
  "Incomplete business information",
  "Unable to verify identity",
  "Not a wedding-related business",
  "Duplicate account",
  "Suspicious / fraudulent activity",
  "Does not meet marketplace standards",
  "Invalid phone or email",
  "Other",
];

const CHANGE_REASONS = [
  "Missing phone number",
  "Missing business description",
  "Missing cover image",
  "Upload commercial registration",
  "Upload national ID",
  "Add pricing information",
  "Add social media links",
  "Other",
];

// ── Trust Score Breakdown ──────────────────────────────────────
function TrustScoreCard({ vendor }) {
  const checks = [
    { label: "Email provided",         done: !!vendor.email,                    points: 10 },
    { label: "Phone provided",         done: !!vendor.phone,                    points: 15 },
    { label: "WhatsApp provided",      done: !!vendor.whatsapp,                 points: 5  },
    { label: "Business description",   done: (vendor.description?.length||0)>30,points: 15 },
    { label: "Cover image",            done: !!vendor.cover_image,              points: 10 },
    { label: "Social media links",     done: !!(vendor.instagram||vendor.facebook||vendor.website), points: 10 },
    { label: "Documents uploaded",     done: (vendor.documents||[]).length>0,   points: 20 },
    { label: "Pricing set",            done: !!(vendor.price_min>0),            points: 10 },
    { label: "Experience years",       done: !!(vendor.experience_years>0),     points: 5  },
  ];
  const score = checks.filter(c => c.done).reduce((s, c) => s + c.points, 0);
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ padding: 14, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Trust Score</span>
        <span style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Playfair Display',serif", color }}>{score}/100</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "#e2e8f0", overflow: "hidden", marginBottom: 10 }}>
        <div style={{ height: "100%", borderRadius: 3, background: color, width: score + "%", transition: "width 0.5s" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        {checks.map(c => (
          <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10 }}>
            {c.done
              ? <CheckCircle size={11} style={{ color: "#22c55e", flexShrink: 0 }} />
              : <AlertTriangle size={11} style={{ color: "#f59e0b", flexShrink: 0 }} />}
            <span style={{ color: c.done ? "#334155" : "#94a3b8" }}>{c.label}</span>
            <span style={{ marginLeft: "auto", color: c.done ? "#22c55e" : "#94a3b8", fontWeight: 600 }}>+{c.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Internal Notes ─────────────────────────────────────────────
function InternalNotes({ vendorId }) {
  const [notes,    setNotes]    = useState([]);
  const [newNote,  setNewNote]  = useState("");
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    fetch(API + "/admin/vendors/" + vendorId + "/notes")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.success) setNotes(d.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [vendorId]);

  async function addNote() {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(API + "/admin/vendors/" + vendorId + "/notes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote })
      });
      const d = await res.json();
      if (d.success) { setNotes(prev => [d.data, ...prev]); setNewNote(""); }
    } finally { setSaving(false); }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Internal Notes</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote()}
          placeholder="Add internal note..." style={{ flex: 1, padding: "8px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 12, outline: "none" }} />
        <button onClick={addNote} disabled={saving || !newNote.trim()}
          style={{ padding: "8px 12px", borderRadius: 7, border: "none", background: "#334155", color: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <Plus size={12} />{saving ? "..." : "Add"}
        </button>
      </div>
      <div style={{ maxHeight: 180, overflowY: "auto" }}>
        {loading ? <div style={{ fontSize: 12, color: "#94a3b8", padding: 8 }}>Loading...</div>
        : notes.length === 0 ? <div style={{ fontSize: 12, color: "#94a3b8", padding: 8, background: "#f8fafc", borderRadius: 7 }}>No notes yet</div>
        : notes.map(n => (
          <div key={n.id} style={{ padding: "8px 10px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 7, marginBottom: 5 }}>
            <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{n.note}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>{n.created_by} · {new Date(n.created_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function VendorApprovalQueue() {
  const [vendors,      setVendors]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selected,     setSelected]     = useState(null);
  const [filter,       setFilter]       = useState("submitted");
  const [typeFilter,   setTypeFilter]   = useState("all");
  const [subView,      setSubView]      = useState("all"); // all|pending|suspended|verification
  const [showReject,   setShowReject]   = useState(null);
  const [showChanges,  setShowChanges]  = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [changeReasons,setChangeReasons]= useState([]);
  const [changesNote,  setChangesNote]  = useState("");
  const [processing,   setProcessing]   = useState(null);
  const [editPlan,     setEditPlan]     = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(API + "/admin/vendors").then(r => r.ok ? r.json() : null);
      const data = res?.result?.data || res?.data || [];
      setVendors(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(id) {
    setProcessing(id);
    try {
      await fetch(API + "/admin/approve/" + id);
      setVendors(prev => prev.map(v => v.id === id ? { ...v, registration_status: "approved", is_verified: true, is_active: true } : v));
      if (selected?.id === id) setSelected(p => p ? { ...p, registration_status: "approved", is_verified: true } : null);
    } finally { setProcessing(null); }
  }

  async function handleReject(id) {
    if (!rejectReason) return;
    setProcessing(id);
    try {
      await fetch(API + "/admin/vendors/" + id + "/status", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", reason: rejectReason })
      }).catch(() => {});
      setVendors(prev => prev.map(v => v.id === id ? { ...v, registration_status: "rejected", rejected_reason: rejectReason } : v));
      setShowReject(null); setRejectReason(""); setSelected(null);
    } finally { setProcessing(null); }
  }

  async function handleSuspend(id) {
    if (!confirm("Suspend this vendor? Their listings will be hidden.")) return;
    await fetch(API + "/admin/vendors/" + id + "/suspend", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Suspended by admin" })
    }).catch(() => {});
    setVendors(prev => prev.map(v => v.id === id ? { ...v, is_suspended: true } : v));
    setSelected(null);
  }

  async function handleRequestChanges(id) {
    if (!changeReasons.length && !changesNote) return;
    const note = [...changeReasons, changesNote].filter(Boolean).join("; ");
    await fetch(API + "/admin/vendors/" + id + "/notes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "Changes requested: " + note })
    }).catch(() => {});
    setShowChanges(null); setChangeReasons([]); setChangesNote("");
  }

  async function setVerificationLevel(id, level) {
    await fetch(API + "/admin/vendors/" + id + "/verify", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verification_level: level })
    }).catch(() => {});
    setVendors(prev => prev.map(v => v.id === id ? { ...v, verification_level: level } : v));
    if (selected?.id === id) setSelected(p => p ? { ...p, verification_level: level } : null);
  }

  async function updateVendorField(id, field, value) {
    await fetch(API + "/admin/vendors/" + id + "/meta", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value })
    }).catch(() => {});
    setVendors(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
    if (selected?.id === id) setSelected(p => p ? { ...p, [field]: value } : null);
  }

  const getDisplayStatus = (v) => {
    if (v.is_suspended) return "suspended";
    return v.registration_status || "draft";
  };

  const filtered = vendors.filter(v => {
    if (subView === "pending")      return v.registration_status === "submitted";
    if (subView === "suspended")    return v.is_suspended;
    if (subView === "verification") return v.verification_level === "unverified" && v.registration_status === "approved";
    const statusMatch = filter === "all" ? true : (filter === "submitted" ? v.registration_status === "submitted" : v.registration_status === filter);
    const typeMatch   = typeFilter === "all" ? true : v.vendor_type === typeFilter;
    return statusMatch && typeMatch;
  });

  const pendingCount      = vendors.filter(v => v.registration_status === "submitted").length;
  const approvedCount     = vendors.filter(v => v.registration_status === "approved" && !v.is_suspended).length;
  const suspendedCount    = vendors.filter(v => v.is_suspended).length;
  const verificationCount = vendors.filter(v => v.verification_level === "unverified" && v.registration_status === "approved").length;

  const columns = [
    {
      key: "business_name", label: "Vendor",
      render: (v, row) => {
        const acct = ACCOUNT_TYPES[row.vendor_account_type] || ACCOUNT_TYPES.business;
        const AcctIcon = acct.icon;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: acct.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AcctIcon size={15} style={{ color: acct.color }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "capitalize", marginTop: 1 }}>{row.vendor_type || "service"} · {acct.label}</div>
            </div>
          </div>
        );
      }
    },
    { key: "category_name", label: "Category", render: v => <span style={{ fontSize: 12, color: "#475569" }}>{v || "—"}</span> },
    {
      key: "city", label: "City / Contact",
      render: (v, row) => (
        <div style={{ fontSize: 11 }}>
          <div>{v || "—"}</div>
          {row.phone && <div style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}><Phone size={10} />{row.phone}</div>}
        </div>
      )
    },
    {
      key: "verification_level", label: "Trust",
      render: (v, row) => {
        const vl = VERIFICATION_LEVELS[v || "unverified"];
        const trustChecks = [!!row.email, !!row.phone, !!row.cover_image, !!(row.description?.length > 30), !!(row.documents?.length > 0)];
        const trustScore = trustChecks.filter(Boolean).length * 20;
        return (
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: vl.bg, color: vl.color }}>{vl.label}</span>
            <div style={{ fontSize: 10, color: trustScore >= 60 ? "#22c55e" : "#f59e0b", fontWeight: 600, marginTop: 2 }}>Score: {trustScore}/100</div>
          </div>
        );
      }
    },
    {
      key: "interested_plan", label: "Target Plan",
      render: (v, row) => {
        const p = PLAN_META[v || "LITE"] || PLAN_META.LITE;
        const PIcon = p.icon;
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: p.color + "15", color: p.color }}>
            {PIcon && <PIcon size={10} />}{p.label}
          </span>
        );
      }
    },
    {
      key: "registration_status", label: "Status",
      render: (v, row) => {
        const key = row.is_suspended ? "suspended" : v;
        const s = STATUS_STYLES[key] || STATUS_STYLES.draft;
        return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>;
      }
    },
    {
      key: "submitted_at", label: "Applied",
      render: v => v ? <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(v).toLocaleDateString()}</span> : "—"
    },
  ];

  return (
    <div>
      {/* Sub-view tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[
          { id: "all",          label: "All Vendors",       count: vendors.length,       color: "#64748b" },
          { id: "pending",      label: "Pending Approval",  count: pendingCount,          color: "#f59e0b" },
          { id: "suspended",    label: "Suspended",         count: suspendedCount,        color: "#ef4444" },
          { id: "verification", label: "Verification Queue",count: verificationCount,    color: "#6366f1" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setSubView(tab.id)}
            style={{ padding: "9px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: subView===tab.id ? "none" : "1px solid #e2e8f0", background: subView===tab.id ? tab.color : "#fff", color: subView===tab.id ? "#fff" : "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
            {tab.label}
            <span style={{ fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 10, background: subView===tab.id ? "rgba(255,255,255,0.3)" : tab.color + "15", color: subView===tab.id ? "#fff" : tab.color }}>
              {tab.count}
            </span>
          </button>
        ))}
        <button onClick={load} style={{ marginLeft: "auto", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <RefreshCw size={13} />Refresh
        </button>
      </div>

      {/* Info banner */}
      <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#4338ca" }}>
        <strong>Two-Step Approval Flow:</strong> This screen approves the <em>vendor account</em>. Content moderation happens in <strong>Listings → Pending</strong>.
      </div>

      {/* Type filter (only in all view) */}
      {subView === "all" && (
        <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
          {["all","service","venue","store","happy_hour"].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              style={{ padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: typeFilter===t ? "none" : "1px solid #e2e8f0", background: typeFilter===t ? "#334155" : "#fff", color: typeFilter===t ? "#fff" : "#64748b", textTransform: "capitalize" }}>
              {t === "all" ? "All Types" : t.replace("_", " ")}
            </button>
          ))}
        </div>
      )}

      {loading ? <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Loading vendors...</div> : (
        <DataTable
          columns={columns}
          data={filtered}
          pageSize={15}
          emptyMessage="No vendors found"
          onRowClick={setSelected}
          actions={row => {
            const btns = [];
            if (row.registration_status === "submitted") {
              btns.push(<button key="approve" onClick={e => { e.stopPropagation(); handleApprove(row.id); }} disabled={processing===row.id}
                style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "rgba(34,197,94,0.1)", color: "#22c55e", cursor: "pointer", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                <CheckCircle size={12} />{processing===row.id ? "..." : "Approve"}</button>);
              btns.push(<button key="reject" onClick={e => { e.stopPropagation(); setShowReject(row); }}
                style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                <XCircle size={12} />Reject</button>);
              btns.push(<button key="changes" onClick={e => { e.stopPropagation(); setShowChanges(row); }}
                style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#8b5cf6", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                Request Changes</button>);
            }
            if (row.registration_status === "approved" && !row.is_suspended) {
              btns.push(<button key="suspend" onClick={e => { e.stopPropagation(); handleSuspend(row.id); }}
                style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.08)", color: "#ef4444", cursor: "pointer", fontSize: 11 }}>Suspend</button>);
            }
            btns.push(<button key="view" onClick={e => { e.stopPropagation(); setSelected(row); }}
              style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
              <Eye size={12} />View</button>);
            return btns;
          }}
          bulkActions={[
            { label: "✓ Approve All", color: "rgba(34,197,94,0.1)", textColor: "#22c55e", onClick: ids => ids.forEach(id => handleApprove(id)) },
            { label: "✕ Reject All",  color: "rgba(239,68,68,0.1)", textColor: "#ef4444", onClick: ids => { if(confirm(`Reject ${ids.length} vendors?`)) ids.forEach(id => setVendors(prev => prev.map(v => v.id===id ? {...v,registration_status:"rejected"} : v))); } },
          ]}
        />
      )}

      {/* ═══ VENDOR PROFILE DRAWER ═══ */}
      {selected && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, background: "#fff", boxShadow: "-4px 0 32px rgba(0,0,0,0.14)", zIndex: 50, overflowY: "auto" }}>
          {/* Sticky header */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, margin: 0 }}>Vendor Profile</h3>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
          </div>

          <div style={{ padding: 20 }}>
            {/* Cover */}
            {selected.cover_image && <img src={selected.cover_image} alt="" style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 10, marginBottom: 14 }} />}

            {/* Status badges */}
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
              {(() => { const acct = ACCOUNT_TYPES[selected.vendor_account_type] || ACCOUNT_TYPES.business; const AcctIcon = acct.icon; return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: acct.color+"15", color: acct.color }}><AcctIcon size={10} />{acct.label}</span>; })()}
              {(() => { const key = selected.is_suspended ? "suspended" : selected.registration_status; const s = STATUS_STYLES[key] || STATUS_STYLES.draft; return <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: s.bg, color: s.color }}>{s.label}</span>; })()}
              {selected.is_verified && <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: "rgba(34,197,94,0.1)", color: "#22c55e", display: "flex", alignItems: "center", gap: 3 }}><Shield size={9} />Verified</span>}
            </div>

            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Playfair Display',serif", marginBottom: 12 }}>{selected.business_name}</div>

            {/* Info grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                ["Category",   selected.category_name || "—"],
                ["City",       selected.city          || "—"],
                ["Vendor Type",selected.vendor_type   || "service"],
                ["Plan",       selected.plan_type     || "LITE"],
                ["Experience", selected.experience_years ? selected.experience_years + "y" : "—"],
                ["Min Price",  selected.price_min ? "EGP " + Number(selected.price_min).toLocaleString() : "—"],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: "8px 10px", borderRadius: 7, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Contact</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {selected.email    && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><Mail size={12} style={{ color: "#94a3b8" }} />{selected.email}</div>}
                {selected.phone    && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><Phone size={12} style={{ color: "#94a3b8" }} />{selected.phone}</div>}
                {selected.whatsapp && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><MessageSquare size={12} style={{ color: "#22c55e" }} />{selected.whatsapp}</div>}
                {selected.website  && <a href={selected.website} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6366f1", textDecoration: "none" }}><Globe size={12} />{selected.website}</a>}
              </div>
            </div>

            {/* Description */}
            {(selected.description || selected.bio) && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>About</div>
                <div style={{ fontSize: 12, color: "#334155", background: "#f8fafc", padding: 10, borderRadius: 7, lineHeight: 1.6 }}>{selected.description || selected.bio}</div>
              </div>
            )}

            {/* Trust Score */}
            <TrustScoreCard vendor={selected} />

            {/* Listing Intent */}
            <div style={{ marginBottom: 14, padding: "10px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Listing Intent</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  ["Products",   ShoppingBag, "#FE6972"],
                  ["Services",   Star,        "#6366f1"],
                  ["Venues",     Building2,   "#8b5cf6"],
                  ["Happy Hour", Flame,       "#f59e0b"],
                ].map(([label, Icon, color]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 6, background: "#fff", border: "1px solid #f1f5f9" }}>
                    <Icon size={12} style={{ color }} />
                    <span style={{ fontSize: 11, color: "#334155" }}>{label}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color }}>{selected.listing_intent?.[label.toLowerCase()] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monetization */}
            <div style={{ marginBottom: 14, padding: "10px 12px", background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Monetization Potential</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {Object.entries(PLAN_META).map(([key, p]) => {
                  const PIcon = p.icon;
                  const selected_plan = selected.interested_plan || "LITE";
                  return (
                    <button key={key} onClick={() => updateVendorField(selected.id, "interested_plan", key)}
                      style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: selected_plan===key ? p.color : p.color+"15", color: selected_plan===key ? "#fff" : p.color, cursor: "pointer", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                      {PIcon && <PIcon size={9} />}{p.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>Lead Source:</span>
                <select value={selected.lead_source || "website"} onChange={e => updateVendorField(selected.id, "lead_source", e.target.value)}
                  style={{ fontSize: 10, padding: "3px 6px", borderRadius: 5, border: "1px solid #e2e8f0", color: "#334155", cursor: "pointer" }}>
                  {LEAD_SOURCES.map(s => <option key={s} value={s} style={{ textTransform: "capitalize" }}>{s.replace("_"," ")}</option>)}
                </select>
              </div>
            </div>

            {/* Verification Level */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Verification Level</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {Object.entries(VERIFICATION_LEVELS).map(([key, val]) => (
                  <button key={key} onClick={() => setVerificationLevel(selected.id, key)}
                    style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: (selected.verification_level||"unverified")===key ? val.color : val.bg, color: (selected.verification_level||"unverified")===key ? "#fff" : val.color, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
                    {val.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Documents</div>
              {(Array.isArray(selected.documents) ? selected.documents : []).length === 0
                ? <div style={{ fontSize: 11, color: "#94a3b8", padding: "7px 10px", background: "#f8fafc", borderRadius: 6 }}>⚠ No documents uploaded</div>
                : (Array.isArray(selected.documents) ? selected.documents : []).map((doc, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 8px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 5, marginBottom: 3 }}>
                    <CheckCircle size={11} style={{ color: "#22c55e" }} />
                    <span style={{ fontSize: 11 }}>{doc.name || doc.type || "Document"}</span>
                  </div>
                ))
              }
            </div>

            {/* Approval Checklist */}
            <div style={{ marginBottom: 14, padding: 12, background: "#fafafa", border: "1px solid #e2e8f0", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Approval Checklist</div>
              {[
                ["Business name",      !!selected.business_name],
                ["Contact info",       !!(selected.phone || selected.email)],
                ["City specified",     !!selected.city],
                ["Description/bio",    !!(selected.description || selected.bio)],
                ["Category set",       !!selected.category_name],
                ["Cover image",        !!selected.cover_image],
                ["Pricing set",        !!(selected.price_min > 0)],
              ].map(([label, done]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  {done ? <CheckCircle size={13} style={{ color: "#22c55e", flexShrink: 0 }} /> : <AlertTriangle size={13} style={{ color: "#f59e0b", flexShrink: 0 }} />}
                  <span style={{ fontSize: 11, color: done ? "#334155" : "#94a3b8" }}>{label}</span>
                  {!done && <span style={{ marginLeft: "auto", fontSize: 9, color: "#f59e0b", fontWeight: 700 }}>MISSING</span>}
                </div>
              ))}
            </div>

            {/* Rejection reason */}
            {selected.rejected_reason && (
              <div style={{ padding: 10, borderRadius: 7, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, marginBottom: 3 }}>Rejection Reason</div>
                <div style={{ fontSize: 12, color: "#7f1d1d" }}>{selected.rejected_reason}</div>
              </div>
            )}

            {/* Internal Notes */}
            <InternalNotes vendorId={selected.id} />

            {/* Action buttons */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
              {selected.registration_status === "submitted" && (
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <button onClick={() => handleApprove(selected.id)} disabled={processing===selected.id}
                    style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <CheckCircle size={14} />{processing===selected.id ? "Approving..." : "Approve Vendor"}
                  </button>
                  <button onClick={() => { setShowReject(selected); setSelected(null); }}
                    style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                    <XCircle size={14} />Reject
                  </button>
                </div>
              )}
              {selected.registration_status === "submitted" && (
                <button onClick={() => { setShowChanges(selected); setSelected(null); }}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #8b5cf6", background: "#fff", color: "#8b5cf6", cursor: "pointer", fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                  Request Changes
                </button>
              )}
              {selected.registration_status === "approved" && !selected.is_suspended && (
                <button onClick={() => handleSuspend(selected.id)}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                  Suspend Vendor
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {showReject && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 22, width: 420, maxHeight: "80vh", overflowY: "auto" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, marginBottom: 4 }}>Reject Vendor</h3>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>{showReject.business_name}</div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>Reason *</label>
            {REJECT_REASONS.map(r => (
              <label key={r} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, cursor: "pointer", padding: "6px 10px", borderRadius: 6, background: rejectReason===r ? "rgba(239,68,68,0.06)" : "#f8fafc", border: rejectReason===r ? "1px solid rgba(239,68,68,0.3)" : "1px solid #e2e8f0", marginBottom: 4 }}>
                <input type="radio" checked={rejectReason===r} onChange={() => setRejectReason(r)} style={{ accentColor: "#ef4444" }} />{r}
              </label>
            ))}
            <div style={{ display: "flex", gap: 7, marginTop: 14 }}>
              <button onClick={() => handleReject(showReject.id)} disabled={!rejectReason || processing===showReject.id}
                style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", background: rejectReason ? "#ef4444" : "#e2e8f0", color: "#fff", cursor: rejectReason ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13 }}>
                {processing===showReject.id ? "Rejecting..." : "Reject Vendor"}
              </button>
              <button onClick={() => { setShowReject(null); setRejectReason(""); }}
                style={{ padding: "11px 18px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REQUEST CHANGES MODAL ── */}
      {showChanges && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 22, width: 420, maxHeight: "80vh", overflowY: "auto" }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, marginBottom: 4 }}>Request Changes</h3>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>{showChanges.business_name}</div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 }}>What needs to be updated? (select all that apply)</label>
            {CHANGE_REASONS.map(r => (
              <label key={r} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, cursor: "pointer", padding: "6px 10px", borderRadius: 6, background: changeReasons.includes(r) ? "rgba(139,92,246,0.06)" : "#f8fafc", border: changeReasons.includes(r) ? "1px solid rgba(139,92,246,0.3)" : "1px solid #e2e8f0", marginBottom: 4 }}>
                <input type="checkbox" checked={changeReasons.includes(r)} onChange={e => setChangeReasons(prev => e.target.checked ? [...prev, r] : prev.filter(x => x !== r))} style={{ accentColor: "#8b5cf6" }} />{r}
              </label>
            ))}
            <textarea value={changesNote} onChange={e => setChangesNote(e.target.value)} rows={3} placeholder="Additional details..."
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", marginTop: 8, marginBottom: 14 }} />
            <div style={{ display: "flex", gap: 7 }}>
              <button onClick={() => handleRequestChanges(showChanges.id)} disabled={!changeReasons.length && !changesNote}
                style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", background: (changeReasons.length || changesNote) ? "#8b5cf6" : "#e2e8f0", color: "#fff", cursor: (changeReasons.length || changesNote) ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13 }}>
                Send Request
              </button>
              <button onClick={() => { setShowChanges(null); setChangeReasons([]); setChangesNote(""); }}
                style={{ padding: "11px 18px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
