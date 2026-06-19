import { useState, useEffect } from "react";
import {
  CheckCircle, XCircle, Eye, Clock, Building2, Mail, Phone,
  FileText, Shield, User, Store, Camera, MapPin, Globe,
  Instagram, MessageSquare, AlertTriangle, Star, Package,
  RefreshCw, X, ChevronDown, Verified
} from "lucide-react";
import DataTable from "../components/DataTable";

const API = "/api/cms";

const ACCOUNT_TYPES = {
  individual:       { label: "Individual",        color: "#6366f1", icon: User      },
  business:         { label: "Business",           color: "#FE6972", icon: Building2 },
  venue_owner:      { label: "Venue Owner",        color: "#8b5cf6", icon: Building2 },
  service_provider: { label: "Service Provider",   color: "#22c55e", icon: Star      },
  store:            { label: "Store",              color: "#f59e0b", icon: Store     },
};

const VERIFICATION_LEVELS = {
  unverified:       { label: "Unverified",         color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
  phone_verified:   { label: "Phone Verified",     color: "#6366f1", bg: "rgba(99,102,241,0.1)"  },
  verified:         { label: "Verified",           color: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
  premium_verified: { label: "Premium Verified",   color: "#D4AF37", bg: "rgba(212,175,55,0.1)"  },
};

const RISK_COLORS = {
  low:    { color: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  high:   { color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
};

const STATUS_STYLES = {
  submitted: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Pending"  },
  approved:  { bg: "rgba(34,197,94,0.1)",  color: "#22c55e", label: "Approved" },
  rejected:  { bg: "rgba(239,68,68,0.1)",  color: "#ef4444", label: "Rejected" },
  draft:     { bg: "rgba(100,116,139,0.1)",color: "#64748b", label: "Draft"    },
};

const VENDOR_TYPES_ALL = ["all","service","venue","store","happy_hour"];

export default function VendorApprovalQueue() {
  const [vendors,       setVendors]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selected,      setSelected]      = useState(null);
  const [filter,        setFilter]        = useState("submitted");
  const [typeFilter,    setTypeFilter]    = useState("all");
  const [showReject,    setShowReject]    = useState(null);
  const [showChanges,   setShowChanges]   = useState(null);
  const [rejectReason,  setRejectReason]  = useState("");
  const [changesNote,   setChangesNote]   = useState("");
  const [processing,    setProcessing]    = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(API + "/admin/vendors").then(r => r.ok ? r.json() : null);
      const data = res?.result?.data || res?.data || [];
      setVendors(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(id) {
    setProcessing(id);
    try {
      await fetch(API + "/admin/approve/" + id);
      setVendors(prev => prev.map(v => v.id === id
        ? { ...v, registration_status: "approved", is_verified: true, is_active: true }
        : v
      ));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, registration_status: "approved", is_verified: true } : null);
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

  async function handleRequestChanges(id) {
    if (!changesNote) return;
    try {
      await fetch(API + "/admin/vendors/" + id + "/request-changes", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: changesNote })
      }).catch(() => {});
      setShowChanges(null); setChangesNote("");
    } catch {}
  }

  async function setVerificationLevel(id, level) {
    await fetch(API + "/admin/vendors/" + id + "/verify", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verification_level: level })
    }).catch(() => {});
    setVendors(prev => prev.map(v => v.id === id ? { ...v, verification_level: level } : v));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, verification_level: level } : null);
  }

  const filtered = vendors.filter(v => {
    const statusMatch = filter === "all" ? true : v.registration_status === filter;
    const typeMatch   = typeFilter === "all" ? true : v.vendor_type === typeFilter;
    return statusMatch && typeMatch;
  });

  const pendingCount  = vendors.filter(v => v.registration_status === "submitted").length;
  const approvedCount = vendors.filter(v => v.registration_status === "approved").length;
  const rejectedCount = vendors.filter(v => v.registration_status === "rejected").length;

  const columns = [
    {
      key: "business_name", label: "Vendor",
      render: (v, row) => {
        const acct = ACCOUNT_TYPES[row.vendor_account_type] || ACCOUNT_TYPES.business;
        const AcctIcon = acct.icon;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: acct.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AcctIcon size={16} style={{ color: acct.color }} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
              <div style={{ display: "flex", gap: 5, marginTop: 2 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 10, background: acct.color + "15", color: acct.color }}>{acct.label}</span>
                {row.vendor_type && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 10, background: "#f1f5f9", color: "#64748b", textTransform: "capitalize" }}>{row.vendor_type}</span>}
              </div>
            </div>
          </div>
        );
      }
    },
    { key: "category_name", label: "Category", render: v => <span style={{ fontSize: 12, color: "#475569", textTransform: "capitalize" }}>{v || "—"}</span> },
    { key: "city", label: "City", render: (v, row) => (
      <div style={{ fontSize: 12 }}>
        <div>{v || "—"}</div>
        {row.phone && <div style={{ fontSize: 10, color: "#94a3b8", display: "flex", alignItems: "center", gap: 3 }}><Phone size={10} />{row.phone}</div>}
      </div>
    )},
    {
      key: "verification_level", label: "Trust",
      render: (v, row) => {
        const vl = VERIFICATION_LEVELS[v || "unverified"];
        const risk = RISK_COLORS[row.risk_score || "low"];
        return (
          <div>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: vl.bg, color: vl.color }}>{vl.label}</span>
            <span style={{ fontSize: 9, marginLeft: 4, fontWeight: 600, padding: "1px 5px", borderRadius: 8, background: risk.bg, color: risk.color }}>{(row.risk_score || "low")} risk</span>
          </div>
        );
      }
    },
    {
      key: "registration_status", label: "Status",
      render: v => {
        const s = STATUS_STYLES[v] || STATUS_STYLES.draft;
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
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Pending Review", value: pendingCount,           color: "#f59e0b", action: () => setFilter("submitted") },
          { label: "Approved",       value: approvedCount,          color: "#22c55e", action: () => setFilter("approved")  },
          { label: "Rejected",       value: rejectedCount,          color: "#ef4444", action: () => setFilter("rejected")  },
          { label: "Total Vendors",  value: vendors.length,         color: "#6366f1", action: () => setFilter("all")       },
        ].map(s => (
          <div key={s.label} onClick={s.action} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Playfair Display',serif", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Info box: two-step flow */}
      <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: "#4338ca" }}>
        <strong>Two-Step Approval:</strong> This screen approves the <em>vendor account</em> (business legitimacy). Content moderation for listings happens separately in <strong>Listings → Pending</strong>.
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 5 }}>
          {[["all","All"],["submitted","Pending"],["approved","Approved"],["rejected","Rejected"]].map(([val,label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: filter===val?"none":"1px solid #e2e8f0", background: filter===val?"var(--coral,#FE6972)":"#fff", color: filter===val?"#fff":"#64748b" }}>
              {label} ({val==="all"?vendors.length:vendors.filter(v=>v.registration_status===val).length})
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 5, marginLeft: 8 }}>
          {VENDOR_TYPES_ALL.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              style={{ padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: typeFilter===t?"none":"1px solid #e2e8f0", background: typeFilter===t?"#334155":"#fff", color: typeFilter===t?"#fff":"#64748b", textTransform: "capitalize" }}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={load} style={{ marginLeft: "auto", padding: "7px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <RefreshCw size={13} />Refresh
        </button>
      </div>

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
              btns.push(
                <button key="approve" onClick={e => { e.stopPropagation(); handleApprove(row.id); }} disabled={processing===row.id}
                  style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "rgba(34,197,94,0.1)", color: "#22c55e", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                  <CheckCircle size={13} />{processing===row.id?"...":"Approve"}
                </button>
              );
              btns.push(
                <button key="reject" onClick={e => { e.stopPropagation(); setShowReject(row); }}
                  style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                  <XCircle size={13} />Reject
                </button>
              );
              btns.push(
                <button key="changes" onClick={e => { e.stopPropagation(); setShowChanges(row); }}
                  style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#8b5cf6", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  Request Changes
                </button>
              );
            }
            btns.push(
              <button key="view" onClick={e => { e.stopPropagation(); setSelected(row); }}
                style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}>
                <Eye size={13} />View
              </button>
            );
            return btns;
          }}
          bulkActions={[
            { label: "✓ Approve All", color: "rgba(34,197,94,0.1)", textColor: "#22c55e", onClick: ids => ids.forEach(id => handleApprove(id)) },
            { label: "✕ Reject All",  color: "rgba(239,68,68,0.1)", textColor: "#ef4444", onClick: ids => { if(confirm(`Reject ${ids.length} vendors?`)) ids.forEach(id => { setVendors(prev => prev.map(v => v.id===id?{...v,registration_status:"rejected"}:v)); }); } },
          ]}
        />
      )}

      {/* ── VENDOR PROFILE DRAWER ── */}
      {selected && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 460, background: "#fff", boxShadow: "-4px 0 32px rgba(0,0,0,0.14)", zIndex: 50, overflowY: "auto" }}>
          {/* Header */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, margin: 0 }}>Vendor Profile</h3>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
          </div>

          <div style={{ padding: 24 }}>
            {/* Cover + basic info */}
            {selected.cover_image && (
              <img src={selected.cover_image} alt="" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 12, marginBottom: 16 }} />
            )}

            {/* Account type + status */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {(() => {
                const acct = ACCOUNT_TYPES[selected.vendor_account_type] || ACCOUNT_TYPES.business;
                const AcctIcon = acct.icon;
                return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: acct.color+"15", color: acct.color }}><AcctIcon size={11} />{acct.label}</span>;
              })()}
              {(() => {
                const s = STATUS_STYLES[selected.registration_status] || STATUS_STYLES.draft;
                return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>;
              })()}
              {selected.is_verified && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(34,197,94,0.1)", color: "#22c55e", display: "flex", alignItems: "center", gap: 3 }}><Shield size={10} />Verified</span>}
            </div>

            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display',serif", marginBottom: 4 }}>{selected.business_name}</div>
            {selected.business_name_ar && <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 8, direction: "rtl" }}>{selected.business_name_ar}</div>}

            {/* Info grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                ["Category",    selected.category_name || "—"],
                ["City",        selected.city          || "—"],
                ["Vendor Type", selected.vendor_type   || "—"],
                ["Plan",        selected.plan_type     || "LITE"],
                ["Experience",  selected.experience_years ? selected.experience_years + " years" : "—"],
                ["Price Min",   selected.price_min ? "EGP " + Number(selected.price_min).toLocaleString() : "—"],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: 10, borderRadius: 8, background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Contact</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {selected.email    && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><Mail size={13} style={{ color: "#94a3b8" }} />{selected.email}</div>}
                {selected.phone    && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><Phone size={13} style={{ color: "#94a3b8" }} />{selected.phone}</div>}
                {selected.whatsapp && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}><MessageSquare size={13} style={{ color: "#22c55e" }} />{selected.whatsapp}</div>}
                {selected.website  && <a href={selected.website} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6366f1", textDecoration: "none" }}><Globe size={13} />{selected.website}</a>}
                {selected.instagram && <a href={`https://instagram.com/${selected.instagram}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#e1306c", textDecoration: "none" }}><Instagram size={13} />@{selected.instagram}</a>}
              </div>
            </div>

            {/* About */}
            {(selected.description || selected.bio) && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>About</div>
                <div style={{ fontSize: 13, color: "#334155", background: "#f8fafc", padding: 12, borderRadius: 8, lineHeight: 1.6 }}>
                  {selected.description || selected.bio}
                </div>
              </div>
            )}

            {/* Documents */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Documents</div>
              {(Array.isArray(selected.documents) ? selected.documents : []).length === 0
                ? <div style={{ fontSize: 12, color: "#94a3b8", padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>No documents uploaded</div>
                : (Array.isArray(selected.documents) ? selected.documents : []).map((doc, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, marginBottom: 4 }}>
                    <CheckCircle size={12} style={{ color: "#22c55e" }} />
                    <span style={{ fontSize: 12 }}>{doc.name || doc.type || "Document"}</span>
                  </div>
                ))
              }
            </div>

            {/* Verification Level */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Verification Level</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.entries(VERIFICATION_LEVELS).map(([key, val]) => (
                  <button key={key} onClick={() => setVerificationLevel(selected.id, key)}
                    style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: (selected.verification_level||"unverified")===key ? val.color : val.bg, color: (selected.verification_level||"unverified")===key ? "#fff" : val.color, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
                    {val.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Approval Checklist */}
            <div style={{ marginBottom: 20, padding: 14, background: "#fafafa", border: "1px solid #e2e8f0", borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", marginBottom: 10 }}>Approval Checklist</div>
              {[
                ["Has business name",       !!selected.business_name],
                ["Has contact info",         !!(selected.phone || selected.email)],
                ["Has city",                !!selected.city],
                ["Has description/bio",      !!(selected.description || selected.bio)],
                ["Has category",            !!selected.category_name],
                ["Has cover image",         !!selected.cover_image],
                ["Has pricing",             !!(selected.price_min > 0)],
              ].map(([label, done]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  {done
                    ? <CheckCircle size={14} style={{ color: "#22c55e", flexShrink: 0 }} />
                    : <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #e2e8f0", flexShrink: 0 }} />}
                  <span style={{ fontSize: 12, color: done ? "#334155" : "#94a3b8", textDecoration: done ? "none" : "none" }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Rejection reason if rejected */}
            {selected.rejected_reason && (
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 600, marginBottom: 4 }}>Rejection Reason</div>
                <div style={{ fontSize: 13, color: "#7f1d1d" }}>{selected.rejected_reason}</div>
              </div>
            )}

            {/* Action buttons */}
            {selected.registration_status === "submitted" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleApprove(selected.id)} disabled={processing===selected.id}
                  style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <CheckCircle size={16} />{processing===selected.id?"Approving...":"Approve Vendor"}
                </button>
                <button onClick={() => { setShowReject(selected); setSelected(null); }}
                  style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <XCircle size={16} />Reject
                </button>
                <button onClick={() => { setShowChanges(selected); setSelected(null); }}
                  style={{ padding: 12, borderRadius: 8, border: "1px solid #8b5cf6", background: "#fff", color: "#8b5cf6", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                  Request Changes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {showReject && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 420 }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, marginBottom: 4 }}>Reject Vendor</h3>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{showReject.business_name}</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569", display: "block", marginBottom: 8 }}>Reason *</label>
              {[
                "Incomplete business information",
                "Unable to verify identity",
                "Not a wedding-related business",
                "Duplicate account",
                "Suspicious activity",
                "Does not meet marketplace standards",
                "Other",
              ].map(r => (
                <label key={r} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", padding: "7px 10px", borderRadius: 6, background: rejectReason===r?"rgba(239,68,68,0.06)":"#f8fafc", border: rejectReason===r?"1px solid rgba(239,68,68,0.3)":"1px solid #e2e8f0", marginBottom: 5 }}>
                  <input type="radio" checked={rejectReason===r} onChange={() => setRejectReason(r)} style={{ accentColor: "#ef4444" }} />
                  {r}
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => handleReject(showReject.id)} disabled={!rejectReason || processing===showReject.id}
                style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", background: rejectReason?"#ef4444":"#e2e8f0", color: "#fff", cursor: rejectReason?"pointer":"not-allowed", fontWeight: 700, fontSize: 14 }}>
                {processing===showReject.id?"Rejecting...":"Reject Vendor"}
              </button>
              <button onClick={() => { setShowReject(null); setRejectReason(""); }}
                style={{ padding: "11px 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REQUEST CHANGES MODAL ── */}
      {showChanges && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: 420 }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, marginBottom: 4 }}>Request Changes</h3>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{showChanges.business_name}</div>
            <textarea value={changesNote} onChange={e => setChangesNote(e.target.value)} rows={4} placeholder="Describe what needs to be updated (e.g. please upload commercial registration, add a clearer business description)..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 14 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => handleRequestChanges(showChanges.id)} disabled={!changesNote}
                style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", background: changesNote?"#8b5cf6":"#e2e8f0", color: "#fff", cursor: changesNote?"pointer":"not-allowed", fontWeight: 700, fontSize: 14 }}>
                Send Request
              </button>
              <button onClick={() => { setShowChanges(null); setChangesNote(""); }}
                style={{ padding: "11px 20px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
