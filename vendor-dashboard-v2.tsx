"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  LayoutDashboard, MessageCircle, Users, DollarSign, Star, Eye,
  Clock, Check, X as XIcon, Bell, Settings, Crown, Zap,
  Calendar, Package, BarChart3, Mail, Phone, Shield, Send,
  Upload, Edit, AlertCircle, Target, Plus, Menu, Wallet,
  FileText, Save, Trash2, ShoppingBag, Tag, Clock3,
  ImagePlus, CheckCircle2, AlertTriangle, Info, Layers,
  Megaphone, List, RefreshCw, TrendingUp, ArrowRight,
  Building, User, Flame, Receipt, ChevronRight
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "";

// ── Vendor type config ────────────────────────────────────────
const VENDOR_CONFIG: Record<string, {
  label: string; color: string; icon: any;
  sidebar: string[]; kpis: string[];
}> = {
  individual: {
    label: "Individual Seller", color: "#6366f1", icon: User,
    sidebar: ["overview","listings","leads","messages","billing","settings"],
    kpis:    ["views","active_listings","pending_listings","leads","ad_quota"],
  },
  service: {
    label: "Service Provider", color: "#FE6972", icon: Star,
    sidebar: ["overview","profile","packages","listings","leads","proposals","messages","calendar","earnings","analytics","settings"],
    kpis:    ["views","leads","messages","earnings","rating"],
  },
  store: {
    label: "Store", color: "#8b5cf6", icon: ShoppingBag,
    sidebar: ["overview","profile","listings","leads","messages","earnings","analytics","settings"],
    kpis:    ["views","active_listings","pending_listings","leads","earnings"],
  },
  venue: {
    label: "Venue Owner", color: "#D4AF37", icon: Building,
    sidebar: ["overview","profile","listings","leads","calendar","messages","earnings","analytics","settings"],
    kpis:    ["views","active_listings","leads","messages","rating"],
  },
  happy_hour: {
    label: "Happy Hour Vendor", color: "#f59e0b", icon: Flame,
    sidebar: ["overview","profile","packages","listings","leads","messages","earnings","settings"],
    kpis:    ["views","active_listings","leads","messages","earnings"],
  },
};

const SIDEBAR_LABELS: Record<string, { label: string; icon: any }> = {
  overview:   { label: "Overview",          icon: LayoutDashboard },
  profile:    { label: "Profile",           icon: Target          },
  packages:   { label: "Packages",          icon: Package         },
  listings:   { label: "My Listings",       icon: ShoppingBag     },
  leads:      { label: "Leads",             icon: Users           },
  proposals:  { label: "Proposals",         icon: FileText        },
  messages:   { label: "Messages",          icon: MessageCircle   },
  calendar:   { label: "Calendar",          icon: Calendar        },
  earnings:   { label: "Earnings",          icon: Wallet          },
  billing:    { label: "Plan & Billing",    icon: Receipt         },
  analytics:  { label: "Analytics",         icon: BarChart3       },
  settings:   { label: "Settings",          icon: Settings        },
};

const PLAN_META: Record<string, { label: string; color: string; icon: any }> = {
  TOP:   { label: "Top",   color: "#D4AF37", icon: Crown },
  PRO:   { label: "Pro",   color: "#6366f1", icon: Zap   },
  BASIC: { label: "Basic", color: "#22c55e", icon: Check },
  LITE:  { label: "Lite",  color: "#94a3b8", icon: null  },
};

const inp = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition bg-white";

// ── Ad Quota Widget ───────────────────────────────────────────
function AdQuotaWidget({ vendor }: { vendor: any }) {
  const used      = vendor?.ads_used_month || 0;
  const limit     = vendor?.monthly_ad_limit || 3;
  const remaining = Math.max(0, limit - used);
  const pct       = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color     = remaining === 0 ? "#ef4444" : remaining === 1 ? "#f59e0b" : "#22c55e";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 text-base">Monthly Ad Quota</h3>
        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: color + "15", color }}>
          {remaining} remaining
        </span>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-black" style={{ color, fontFamily: "'Playfair Display',serif" }}>{used}</span>
        <span className="text-lg text-gray-400 mb-0.5">/ {limit}</span>
        <span className="text-sm text-gray-400 mb-0.5">ads used this month</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: pct + "%", background: `linear-gradient(to right, ${color}, ${color}cc)` }} />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Resets: {vendor?.ads_reset_date ? new Date(vendor.ads_reset_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "1st of month"}</span>
        <Link href="/vendor/dashboard" className="font-semibold" style={{ color: "#FE6972" }}>Upgrade Plan →</Link>
      </div>
    </div>
  );
}

// ── Listing Status Widget ─────────────────────────────────────
function ListingStatusWidget({ shopProducts }: { shopProducts: any[] }) {
  const live    = shopProducts.filter(p => p.status === "active").length;
  const pending = shopProducts.filter(p => p.status === "pending").length;
  const expired = shopProducts.filter(p => p.status === "expired").length;
  const rejected= shopProducts.filter(p => p.status === "rejected").length;

  // Next expiry
  const active  = shopProducts.filter(p => p.status === "active" && p.expires_at);
  const nextExp = active.sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime())[0];
  const daysLeft = nextExp ? Math.ceil((new Date(nextExp.expires_at).getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="font-bold text-gray-900 text-base mb-4">Listings Status</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "Live",           value: live,    color: "#22c55e", bg: "#f0fdf4" },
          { label: "Pending Review", value: pending, color: "#f59e0b", bg: "#fffbeb", alert: pending > 0 },
          { label: "Expired",        value: expired, color: "#94a3b8", bg: "#f8fafc" },
          { label: "Rejected",       value: rejected,color: "#ef4444", bg: "#fef2f2" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 border" style={{ background: s.bg, borderColor: s.color + "30" }}>
            <div className="text-2xl font-black mb-0.5" style={{ color: s.color, fontFamily: "'Playfair Display',serif" }}>{s.value}</div>
            <div className="text-xs font-medium" style={{ color: s.color + "cc" }}>{s.label}</div>
          </div>
        ))}
      </div>
      {daysLeft !== null && (
        <div className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold ${daysLeft <= 5 ? "bg-red-50 text-red-700 border border-red-100" : "bg-amber-50 text-amber-700 border border-amber-100"}`}>
          <Clock className="w-3.5 h-3.5 shrink-0" />
          Next expiry in {daysLeft} days — renew to stay live (100 EGP)
        </div>
      )}
    </div>
  );
}

// ── Status Banner ─────────────────────────────────────────────
function StatusBanner({ vendor }: { vendor: any }) {
  if (vendor.registration_status === "approved" && vendor.is_active) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl border mb-6" style={{ background: "#f0fdf4", borderColor: "#86efac" }}>
        <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-green-800">Account Active — Your listings are live on the marketplace</p>
          <p className="text-sm text-green-600 mt-0.5">Customers can find and contact you</p>
        </div>
        <Link href={`/services/${vendor.id}`} className="text-sm font-bold px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition shrink-0">
          View Profile
        </Link>
      </div>
    );
  }
  if (vendor.registration_status === "submitted") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl border mb-6" style={{ background: "#fffbeb", borderColor: "#fcd34d" }}>
        <Clock className="w-6 h-6 text-amber-500 shrink-0" />
        <div>
          <p className="font-bold text-amber-800">Account Under Review</p>
          <p className="text-sm text-amber-600 mt-0.5">Admin will approve your account within 24 hours. You can prepare your listings in the meantime.</p>
        </div>
      </div>
    );
  }
  if (vendor.registration_status === "rejected") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl border mb-6" style={{ background: "#fef2f2", borderColor: "#fca5a5" }}>
        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <p className="font-bold text-red-800">Account Needs Attention</p>
          <p className="text-sm text-red-600 mt-0.5">{vendor.rejected_reason || "Update your profile and contact support."}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl border mb-6" style={{ background: "#eff6ff", borderColor: "#93c5fd" }}>
      <Info className="w-6 h-6 text-blue-500 shrink-0" />
      <div className="flex-1">
        <p className="font-bold text-blue-800">Complete your profile to go live</p>
        <p className="text-sm text-blue-600 mt-0.5">Fill in all required fields and submit for review</p>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function VendorDashboard() {
  const [tab,           setTab]           = useState("overview");
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [vendor,        setVendor]        = useState<any>(null);
  const [vendorId,      setVendorId]      = useState<string | null>(null);
  const [leads,         setLeads]         = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [packages,      setPackages]      = useState<any[]>([]);
  const [services,      setServices]      = useState<any[]>([]);
  const [earnings,      setEarnings]      = useState<any[]>([]);
  const [proposals,     setProposals]     = useState<any[]>([]);
  const [shopProducts,  setShopProducts]  = useState<any[]>([]);
  const [shopCategories,setShopCategories]= useState<any[]>([]);
  const [shopQuota,     setShopQuota]     = useState<any>(null);
  const [portfolioImages,setPortfolioImages]=useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);

  // Profile edit
  const [editMode,    setEditMode]    = useState(false);
  const [editForm,    setEditForm]    = useState<any>({});
  const [coverPreview,setCoverPreview]= useState<string | null>(null);
  const coverRef    = useRef<HTMLInputElement>(null);
  const portfolioRef= useRef<HTMLInputElement>(null);

  // Messages
  const [replyText,    setReplyText]    = useState("");
  const [activeConv,   setActiveConv]   = useState<string | null>(null);
  const [convMessages, setConvMessages] = useState<any[]>([]);

  // Package form
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [editingPkg,  setEditingPkg]  = useState<any>(null);
  const [pkgForm,     setPkgForm]     = useState({ name: "", price: "", description: "", includes: "", is_popular: false });

  // Service tag input
  const [svcInput, setSvcInput] = useState("");

  // Shop listing form
  const [showShopForm,       setShowShopForm]       = useState(false);
  const [editingShopProduct, setEditingShopProduct] = useState<any>(null);

  useEffect(() => {
    const vid = localStorage.getItem("vendorId") || localStorage.getItem("vendor_id");
    if (vid) setVendorId(vid);
    loadDashboard(vid);
  }, []);

  useEffect(() => {
    if (tab === "listings" && vendorId && shopProducts.length === 0) loadShopData(vendorId);
  }, [tab, vendorId]);

  async function loadDashboard(vid: string | null) {
    setLoading(true);
    try {
      const url = vid
        ? `${API}/api/services/vendor/dashboard-full-by-id?vendor_id=${vid}`
        : `${API}/api/services/vendor/dashboard-full`;
      const d = await fetch(url).then(r => r.json());
      if (d.success && d.data?.vendor) {
        const v = d.data.vendor;
        setVendor(v);
        setVendorId(v.id?.toString());
        localStorage.setItem("vendorId", v.id?.toString());
        setLeads(d.data.leads || []);
        setConversations(d.data.conversations || []);
        setPackages(d.data.packages || []);
        setServices(d.data.services || []);
        setEarnings(d.data.earnings || []);
        setProposals(d.data.proposals || []);
        if (v.id) {
          fetch(`${API}/api/services/vendor/${v.id}/portfolio`)
            .then(r => r.json()).then(d => { if (d.success) setPortfolioImages(d.data || []); }).catch(() => {});
        }
      }
    } catch {}
    setLoading(false);
  }

  async function loadShopData(vid: string) {
    try {
      const [prod, cats] = await Promise.all([
        fetch(`${API}/api/shop/vendor/${vid}/products`).then(r => r.json()),
        fetch(`${API}/api/shop/categories?includeSubcategories=true`).then(r => r.json()),
      ]);
      if (prod.success) { setShopProducts(prod.data || []); setShopQuota(prod.quota); }
      if (cats.success) setShopCategories(cats.data || []);
    } catch {}
  }

  const vendorType   = vendor?.vendor_type || "service";
  const config       = VENDOR_CONFIG[vendorType] || VENDOR_CONFIG.service;
  const planMeta     = PLAN_META[vendor?.plan_type || "LITE"] || PLAN_META.LITE;
  const PlanIcon     = planMeta.icon;
  const TypeIcon     = config.icon;
  const pendingLeads = leads.filter(l => l.status === "PENDING").length;
  const totalEarnings= earnings.filter(e => e.status === "completed").reduce((s, e) => s + parseFloat(e.amount), 0);

  // Profile completeness
  function profileScore() {
    let s = 0;
    if (vendor?.cover_image) s += 20;
    if ((vendor?.description?.length || 0) > 30) s += 15;
    if (vendor?.phone || vendor?.whatsapp) s += 15;
    if (vendor?.price_min > 0) s += 15;
    if (portfolioImages.length >= 3) s += 20;
    if (packages.length >= 1) s += 10;
    if (vendor?.city) s += 5;
    return Math.min(s, 100);
  }
  const score      = profileScore();
  const scoreColor = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

  async function saveProfile() {
    if (!vendorId) return;
    setSaving(true);
    try {
      const body: any = { ...editForm };
      if (coverPreview) body.cover_image = coverPreview;
      const r = await fetch(`${API}/api/services/vendor/${vendorId}/profile`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
      }).then(r => r.json());
      if (r.success) { setVendor(r.data); setEditMode(false); setCoverPreview(null); }
    } catch {}
    setSaving(false);
  }

  function startEdit() {
    setEditForm({
      business_name: vendor?.business_name || "",
      description:   vendor?.description   || "",
      bio:           vendor?.bio           || "",
      city:          vendor?.city          || "",
      phone:         vendor?.phone         || "",
      whatsapp:      vendor?.whatsapp      || "",
      price_min:     vendor?.price_min     || "",
      experience_years: vendor?.experience_years || "",
      website:       vendor?.website       || "",
    });
    setEditMode(true);
    setTab("profile");
  }

  async function addPackage() {
    if (!vendorId || !pkgForm.name || !pkgForm.price) return;
    setSaving(true);
    const body = { ...pkgForm, includes: pkgForm.includes.split(",").map(s => s.trim()).filter(Boolean) };
    if (editingPkg) {
      const r = await fetch(`${API}/api/services/vendor/${vendorId}/packages/${editingPkg.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json());
      if (r.success) setPackages(prev => prev.map(p => p.id === editingPkg.id ? r.data : p));
    } else {
      const r = await fetch(`${API}/api/services/vendor/${vendorId}/packages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json());
      if (r.success) setPackages(prev => [...prev, r.data]);
    }
    setPkgForm({ name: "", price: "", description: "", includes: "", is_popular: false });
    setEditingPkg(null); setShowPkgForm(false); setSaving(false);
  }

  async function deletePackage(id: string) {
    if (!confirm("Delete package?")) return;
    await fetch(`${API}/api/services/vendor/${vendorId}/packages/${id}`, { method: "DELETE" });
    setPackages(prev => prev.filter(p => p.id !== id));
  }

  async function addServiceTag() {
    if (!vendorId || !svcInput.trim()) return;
    const r = await fetch(`${API}/api/services/vendor/${vendorId}/services-item`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: svcInput.trim() }) }).then(r => r.json());
    if (r.success) setServices(prev => [...prev, r.data]);
    setSvcInput("");
  }

  const loadConv = async (id: string) => {
    setActiveConv(id);
    const r = await fetch(`${API}/api/services/chat/conversation/${id}`).then(r => r.json());
    if (r.success) setConvMessages(r.data || []);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeConv) return;
    await fetch(`${API}/api/services/chat/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversation_id: activeConv, content: replyText, sender_type: "vendor" }) });
    setConvMessages(p => [...p, { sender_type: "vendor", content: replyText, created_at: new Date().toISOString() }]);
    setReplyText("");
  };

  const updateLead = async (id: string, status: string) => {
    await fetch(`${API}/api/services/vendor/leads/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setLeads(p => p.map(l => l.id === id ? { ...l, status } : l));
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#FE6972] border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-gray-400 font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );

  const sidebarItems = config.sidebar.filter(id => SIDEBAR_LABELS[id]);

  return (
    <div className="min-h-screen bg-gray-50 flex pt-16">

      {/* ══ SIDEBAR ══ */}
      <aside className={`fixed left-0 top-16 bottom-0 bg-white border-r border-gray-100 transition-all z-30 shadow-sm ${sidebarOpen ? "w-60" : "w-16"}`}>
        {/* Vendor identity */}
        <div className="p-4 border-b border-gray-100">
          {sidebarOpen ? (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: config.color + "15" }}>
                <TypeIcon className="w-5 h-5" style={{ color: config.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{vendor?.business_name || "My Store"}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: config.color }}>{config.label}</p>
                <div className="flex items-center gap-1 mt-1">
                  {PlanIcon && <PlanIcon className="w-3 h-3" style={{ color: planMeta.color }} />}
                  <span className="text-[10px] font-bold" style={{ color: planMeta.color }}>{planMeta.label}</span>
                  <span className="text-[10px] text-gray-400 ml-1">· {score}% complete</span>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 shrink-0">
                <Menu className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto" style={{ background: config.color + "15" }}>
              <TypeIcon className="w-4 h-4" style={{ color: config.color }} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="p-2 overflow-y-auto" style={{ height: "calc(100vh - 160px)" }}>
          {sidebarItems.map(itemId => {
            const item    = SIDEBAR_LABELS[itemId];
            const Icon    = item.icon;
            const isActive= tab === itemId;
            const badge   = itemId === "leads" ? pendingLeads : itemId === "messages" ? conversations.length : 0;
            return (
              <button key={itemId} onClick={() => setTab(itemId)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition ${isActive ? "text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
                style={isActive ? { background: `linear-gradient(135deg,${config.color},${config.color}cc)` } : {}}>
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span className="flex-1 text-left">{item.label}</span>}
                {sidebarOpen && badge > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{badge}</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ══ MAIN ══ */}
      <main className={`flex-1 transition-all ${sidebarOpen ? "ml-60" : "ml-16"}`}>
        {/* Topbar */}
        <div className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-16 z-20 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{SIDEBAR_LABELS[tab]?.label || "Dashboard"}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{vendor?.business_name} · {config.label}</p>
          </div>
          <div className="flex items-center gap-3">
            {vendor?.registration_status === "approved" && (
              <Link href={`/services/${vendor?.id}`} className="text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition">
                <Eye className="w-4 h-4" />Public Profile
              </Link>
            )}
            <button className="relative p-2 rounded-xl hover:bg-gray-50">
              <Bell className="w-5 h-5 text-gray-500" />
              {pendingLeads > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">{pendingLeads}</span>}
            </button>
          </div>
        </div>

        <div className="p-8">

          {/* ══ OVERVIEW ══ */}
          {tab === "overview" && (
            <div className="space-y-6">
              <StatusBanner vendor={vendor} />

              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Profile Views",   value: vendor?.profile_views || 0,      icon: Eye,          color: "#3b82f6" },
                  { label: "Active Listings", value: shopProducts.filter(p=>p.status==="active").length, icon: ShoppingBag, color: config.color },
                  { label: "Pending Review",  value: shopProducts.filter(p=>p.status==="pending").length, icon: Clock, color: "#f59e0b" },
                  { label: "Leads",           value: leads.length,                     icon: Users,        color: "#FE6972" },
                  { label: "Rating",          value: vendor?.rating || "New",          icon: Star,         color: "#D4AF37" },
                ].map(s => { const Icon = s.icon; return (
                  <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.color + "12" }}>
                      <Icon className="w-5 h-5" style={{ color: s.color }} />
                    </div>
                    <p className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>{s.value}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ); })}
              </div>

              {/* Middle row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AdQuotaWidget vendor={vendor} />
                <ListingStatusWidget shopProducts={shopProducts.length ? shopProducts : []} />

                {/* Quick actions */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-base mb-4">Quick Actions</h3>
                  <div className="space-y-2.5">
                    {[
                      { label: "Create New Listing", icon: Plus,        action: () => { setTab("listings"); setShowShopForm(true); }, color: config.color },
                      { label: "Edit Profile",       icon: Edit,        action: startEdit,                                          color: "#6366f1"    },
                      { label: "View Leads",         icon: Users,       action: () => setTab("leads"),                              color: "#FE6972"    },
                      { label: "Upgrade Plan",       icon: Crown,       action: () => setTab("billing"),                            color: "#D4AF37"    },
                    ].filter(a => config.sidebar.includes(a.label === "Edit Profile" ? "profile" : a.label === "View Leads" ? "leads" : "listings"))
                    .slice(0,4)
                    .map(action => {
                      const Icon = action.icon;
                      return (
                        <button key={action.label} onClick={action.action}
                          className="w-full p-3 rounded-xl text-left flex items-center gap-3 font-semibold text-sm transition hover:opacity-90"
                          style={{ background: action.color + "10", color: action.color }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: action.color + "20" }}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {action.label}
                          <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                        </button>
                      );
                    })}
                    <button onClick={() => { setTab("listings"); setShowShopForm(true); }}
                      className="w-full p-3 rounded-xl text-left flex items-center gap-3 font-semibold text-sm transition"
                      style={{ background: config.color + "10", color: config.color }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: config.color + "20" }}>
                        <Plus className="w-4 h-4" />
                      </div>
                      Create New Listing
                      <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent leads */}
              {leads.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-base">Recent Leads</h3>
                    <button onClick={() => setTab("leads")} className="text-sm font-semibold" style={{ color: "#FE6972" }}>View All →</button>
                  </div>
                  <div className="space-y-2">
                    {leads.slice(0, 3).map((l, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                        <p className="text-sm font-medium text-gray-800 truncate" style={{ maxWidth: 300 }}>{l.message?.substring(0, 50) || "New inquiry"}</p>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ml-3 ${l.status === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>{l.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ PROFILE ══ */}
          {tab === "profile" && vendor && (
            <div className="space-y-6 max-w-3xl">
              <StatusBanner vendor={vendor} />

              {/* Completeness */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="relative w-16 h-16 shrink-0">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke={scoreColor} strokeWidth="3" strokeDasharray={`${score * 0.94} 100`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-black" style={{ color: scoreColor }}>{score}%</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-base">Profile Completeness</p>
                    <p className="text-sm text-gray-500 mt-0.5">{score >= 80 ? "Excellent — you rank higher in search results" : "Complete your profile to get more leads"}</p>
                  </div>
                </div>
                {!editMode
                  ? <button onClick={startEdit} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: "#FE6972" }}><Edit className="w-4 h-4" />Edit Profile</button>
                  : <div className="flex gap-2">
                      <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm bg-green-500 disabled:opacity-60"><Save className="w-4 h-4" />{saving ? "Saving..." : "Save"}</button>
                      <button onClick={() => { setEditMode(false); setCoverPreview(null); }} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold">Cancel</button>
                    </div>
                }
              </div>

              {editMode && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
                  <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-4">Edit Profile</h3>
                  {/* Cover photo */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">Cover Photo</label>
                    <div onClick={() => coverRef.current?.click()} className="relative h-36 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#FE6972]/50 transition overflow-hidden"
                      style={coverPreview || vendor.cover_image ? { backgroundImage: `url(${coverPreview || vendor.cover_image})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}>
                      {!coverPreview && !vendor.cover_image && <div className="text-center"><Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">Click to upload cover photo</p></div>}
                      {(coverPreview || vendor.cover_image) && <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition"><p className="text-white text-sm font-bold">Change photo</p></div>}
                    </div>
                    <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = ev => setCoverPreview(ev.target?.result as string); r.readAsDataURL(f); }}} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-semibold text-gray-700 block mb-1.5">Business Name</label><input className={inp} value={editForm.business_name || ""} onChange={e => setEditForm((f: any) => ({ ...f, business_name: e.target.value }))} /></div>
                    <div><label className="text-sm font-semibold text-gray-700 block mb-1.5">City</label><input className={inp} value={editForm.city || ""} onChange={e => setEditForm((f: any) => ({ ...f, city: e.target.value }))} /></div>
                    <div><label className="text-sm font-semibold text-gray-700 block mb-1.5">Phone</label><input className={inp} value={editForm.phone || ""} onChange={e => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} /></div>
                    <div><label className="text-sm font-semibold text-gray-700 block mb-1.5">WhatsApp</label><input className={inp} value={editForm.whatsapp || ""} onChange={e => setEditForm((f: any) => ({ ...f, whatsapp: e.target.value }))} /></div>
                    <div><label className="text-sm font-semibold text-gray-700 block mb-1.5">Starting Price (EGP)</label><input className={inp} type="number" value={editForm.price_min || ""} onChange={e => setEditForm((f: any) => ({ ...f, price_min: e.target.value }))} /></div>
                    <div><label className="text-sm font-semibold text-gray-700 block mb-1.5">Website</label><input className={inp} value={editForm.website || ""} onChange={e => setEditForm((f: any) => ({ ...f, website: e.target.value }))} /></div>
                  </div>
                  <div><label className="text-sm font-semibold text-gray-700 block mb-1.5">Short Description</label><input className={inp} value={editForm.description || ""} onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))} /></div>
                  <div><label className="text-sm font-semibold text-gray-700 block mb-1.5">About / Bio</label><textarea className={inp + " resize-none"} rows={4} value={editForm.bio || ""} onChange={e => setEditForm((f: any) => ({ ...f, bio: e.target.value }))} /></div>
                </div>
              )}

              {/* Portfolio */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Portfolio ({portfolioImages.length} photos)</h3>
                    <p className="text-sm text-gray-400 mt-0.5">Vendors with 10+ photos get 3× more leads</p>
                  </div>
                  <button onClick={() => portfolioRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ background: "#FE6972" }}>
                    <Upload className="w-4 h-4" />Upload
                  </button>
                  <input ref={portfolioRef} type="file" accept="image/*" multiple className="hidden" onChange={async e => {
                    const files = Array.from(e.target.files || []) as File[];
                    for (const file of files) {
                      const reader = new FileReader();
                      reader.onload = async ev => {
                        const r = await fetch(`${API}/api/services/vendor/${vendorId}/portfolio`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image_url: ev.target?.result, filename: file.name }) }).then(r => r.json());
                        if (r.success) setPortfolioImages(prev => [...prev, r.data]);
                      };
                      reader.readAsDataURL(file);
                    }
                  }} />
                </div>
                {portfolioImages.length === 0
                  ? <div onClick={() => portfolioRef.current?.click()} className="h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FE6972]/30 hover:bg-pink-50/30 transition">
                      <ImagePlus className="w-8 h-8 text-gray-300 mb-2" /><p className="text-sm text-gray-400">Click to upload photos</p>
                    </div>
                  : <div className="grid grid-cols-4 gap-3">
                      {portfolioImages.map((img: any, i: number) => (
                        <div key={img.id || i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                          <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <button onClick={() => { fetch(`${API}/api/services/vendor/${vendorId}/portfolio/${img.id}`, { method: "DELETE" }); setPortfolioImages(prev => prev.filter(p => p.id !== img.id)); }} className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg">Remove</button>
                          </div>
                        </div>
                      ))}
                      <div onClick={() => portfolioRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#FE6972]/30 transition">
                        <Plus className="w-6 h-6 text-gray-300" />
                      </div>
                    </div>
                }
              </div>
            </div>
          )}

          {/* ══ LISTINGS ══ */}
          {tab === "listings" && (
            <div>
              {/* Quota */}
              {shopQuota && (
                <div className={`rounded-2xl p-4 mb-6 ${shopQuota.allowed ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-gray-800">{shopQuota.plan?.toUpperCase() || "FREE"} Plan — {shopQuota.used} / {shopQuota.limit === -1 ? "∞" : shopQuota.limit} listings used this month</span>
                    {!shopQuota.allowed && <button onClick={() => setTab("billing")} className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: "#D4AF37" }}>Upgrade</button>}
                  </div>
                  {shopQuota.limit !== -1 && (
                    <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min((shopQuota.used / shopQuota.limit) * 100, 100)}%`, background: shopQuota.allowed ? "#22c55e" : "#ef4444" }} />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">My Listings ({shopProducts.length})</h2>
                <button onClick={() => { setEditingShopProduct(null); setShowShopForm(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: config.color }}>
                  <Plus className="w-4 h-4" />New Listing
                </button>
              </div>

              {shopProducts.length === 0
                ? <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-base font-semibold text-gray-500 mb-2">No listings yet</p>
                    <p className="text-sm text-gray-400 mb-6">Create your first listing to start receiving inquiries</p>
                    <button onClick={() => setShowShopForm(true)} className="px-6 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: config.color }}>+ Create First Listing</button>
                  </div>
                : <div className="space-y-3">
                    {shopProducts.map((p: any) => {
                      const statusMeta: Record<string,{label:string;color:string;bg:string}> = {
                        active:   { label:"Live",     color:"#22c55e", bg:"rgba(34,197,94,0.08)"   },
                        pending:  { label:"Pending",  color:"#f59e0b", bg:"rgba(245,158,11,0.08)"  },
                        rejected: { label:"Rejected", color:"#ef4444", bg:"rgba(239,68,68,0.08)"   },
                        expired:  { label:"Expired",  color:"#94a3b8", bg:"rgba(148,163,184,0.08)" },
                      };
                      const sm = statusMeta[p.status] || statusMeta.pending;
                      const daysLeft = p.expires_at ? Math.ceil((new Date(p.expires_at).getTime() - Date.now()) / 86400000) : null;
                      return (
                        <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 shadow-sm">
                          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                            {p.cover_image ? <img src={p.cover_image} alt="" className="w-full h-full object-cover" /> : <ShoppingBag className="w-6 h-6 text-gray-300 m-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              <h4 className="font-bold text-gray-900 text-sm">{p.name}</h4>
                              <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
                            </div>
                            {p.rejection_reason && <p className="text-xs text-red-500 mb-1 bg-red-50 px-2 py-0.5 rounded-lg">Rejected: {p.rejection_reason}</p>}
                            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                              <span className="font-bold text-gray-900">EGP {Number(p.price).toLocaleString()}</span>
                              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{p.view_count || 0}</span>
                              <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{p.inquiry_count || 0}</span>
                              {daysLeft !== null && daysLeft > 0 && <span className={`text-xs font-semibold ${daysLeft <= 5 ? "text-red-500" : "text-gray-400"}`}>Expires in {daysLeft}d</span>}
                              {daysLeft !== null && daysLeft <= 0 && <span className="text-xs font-semibold text-red-500">Expired — renew for 100 EGP</span>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button onClick={() => { setEditingShopProduct(p); setShowShopForm(true); }} className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center"><Edit className="w-3.5 h-3.5 text-gray-500" /></button>
                            <button onClick={async () => { if (!confirm("Delete?")) return; await fetch(`${API}/api/shop/vendor/${vendorId}/products/${p.id}`, { method: "DELETE" }); setShopProducts(prev => prev.filter(i => i.id !== p.id)); }} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
              }
            </div>
          )}

          {/* ══ PACKAGES (service vendors) ══ */}
          {tab === "packages" && (
            <div className="space-y-6 max-w-3xl">
              {/* Service Tags */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2"><Tag className="w-5 h-5 text-purple-500" />Service Tags</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {services.map((s: any, i: number) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm font-semibold border border-purple-100">
                      {s.name}
                      <button onClick={async () => { await fetch(`${API}/api/services/vendor/${vendorId}/services-item/${s.id}`, { method: "DELETE" }); setServices(prev => prev.filter(x => x.id !== s.id)); }} className="text-purple-300 hover:text-red-500"><XIcon className="w-3.5 h-3.5" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className={inp + " flex-1"} placeholder="Add a service tag..." value={svcInput} onChange={e => setSvcInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addServiceTag()} />
                  <button onClick={addServiceTag} className="px-4 py-3 rounded-xl text-white font-bold text-sm" style={{ background: "#6366f1" }}><Plus className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Packages */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-gray-900 text-base flex items-center gap-2"><Package className="w-5 h-5" style={{ color: config.color }} />Pricing Packages</h3>
                  <button onClick={() => { setEditingPkg(null); setPkgForm({ name: "", price: "", description: "", includes: "", is_popular: false }); setShowPkgForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ background: config.color }}><Plus className="w-3.5 h-3.5" />Add Package</button>
                </div>
                {showPkgForm && (
                  <div className="mb-5 p-5 rounded-xl border bg-gray-50 space-y-4">
                    <h4 className="font-bold text-gray-800">{editingPkg ? "Edit Package" : "New Package"}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-semibold text-gray-700 block mb-1.5">Name *</label><input className={inp} value={pkgForm.name} onChange={e => setPkgForm(f => ({ ...f, name: e.target.value }))} /></div>
                      <div><label className="text-sm font-semibold text-gray-700 block mb-1.5">Price (EGP) *</label><input className={inp} type="number" value={pkgForm.price} onChange={e => setPkgForm(f => ({ ...f, price: e.target.value }))} /></div>
                    </div>
                    <div><label className="text-sm font-semibold text-gray-700 block mb-1.5">Description</label><input className={inp} value={pkgForm.description} onChange={e => setPkgForm(f => ({ ...f, description: e.target.value }))} /></div>
                    <div><label className="text-sm font-semibold text-gray-700 block mb-1.5">Includes (comma-separated)</label><input className={inp} placeholder="8hr coverage, edited photos, USB" value={pkgForm.includes} onChange={e => setPkgForm(f => ({ ...f, includes: e.target.value }))} /></div>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={pkgForm.is_popular} onChange={e => setPkgForm(f => ({ ...f, is_popular: e.target.checked }))} /><span className="text-sm text-gray-700">Mark as Popular</span></label>
                    <div className="flex gap-3">
                      <button onClick={addPackage} disabled={saving} className="px-5 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60" style={{ background: config.color }}>{saving ? "Saving..." : editingPkg ? "Update" : "Add"}</button>
                      <button onClick={() => { setShowPkgForm(false); setEditingPkg(null); }} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold">Cancel</button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {packages.map((p: any, i: number) => (
                    <div key={i} className={`rounded-xl p-4 border relative ${p.is_popular ? "border-[#FE6972] bg-pink-50/30" : "border-gray-200"}`}>
                      {p.is_popular && <span className="absolute -top-2 right-3 text-[10px] font-bold text-[#FE6972] bg-white px-2 py-0.5 rounded-full border border-pink-200">POPULAR</span>}
                      <h4 className="font-bold text-gray-900">{p.name}</h4>
                      <p className="text-xl font-black mt-1" style={{ color: "#6366f1", fontFamily: "'Playfair Display',serif" }}>{Number(p.price).toLocaleString()} EGP</p>
                      {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => { setEditingPkg(p); setPkgForm({ name: p.name, price: p.price?.toString(), description: p.description || "", includes: Array.isArray(p.includes) ? p.includes.join(", ") : "", is_popular: p.is_popular || false }); setShowPkgForm(true); }} className="flex-1 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1"><Edit className="w-3 h-3" />Edit</button>
                        <button onClick={() => deletePackage(p.id)} className="flex-1 py-1.5 rounded-lg border border-red-100 bg-red-50 text-xs font-semibold text-red-500 hover:bg-red-100 flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" />Delete</button>
                      </div>
                    </div>
                  ))}
                  {packages.length === 0 && <div className="col-span-3 py-10 text-center text-gray-400">No packages yet — add your first pricing package</div>}
                </div>
              </div>
            </div>
          )}

          {/* ══ LEADS ══ */}
          {tab === "leads" && (
            <div className="space-y-4">
              {leads.length === 0
                ? <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm"><Users className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-base font-semibold text-gray-500 mb-1">No leads yet</p><p className="text-sm text-gray-400">Inquiries from customers will appear here</p></div>
                : leads.map((l, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900">{l.message || "New inquiry"}</p>
                        <div className="flex gap-3 mt-1 text-sm text-gray-400">
                          {l.event_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(l.event_date).toLocaleDateString()}</span>}
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(l.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${l.status === "PENDING" ? "bg-amber-50 text-amber-700" : l.status === "BOOKED" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>{l.status}</span>
                    </div>
                    <div className="flex gap-2">
                      {l.status === "PENDING" && <>
                        <button onClick={() => updateLead(l.id, "CONTACTED")} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: "#FE6972" }}>Contact</button>
                        <button onClick={() => updateLead(l.id, "QUOTED")} className="px-4 py-2 rounded-xl text-sm font-bold border border-purple-300 text-purple-700">Quote</button>
                      </>}
                      {l.status === "CONTACTED" && <button onClick={() => updateLead(l.id, "BOOKED")} className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-green-500">Mark Booked</button>}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ══ MESSAGES ══ */}
          {tab === "messages" && (
            <div className="flex gap-5 h-[520px]">
              <div className="w-64 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-y-auto">
                <div className="p-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">Conversations</h3></div>
                {conversations.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">No conversations yet</p>
                : conversations.map((c, i) => (
                  <button key={i} onClick={() => loadConv(c.id)} className={`w-full p-4 text-left border-b border-gray-50 hover:bg-gray-50 transition ${activeConv === c.id ? "bg-pink-50" : ""}`}>
                    <p className="font-semibold text-gray-900 text-sm">{c.user_name || "Guest"}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{c.last_message || "New conversation"}</p>
                  </button>
                ))}
              </div>
              <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                {!activeConv ? <div className="flex-1 flex items-center justify-center text-gray-300"><MessageCircle className="w-10 h-10" /></div>
                : <>
                    <div className="flex-1 overflow-y-auto p-5 space-y-3">
                      {convMessages.map((m, i) => (
                        <div key={i} className={`flex ${m.sender_type === "vendor" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${m.sender_type === "vendor" ? "text-white rounded-br-sm" : "bg-gray-100 text-gray-700 rounded-bl-sm"}`} style={m.sender_type === "vendor" ? { background: "#FE6972" } : {}}>
                            <p>{m.content}</p>
                            <p className={`text-[10px] mt-1 ${m.sender_type === "vendor" ? "text-white/50" : "text-gray-400"}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t border-gray-100 flex gap-2">
                      <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === "Enter" && sendReply()} placeholder="Type a reply..." className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none" />
                      <button onClick={sendReply} className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: "#FE6972" }}><Send className="w-4 h-4" /></button>
                    </div>
                  </>}
              </div>
            </div>
          )}

          {/* ══ EARNINGS ══ */}
          {tab === "earnings" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-5">
                {[
                  { label: "Total Earned (EGP)", value: totalEarnings.toLocaleString(), color: "#22c55e" },
                  { label: "Pending (EGP)",       value: earnings.filter(e => e.status === "pending").reduce((s, e) => s + parseFloat(e.amount), 0).toLocaleString(), color: "#f59e0b" },
                  { label: "Transactions",         value: earnings.length, color: "#6366f1" },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
                    <p className="text-3xl font-black" style={{ color: s.color, fontFamily: "'Playfair Display',serif" }}>{s.value}</p>
                    <p className="text-sm text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 text-base mb-4">Transaction History</h3>
                {earnings.length === 0 ? <p className="text-center text-gray-400 py-8">No transactions yet</p>
                : earnings.map((e: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center"><DollarSign className="w-4 h-4 text-green-600" /></div>
                      <div><p className="font-semibold text-gray-900 text-sm">{e.description}</p><p className="text-xs text-gray-400">{new Date(e.created_at).toLocaleDateString()}</p></div>
                    </div>
                    <p className="font-bold text-green-600">+{Number(e.amount).toLocaleString()} EGP</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ BILLING ══ */}
          {tab === "billing" && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 text-base mb-5">Current Plan</h3>
                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: planMeta.color + "08", border: `1px solid ${planMeta.color}30` }}>
                  {PlanIcon && <PlanIcon className="w-8 h-8" style={{ color: planMeta.color }} />}
                  <div className="flex-1">
                    <p className="font-bold text-lg" style={{ color: planMeta.color }}>{planMeta.label} Plan</p>
                    <p className="text-sm text-gray-500">{vendor?.monthly_ad_limit || 3} ads/month · 30 days per listing · 100 EGP renewal</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black" style={{ color: planMeta.color, fontFamily: "'Playfair Display',serif" }}>{vendor?.ads_used_month || 0}/{vendor?.monthly_ad_limit || 3}</p>
                    <p className="text-xs text-gray-400">ads used</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 text-base mb-4">Upgrade Plan</h3>
                <div className="space-y-3">
                  {[
                    { id: "BASIC", label: "Basic",     price: "299",   period: "/mo", color: "#22c55e", limit: "1 active listing",   features: ["Standard placement","3 photos","City targeting"] },
                    { id: "PRO",   label: "Pro",       price: "699",   period: "/mo", color: "#6366f1", limit: "3 listings",          features: ["Priority placement","8 photos","Featured badge","Analytics"], popular: true },
                    { id: "TOP",   label: "Top",       price: "1,299", period: "/mo", color: "#D4AF37", limit: "Unlimited listings",   features: ["Top placement","20 photos","Homepage spotlight","Support"] },
                  ].map(plan => (
                    <div key={plan.id} className={`p-4 rounded-xl border relative ${plan.popular ? "border-[#FE6972]" : "border-gray-200"}`}>
                      {plan.popular && <span className="absolute -top-2.5 right-4 bg-[#FE6972] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">POPULAR</span>}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: plan.color }} />
                          <span className="font-bold" style={{ color: plan.color }}>{plan.label}</span>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{plan.limit}</span>
                        </div>
                        <span className="font-black text-lg" style={{ color: plan.color }}>EGP {plan.price}<span className="text-xs font-normal text-gray-400">{plan.period}</span></span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {plan.features.map(f => <span key={f} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">✓ {f}</span>)}
                      </div>
                      {vendor?.plan_type !== plan.id && (
                        <button className="w-full py-2 rounded-xl text-white text-sm font-bold" style={{ background: plan.color }}>Upgrade to {plan.label}</button>
                      )}
                      {vendor?.plan_type === plan.id && <p className="text-center text-sm font-semibold" style={{ color: plan.color }}>✓ Current Plan</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ ANALYTICS ══ */}
          {tab === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Profile Views",   value: vendor?.profile_views || 0 },
                  { label: "Lead Conversion", value: leads.length > 0 ? `${Math.round(leads.filter(l => l.status === "BOOKED").length / leads.length * 100)}%` : "0%" },
                  { label: "Response Time",   value: `${vendor?.response_time_hours || "N/A"}h` },
                  { label: "Completed Jobs",  value: vendor?.completed_bookings || 0 },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-sm text-gray-400 mb-2">{s.label}</p>
                    <p className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl p-6 text-center" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                <Crown className="w-8 h-8 text-white mx-auto mb-3" />
                <p className="text-white font-bold text-lg mb-1">Get 5× More Leads</p>
                <p className="text-white/60 text-sm mb-4">Upgrade to TOP plan for homepage spotlight</p>
                <button onClick={() => setTab("billing")} className="bg-white px-6 py-2.5 rounded-xl text-sm font-bold" style={{ color: "#6366f1" }}>View Plans</button>
              </div>
            </div>
          )}

          {/* ══ SETTINGS ══ */}
          {tab === "settings" && vendor && (
            <div className="max-w-xl space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-gray-900 text-base">Account Settings</h3>
                  <button onClick={startEdit} className="text-sm font-semibold px-4 py-2 rounded-xl border flex items-center gap-1.5" style={{ color: "#FE6972", borderColor: "#FE6972" }}><Edit className="w-3.5 h-3.5" />Edit</button>
                </div>
                <div className="space-y-3">
                  {[
                    ["Business Name", vendor.business_name],
                    ["City",          vendor.city],
                    ["Vendor Type",   config.label],
                    ["Plan",          vendor.plan_type || "—"],
                    ["Starting Price",vendor.price_min ? `EGP ${Number(vendor.price_min).toLocaleString()}` : "Not set"],
                    ["Experience",    `${vendor.experience_years || 0} years`],
                    ["Phone",         vendor.phone || "—"],
                    ["WhatsApp",      vendor.whatsapp || "—"],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <span className="text-gray-500 text-sm">{label}</span>
                      <span className="font-semibold text-gray-900 text-sm">{val as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
