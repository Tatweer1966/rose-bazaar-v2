"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  LayoutDashboard, MessageCircle, Users, DollarSign, Star, Eye,
  Clock, Check, X as XIcon, Bell, Settings, Crown, Zap, Calendar,
  Package, BarChart3, Phone, MapPin, Shield, Send,
  Camera, Upload, Edit, AlertCircle, Target,
  Plus, Menu, Wallet, FileText, Save, Trash2,
  ShoppingBag, Tag, Clock3, ImagePlus, CheckCircle2,
  AlertTriangle, Info, Layers, Megaphone, List,
} from "lucide-react";

const API = "http://localhost:9000";

const SIDEBAR_ITEMS = [
  { id: "overview",  label: "Overview",            icon: LayoutDashboard },
  { id: "leads",     label: "Leads",               icon: Users,      badge: true },
  { id: "proposals", label: "Proposals",           icon: FileText },
  { id: "messages",  label: "Messages",            icon: MessageCircle, badge: true },
  { id: "calendar",  label: "Calendar",            icon: Calendar },
  { id: "divider1",  label: "",                    icon: null },
  { id: "profile",   label: "Profile Center",      icon: Target },
  { id: "packages",  label: "Services & Packages", icon: Package },
  { id: "shop",      label: "Shop Listings",       icon: ShoppingBag },
  { id: "listings",  label: "Service Listings",    icon: List },
  { id: "divider2",  label: "",                    icon: null },
  { id: "earnings",  label: "Earnings",            icon: Wallet },
  { id: "analytics", label: "Analytics",           icon: BarChart3 },
  { id: "divider3",  label: "",                    icon: null },
  { id: "settings",  label: "Settings",            icon: Settings },
];

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const PLAN_META: Record<string, { label: string; color: string; icon: any }> = {
  TOP:   { label: "Top",   color: "#D4AF37", icon: Crown },
  PRO:   { label: "Pro",   color: "#6366f1", icon: Zap   },
  BASIC: { label: "Basic", color: "#22c55e", icon: Check },
  LITE:  { label: "Lite",  color: "#94a3b8", icon: null  },
};

const SHOP_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  pending:  { label: "Pending Review", bg: "bg-yellow-50", text: "text-yellow-700" },
  active:   { label: "Live",           bg: "bg-green-50",  text: "text-green-700"  },
  rejected: { label: "Rejected",       bg: "bg-red-50",    text: "text-red-700"    },
  paused:   { label: "Paused",         bg: "bg-gray-50",   text: "text-gray-600"   },
  expired:  { label: "Expired",        bg: "bg-orange-50", text: "text-orange-700" },
};

const LISTING_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  pending_review: { label: "Pending Review", bg: "bg-yellow-50", text: "text-yellow-700" },
  approved:       { label: "Live",           bg: "bg-green-50",  text: "text-green-700"  },
  rejected:       { label: "Rejected",       bg: "bg-red-50",    text: "text-red-700"    },
  needs_changes:  { label: "Needs Changes",  bg: "bg-purple-50", text: "text-purple-700" },
  draft:          { label: "Draft",          bg: "bg-gray-50",   text: "text-gray-600"   },
};

const CITIES = ["Cairo","Alexandria","Giza","Hurghada","Sharm El Sheikh","Luxor","Aswan"];

function calcScore(v: any, pkgs: any[], svcs: any[]) {
  let s = 0;
  if ((v?.portfolio_count || 0) >= 5) s += 20; else s += Math.min((v?.portfolio_count || 0) * 4, 20);
  if (v?.description?.length > 50) s += 15;
  if (v?.price_min > 0) s += 15;
  if (pkgs.length >= 2) s += 15;
  if (svcs.length >= 3) s += 10;
  if (v?.bio?.length > 20) s += 10;
  if (v?.whatsapp || v?.phone) s += 10;
  if (v?.experience_years > 0) s += 5;
  return Math.min(s, 100);
}

const inp = "w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-50 transition";
const ghost = "px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition";

// ─── Shop Product Form Modal ───────────────────────────────────────────────────
function ShopProductForm({ categories, vendorId, product, onSave, onCancel }: {
  categories: any[]; vendorId: string; product?: any; onSave: (p: any) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name:           product?.name          || "",
    description:    product?.description   || "",
    category_id:    product?.category_id   || "",
    subcategory_id: product?.subcategory_id|| "",
    price:          product?.price         || "",
    price_original: product?.price_original|| "",
    city:           product?.city          || "",
    cover_image:    product?.cover_image   || "",
    plan_type:      product?.plan_type     || "LITE",
    tags:           product?.tags?.join(", ") || "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const selectedCat = categories.find(c => c.id === form.category_id);

  async function handleSubmit() {
    if (!form.name.trim())   { setError("Product name is required."); return; }
    if (!form.category_id)   { setError("Please select a category."); return; }
    if (!form.price)         { setError("Price is required."); return; }
    setError(""); setSaving(true);
    const payload = {
      ...form,
      price:          parseFloat(form.price),
      price_original: form.price_original ? parseFloat(form.price_original) : null,
      tags:           form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
      images:         form.cover_image ? [form.cover_image] : [],
    };
    try {
      const url    = product
        ? `${API}/api/shop/vendor/${vendorId}/products/${product.id}`
        : `${API}/api/shop/vendor/${vendorId}/products`;
      const res  = await fetch(url, { method: product ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { onSave(data.data); }
      else if (data.upgrade_required) { setError(data.error || "Quota exceeded. Please upgrade your plan."); }
      else { setError(data.error || "Failed to save listing."); }
    } catch { setError("Network error. Please try again."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">{product ? "Edit Shop Listing" : "New Shop Listing"}</h3>
          <button onClick={onCancel} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"><XIcon className="w-3.5 h-3.5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Product Name *</label><input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Ivory Lace Wedding Dress" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Category *</label>
              <select className={inp} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value, subcategory_id: "" }))}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Subcategory</label>
              <select className={inp} value={form.subcategory_id} onChange={e => setForm(f => ({ ...f, subcategory_id: e.target.value }))}>
                <option value="">Select subcategory</option>
                {selectedCat?.subcategories?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Price (EGP) *</label><input className={inp} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Original Price</label><input className={inp} type="number" value={form.price_original} onChange={e => setForm(f => ({ ...f, price_original: e.target.value }))} placeholder="For discount display" /></div>
          </div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">City</label>
            <select className={inp} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
              <option value="">Select city</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Description</label><textarea className={inp} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe your product..." /></div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Cover Image URL</label><input className={inp} value={form.cover_image} onChange={e => setForm(f => ({ ...f, cover_image: e.target.value }))} placeholder="https://..." />
            {form.cover_image && <img src={form.cover_image} alt="" className="mt-2 h-20 w-full object-cover rounded-xl border border-gray-100" onError={e => (e.currentTarget.style.display = "none")} />}
          </div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Tags (comma separated)</label><input className={inp} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. lace, ivory, custom" /></div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Listing Plan</label>
            <select className={inp} value={form.plan_type} onChange={e => setForm(f => ({ ...f, plan_type: e.target.value }))}>
              <option value="LITE">Lite (Free — 3/month)</option>
              <option value="BASIC">Basic — EGP 299/mo</option>
              <option value="PRO">Pro — EGP 699/mo</option>
              <option value="TOP">Top — EGP 1,299/mo</option>
            </select>
          </div>
          {error && <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
          <div className="flex gap-2 pt-2">
            <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-60" style={{ background: "linear-gradient(135deg,#FE6972,#c9485f)" }}>
              {saving ? "Saving..." : product ? "Save Changes" : "Submit for Review"}
            </button>
            <button onClick={onCancel} className={ghost}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Service Listing Form Modal ────────────────────────────────────────────────
function ServiceListingForm({ vendorId, listing, serviceCategories, onSave, onCancel }: {
  vendorId: string; listing?: any; serviceCategories: any[]; onSave: (l: any) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title:       listing?.title       || "",
    title_ar:    listing?.title_ar    || "",
    description: listing?.description || "",
    category:    listing?.category    || "",
    price:       listing?.price       || "",
    city:        listing?.city        || "",
    cover_image: listing?.cover_image || (listing?.image_urls?.[0]) || "",
    plan_type:   listing?.plan_type   || "LITE",
    tags:        Array.isArray(listing?.tags) ? listing.tags.join(", ") : "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function handleSubmit() {
    if (!form.title.trim())    { setError("Title is required."); return; }
    if (!form.category.trim()) { setError("Category is required."); return; }
    setError(""); setSaving(true);
    const payload = {
      ...form,
      price:     form.price ? parseFloat(form.price) : null,
      tags:      form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
      image_urls: form.cover_image ? [form.cover_image] : [],
      vendor_name: vendorId,
    };
    try {
      const url    = listing
        ? `${API}/api/listings/vendor/${vendorId}/${listing.id}`
        : `${API}/api/listings/vendor/${vendorId}`;
      const res  = await fetch(url, { method: listing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { onSave(data.data); }
      else { setError(data.error || "Failed to save listing."); }
    } catch { setError("Network error. Please try again."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">{listing ? "Edit Service Listing" : "New Service Listing"}</h3>
          <button onClick={onCancel} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"><XIcon className="w-3.5 h-3.5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Title *</label><input className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Full Day Wedding Photography" /></div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Title (Arabic)</label><input className={inp} dir="rtl" value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Category *</label>
              <select className={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Select category</option>
                {serviceCategories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                {["photography","videography","makeup","catering","decor","music","planning","flowers"].map(c =>
                  !serviceCategories.find(sc => sc.slug === c) ? <option key={c} value={c}>{c}</option> : null
                )}
              </select>
            </div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Price (EGP)</label><input className={inp} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Starting price" /></div>
          </div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">City</label>
            <select className={inp} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
              <option value="">Select city</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Description</label><textarea className={inp} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe your service..." /></div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Cover Image URL</label><input className={inp} value={form.cover_image} onChange={e => setForm(f => ({ ...f, cover_image: e.target.value }))} placeholder="https://..." />
            {form.cover_image && <img src={form.cover_image} alt="" className="mt-2 h-20 w-full object-cover rounded-xl border border-gray-100" onError={e => (e.currentTarget.style.display = "none")} />}
          </div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Tags (comma separated)</label><input className={inp} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. wedding, outdoor, drone" /></div>
          <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Listing Plan</label>
            <select className={inp} value={form.plan_type} onChange={e => setForm(f => ({ ...f, plan_type: e.target.value }))}>
              <option value="LITE">Lite (Free)</option>
              <option value="BASIC">Basic — EGP 299/mo</option>
              <option value="PRO">Pro — EGP 699/mo</option>
              <option value="TOP">Top — EGP 1,299/mo</option>
            </select>
          </div>
          {error && <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
          <div className="flex gap-2 pt-2">
            <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-60" style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
              {saving ? "Saving..." : listing ? "Save Changes" : "Submit for Review"}
            </button>
            <button onClick={onCancel} className={ghost}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────
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
  const [calendarDates, setCalendarDates] = useState<any[]>([]);
  const [proposals,     setProposals]     = useState<any[]>([]);
  const [items,         setItems]         = useState<any[]>([]);
  const [deals,         setDeals]         = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);

  // Portfolio
  const [portfolioImages,    setPortfolioImages]    = useState<any[]>([]);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const portfolioRef = useRef<HTMLInputElement>(null);

  // Messages
  const [replyText,    setReplyText]    = useState("");
  const [activeConv,   setActiveConv]   = useState<string | null>(null);
  const [convMessages, setConvMessages] = useState<any[]>([]);

  // Profile edit
  const [editMode,    setEditMode]    = useState(false);
  const [editForm,    setEditForm]    = useState<any>({});
  const [coverPreview,setCoverPreview]= useState<string | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  // Package CRUD
  const [showPkgForm, setShowPkgForm] = useState(false);
  const [editingPkg,  setEditingPkg]  = useState<any>(null);
  const [pkgForm,     setPkgForm]     = useState({ name: "", price: "", description: "", includes: "", is_popular: false });

  // Service tags
  const [svcInput, setSvcInput] = useState("");

  // Store items
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem,  setEditingItem]  = useState<any>(null);
  const [itemForm,     setItemForm]     = useState({ name: "", name_ar: "", price: "", description: "", category: "", stock_quantity: "0" });

  // Happy hour deals
  const [showDealForm, setShowDealForm] = useState(false);
  const [editingDeal,  setEditingDeal]  = useState<any>(null);
  const [dealForm,     setDealForm]     = useState({ title: "", description: "", original_price: "", discount_percentage: "20", start_time: "12:00", end_time: "18:00", valid_days: [] as string[] });

  // Shop listings tab
  const [shopProducts,      setShopProducts]      = useState<any[]>([]);
  const [shopCategories,    setShopCategories]    = useState<any[]>([]);
  const [shopQuota,         setShopQuota]         = useState<any>(null);
  const [shopInquiries,     setShopInquiries]     = useState<any[]>([]);
  const [showShopForm,      setShowShopForm]      = useState(false);
  const [editingShopProduct,setEditingShopProduct]= useState<any>(null);
  const [shopSubTab,        setShopSubTab]        = useState<"listings"|"inquiries"|"plans">("listings");

  // Service listings tab
  const [serviceListings,    setServiceListings]    = useState<any[]>([]);
  const [serviceCategories,  setServiceCategories]  = useState<any[]>([]);
  const [showListingForm,    setShowListingForm]    = useState(false);
  const [editingListing,     setEditingListing]     = useState<any>(null);
  const [listingSubTab,      setListingSubTab]      = useState<"listings"|"inquiries">("listings");
  const [listingInquiries,   setListingInquiries]   = useState<any[]>([]);

  useEffect(() => {
    const vid = localStorage.getItem("vendorId") || localStorage.getItem("vendor_id") || localStorage.getItem("rose_vendor_id");
    if (vid) setVendorId(vid);
    loadDashboard(vid);
  }, []);

  // Load shop data when shop tab is opened
  useEffect(() => {
    if (tab === "shop" && vendorId && shopProducts.length === 0) loadShopData(vendorId);
  }, [tab, vendorId]);

  // Load service listings when listings tab is opened
  useEffect(() => {
    if (tab === "listings" && vendorId && serviceListings.length === 0) loadListingsData(vendorId);
  }, [tab, vendorId]);

  async function loadDashboard(vid: string | null) {
    setLoading(true);
    try {
      const url = vid
        ? `${API}/api/services/vendor/dashboard-full-by-id?vendor_id=${vid}`
        : `${API}/api/services/vendor/dashboard-full`;
      const d = await fetch(url).then(r => r.json());
      if (d.success && d.data.vendor) {
        const v = d.data.vendor;
        setVendor(v);
        setVendorId(v.id?.toString());
        localStorage.setItem("vendorId", v.id?.toString());
        setLeads(d.data.leads || []);
        setConversations(d.data.conversations || []);
        setPackages(d.data.packages || []);
        setServices(d.data.services || []);
        setEarnings(d.data.earnings || []);
        setCalendarDates(d.data.calendar || []);
        setProposals(d.data.proposals || []);
        setItems(d.data.items || []);
        setDeals(d.data.deals || []);
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
      const [prod, cats, inq] = await Promise.all([
        fetch(`${API}/api/shop/vendor/${vid}/products`).then(r => r.json()),
        fetch(`${API}/api/shop/categories?includeSubcategories=true`).then(r => r.json()),
        fetch(`${API}/api/shop/vendor/${vid}/inquiries`).then(r => r.json()),
      ]);
      if (prod.success) { setShopProducts(prod.data || []); setShopQuota(prod.quota); }
      if (cats.success) setShopCategories(cats.data || []);
      if (inq.success)  setShopInquiries(inq.data || []);
    } catch {}
  }

  async function loadListingsData(vid: string) {
    try {
      const [listings, cats] = await Promise.all([
        fetch(`${API}/api/listings/vendor/${vid}`).then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch(`${API}/api/services/categories`).then(r => r.json()),
      ]);
      if (listings.success) setServiceListings(listings.data || []);
      if (cats.success) setServiceCategories(cats.data || []);
    } catch {}
  }

  // ── Portfolio helpers ──
  async function compressImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = document.createElement("img") as HTMLImageElement;
      img.onload = () => {
        const maxDim = 1200;
        const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
        canvas.width = img.width * ratio; canvas.height = img.height * ratio;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  async function uploadPortfolioImages(e: any) {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length || !vendorId) return;
    setUploadingPortfolio(true);
    for (const file of files) {
      try {
        const imageData = await compressImage(file);
        const r = await fetch(`${API}/api/services/vendor/${vendorId}/portfolio`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: imageData, filename: file.name }),
        }).then(r => r.json());
        if (r.success) setPortfolioImages(prev => [...prev, r.data]);
      } catch {}
    }
    setUploadingPortfolio(false);
    if (portfolioRef.current) portfolioRef.current.value = "";
  }

  async function deletePortfolioImage(imageId: string) {
    if (!vendorId) return;
    await fetch(`${API}/api/services/vendor/${vendorId}/portfolio/${imageId}`, { method: "DELETE" });
    setPortfolioImages(prev => prev.filter(i => i.id !== imageId));
  }

  async function setPortfolioAsCover(imageId: string) {
    if (!vendorId) return;
    const img = portfolioImages.find(i => i.id === imageId);
    if (!img) return;
    await fetch(`${API}/api/services/vendor/${vendorId}/portfolio/${imageId}/cover`, { method: "PUT" });
    setVendor((v: any) => ({ ...v, cover_image: img.image_url }));
  }

  function getCompletenessItems() {
    return [
      { label: "Cover photo",              done: !!vendor?.cover_image || !!coverPreview,           points: 15 },
      { label: "Short description (30+)",  done: (vendor?.description?.length || 0) > 30,           points: 10 },
      { label: "About / Bio (50+)",        done: (vendor?.bio?.length || 0) > 50,                   points: 10 },
      { label: "Starting price",           done: !!(vendor?.price_min > 0),                          points: 15 },
      { label: "Phone or WhatsApp",        done: !!(vendor?.phone || vendor?.whatsapp),              points: 10 },
      { label: "Portfolio: 3+ images",     done: portfolioImages.length >= 3,                        points: 20 },
      { label: "Portfolio: 10+ images",    done: portfolioImages.length >= 10,                       points: 10 },
      { label: "Pricing packages (2+)",    done: packages.length >= 2,                               points: 15 },
      { label: "Service tags (3+)",        done: services.length >= 3,                               points:  5 },
      { label: "Years of experience",      done: !!(vendor?.experience_years > 0),                   points:  5 },
    ];
  }

  const completenessItems  = getCompletenessItems();
  const completenessScore  = completenessItems.filter(i => i.done).reduce((s, i) => s + i.points, 0);
  const completenessColor  = completenessScore >= 80 ? "#22c55e" : completenessScore >= 50 ? "#f59e0b" : "#ef4444";

  async function saveProfile() {
    if (!vendorId) return;
    setSaving(true);
    try {
      const body: any = { ...editForm };
      if (coverPreview) body.cover_image = coverPreview;
      const r = await fetch(`${API}/api/services/vendor/${vendorId}/profile`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.success) { setVendor(d.data); setEditMode(false); setCoverPreview(null); }
    } catch {}
    setSaving(false);
  }

  function startEdit() {
    setEditForm({
      business_name:    vendor?.business_name    || "",
      business_name_ar: vendor?.business_name_ar || "",
      description:      vendor?.description      || "",
      bio:              vendor?.bio              || "",
      city:             vendor?.city             || "",
      phone:            vendor?.phone            || "",
      whatsapp:         vendor?.whatsapp         || "",
      price_min:        vendor?.price_min        || "",
      experience_years: vendor?.experience_years || "",
      website:          vendor?.website          || "",
    });
    setEditMode(true);
  }

  function handleCoverChange(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCoverPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function addPackage() {
    if (!vendorId || !pkgForm.name || !pkgForm.price) return;
    setSaving(true);
    const body = { ...pkgForm, includes: pkgForm.includes.split(",").map((s: string) => s.trim()).filter(Boolean) };
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
    if (!vendorId || !confirm("Delete this package?")) return;
    await fetch(`${API}/api/services/vendor/${vendorId}/packages/${id}`, { method: "DELETE" });
    setPackages(prev => prev.filter(p => p.id !== id));
  }

  async function addServiceTag() {
    if (!vendorId || !svcInput.trim()) return;
    const r = await fetch(`${API}/api/services/vendor/${vendorId}/services-item`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: svcInput.trim() }) }).then(r => r.json());
    if (r.success) setServices(prev => [...prev, r.data]);
    setSvcInput("");
  }

  async function deleteServiceTag(id: string) {
    if (!vendorId) return;
    await fetch(`${API}/api/services/vendor/${vendorId}/services-item/${id}`, { method: "DELETE" });
    setServices(prev => prev.filter(s => s.id !== id));
  }

  async function saveItem() {
    if (!vendorId || !itemForm.name || !itemForm.price) return;
    setSaving(true);
    if (editingItem) {
      const r = await fetch(`${API}/api/services/vendor/${vendorId}/items/${editingItem.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(itemForm) }).then(r => r.json());
      if (r.success) setItems(prev => prev.map(i => i.id === editingItem.id ? r.data : i));
    } else {
      const r = await fetch(`${API}/api/services/vendor/${vendorId}/items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(itemForm) }).then(r => r.json());
      if (r.success) setItems(prev => [...prev, r.data]);
    }
    setItemForm({ name: "", name_ar: "", price: "", description: "", category: "", stock_quantity: "0" });
    setEditingItem(null); setShowItemForm(false); setSaving(false);
  }

  async function deleteItem(id: string) {
    if (!vendorId || !confirm("Delete this item?")) return;
    await fetch(`${API}/api/services/vendor/${vendorId}/items/${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i.id !== id));
  }

  async function saveDeal() {
    if (!vendorId || !dealForm.title || !dealForm.original_price) return;
    setSaving(true);
    if (editingDeal) {
      await fetch(`${API}/api/services/vendor/${vendorId}/deals/${editingDeal.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dealForm) });
      setDeals(prev => prev.map(d => d.id === editingDeal.id ? { ...d, ...dealForm } : d));
    } else {
      const r = await fetch(`${API}/api/services/vendor/${vendorId}/deals`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dealForm) }).then(r => r.json());
      if (r.success) setDeals(prev => [...prev, r.data]);
    }
    setDealForm({ title: "", description: "", original_price: "", discount_percentage: "20", start_time: "12:00", end_time: "18:00", valid_days: [] });
    setEditingDeal(null); setShowDealForm(false); setSaving(false);
  }

  async function deleteDeal(id: string) {
    if (!vendorId || !confirm("Delete this deal?")) return;
    await fetch(`${API}/api/services/vendor/${vendorId}/deals/${id}`, { method: "DELETE" });
    setDeals(prev => prev.filter(d => d.id !== id));
  }

  // Shop product handlers
  async function deleteShopProduct(id: string) {
    if (!confirm("Delete this listing?")) return;
    await fetch(`${API}/api/shop/vendor/${vendorId}/products/${id}`, { method: "DELETE" });
    setShopProducts(prev => prev.filter(p => p.id !== id));
  }

  function handleShopProductSaved(product: any) {
    setShopProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      return exists ? prev.map(p => p.id === product.id ? product : p) : [product, ...prev];
    });
    setShowShopForm(false); setEditingShopProduct(null);
    if (vendorId) loadShopData(vendorId);
  }

  // Service listing handlers
  async function deleteServiceListing(id: string) {
    if (!confirm("Delete this listing?")) return;
    await fetch(`${API}/api/listings/vendor/${vendorId}/${id}`, { method: "DELETE" }).catch(() => {});
    setServiceListings(prev => prev.filter(l => l.id !== id));
  }

  function handleListingSaved(listing: any) {
    setServiceListings(prev => {
      const exists = prev.find(l => l.id === listing.id);
      return exists ? prev.map(l => l.id === listing.id ? listing : l) : [listing, ...prev];
    });
    setShowListingForm(false); setEditingListing(null);
  }

  const score         = calcScore(vendor, packages, services);
  const scoreColor    = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const pendingLeads  = leads.filter(l => l.status === "PENDING").length;
  const totalEarnings = earnings.filter(e => e.status === "completed").reduce((s, e) => s + parseFloat(e.amount), 0);
  const isHappyHour   = vendor?.vendor_type === "happy_hour";
  const isStore       = vendor?.vendor_type === "store" || vendor?.vendor_type === "store_vendor";
  const newShopInquiries = shopInquiries.filter(i => i.status === "new").length;

  const loadConv = async (id: string) => {
    setActiveConv(id);
    const r = await fetch(`${API}/api/services/chat/conversation/${id}`);
    const d = await r.json();
    if (d.success) setConvMessages(d.data || []);
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-center">
        <LayoutDashboard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex pt-16">

      {/* ══ SIDEBAR ══ */}
      <aside className={`fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 transition-all z-30 ${sidebarOpen ? "w-56" : "w-16"}`}>
        <div className="p-3 border-b border-gray-100 flex items-center gap-2">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu className="w-4 h-4 text-gray-500" />
          </button>
          {sidebarOpen && <span className="text-xs font-bold text-gray-900 truncate">{vendor?.business_name}</span>}
        </div>
        <nav className="p-2 space-y-0.5 overflow-y-auto" style={{ height: "calc(100vh - 120px)" }}>
          {SIDEBAR_ITEMS.map(item => {
            if (item.id.startsWith("divider")) return <div key={item.id} className="my-2 border-t border-gray-100" />;
            const Icon = item.icon!;
            const isActive = tab === item.id;
            const badgeCount = item.id === "leads" ? pendingLeads
              : item.id === "messages" ? conversations.length
              : item.id === "shop" ? newShopInquiries
              : 0;
            return (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${isActive ? "text-white" : "text-gray-600 hover:bg-gray-50"}`}
                style={isActive ? { background: "#FE6972" } : {}}>
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span className="flex-1 text-left truncate">{item.label}</span>}
                {sidebarOpen && badgeCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center">{badgeCount}</span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ══ MAIN ══ */}
      <main className={`flex-1 transition-all ${sidebarOpen ? "ml-56" : "ml-16"}`}>
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-16 z-20">
          <div>
            <h1 className="text-sm font-bold text-gray-900">
              {SIDEBAR_ITEMS.find(i => i.id === tab)?.label || "Dashboard"}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              {vendor?.plan_type && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
                  style={{ background: vendor.plan_type === "TOP" ? "#D4AF37" : "#6366f1" }}>
                  {vendor.plan_type}
                </span>
              )}
              <span className="text-[10px]" style={{ color: scoreColor }}>Profile: {score}%</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-50">
              <Bell className="w-4 h-4 text-gray-500" />
              {pendingLeads > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center">{pendingLeads}</span>}
            </button>
            <Link href={`/services/${vendor?.id}`} className="text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1">
              <Eye className="w-3 h-3" />Public Profile
            </Link>
          </div>
        </div>

        <div className="p-6">

          {/* ══ OVERVIEW ══ */}
          {tab === "overview" && (
            <div className="space-y-5">
              {score < 80 && (
                <div className="bg-white rounded-xl border border-amber-200 p-4 flex items-center gap-4">
                  <div className="relative w-14 h-14 shrink-0">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke={scoreColor} strokeWidth="3" strokeDasharray={`${score * 0.94} 100`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: scoreColor }}>{score}%</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-xs">Complete your profile</h3>
                    <p className="text-[10px] text-gray-500">Higher score = more leads</p>
                  </div>
                  <button onClick={() => setTab("profile")} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: "#FE6972" }}>Improve</button>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Views",    value: vendor?.profile_views || 0,    icon: Eye,         color: "#3b82f6" },
                  { label: "Leads",    value: leads.length,                  icon: Users,       color: "#FE6972" },
                  { label: "Messages", value: conversations.length,          icon: MessageCircle,color: "#8b5cf6" },
                  { label: "Earnings", value: totalEarnings.toLocaleString(),icon: Wallet,      color: "#22c55e" },
                  { label: "Rating",   value: vendor?.rating || "New",       icon: Star,        color: "#D4AF37" },
                ].map(s => { const Icon = s.icon; return (
                  <div key={s.label} className="bg-white rounded-xl p-3 border border-gray-100">
                    <Icon className="w-4 h-4 mb-1" style={{ color: s.color }} />
                    <p className="text-lg font-bold text-gray-900">{s.value}</p>
                    <p className="text-[10px] text-gray-400">{s.label}</p>
                  </div>
                ); })}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold text-gray-900">Recent Leads</h2>
                    <button onClick={() => setTab("leads")} className="text-[10px] font-semibold" style={{ color: "#FE6972" }}>View All</button>
                  </div>
                  {leads.length === 0 ? <p className="text-xs text-gray-400 text-center py-6">No leads yet</p>
                  : leads.slice(0, 3).map((l, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 mb-1.5">
                      <p className="text-xs font-medium text-gray-900 truncate" style={{ maxWidth: 200 }}>{l.message?.substring(0, 40) || "New inquiry"}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${l.status === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>{l.status}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h2 className="text-xs font-bold text-gray-900 mb-3">Quick Actions</h2>
                  <div className="space-y-2">
                    <button onClick={() => { setTab("profile"); startEdit(); }} className="w-full p-2.5 rounded-lg bg-pink-50 text-left flex items-center gap-2 hover:bg-pink-100 transition">
                      <Edit className="w-4 h-4 text-[#FE6972]" /><span className="text-xs font-semibold text-gray-800">Edit Profile</span>
                    </button>
                    <button onClick={() => { setTab("packages"); setShowPkgForm(true); }} className="w-full p-2.5 rounded-lg bg-purple-50 text-left flex items-center gap-2 hover:bg-purple-100 transition">
                      <Plus className="w-4 h-4 text-purple-600" /><span className="text-xs font-semibold text-gray-800">Add Package</span>
                    </button>
                    <button onClick={() => setTab("shop")} className="w-full p-2.5 rounded-lg bg-rose-50 text-left flex items-center gap-2 hover:bg-rose-100 transition">
                      <ShoppingBag className="w-4 h-4 text-[#FE6972]" /><span className="text-xs font-semibold text-gray-800">Manage Shop Listings</span>
                    </button>
                    <button onClick={() => setTab("listings")} className="w-full p-2.5 rounded-lg bg-indigo-50 text-left flex items-center gap-2 hover:bg-indigo-100 transition">
                      <List className="w-4 h-4 text-indigo-600" /><span className="text-xs font-semibold text-gray-800">Manage Service Listings</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ LEADS ══ */}
          {tab === "leads" && (
            <div className="space-y-3">
              {leads.length === 0
                ? <div className="bg-white rounded-xl border p-10 text-center"><Users className="w-8 h-8 text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-400">No leads yet</p></div>
                : leads.map((l, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{l.message || "New inquiry"}</p>
                        <div className="flex gap-2 mt-1 text-[10px] text-gray-400">
                          {l.event_date && <span><Calendar className="w-3 h-3 inline" /> {new Date(l.event_date).toLocaleDateString()}</span>}
                          <span><Clock className="w-3 h-3 inline" /> {new Date(l.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${l.status === "PENDING" ? "bg-amber-50 text-amber-700" : l.status === "BOOKED" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>{l.status}</span>
                    </div>
                    <div className="flex gap-2">
                      {l.status === "PENDING" && <>
                        <button onClick={() => updateLead(l.id, "CONTACTED")} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "#FE6972" }}>Contact</button>
                        <button onClick={() => updateLead(l.id, "QUOTED")} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ color: "#6366f1", borderColor: "#6366f1" }}>Quote</button>
                      </>}
                      {l.status === "CONTACTED" && <button onClick={() => updateLead(l.id, "BOOKED")} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-green-600">Booked</button>}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ══ PROPOSALS ══ */}
          {tab === "proposals" && (
            <div className="space-y-3">
              {proposals.length === 0
                ? <div className="bg-white rounded-xl border p-10 text-center"><FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-400">No proposals yet</p></div>
                : proposals.map((p, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex justify-between">
                      <div><p className="text-sm font-bold text-gray-900">{p.service_type} Proposal</p><p className="text-[10px] text-gray-400">{new Date(p.created_at).toLocaleDateString()}</p></div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold h-fit ${p.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>{p.status}</span>
                    </div>
                    {p.price && <p className="text-lg font-bold mt-2" style={{ color: "#6366f1" }}>{Number(p.price).toLocaleString()} EGP</p>}
                  </div>
                ))}
            </div>
          )}

          {/* ══ MESSAGES ══ */}
          {tab === "messages" && (
            <div className="flex gap-4 h-[500px]">
              <div className="w-64 shrink-0 bg-white rounded-xl border border-gray-100 overflow-y-auto">
                <div className="p-3 border-b border-gray-100"><h3 className="text-xs font-bold text-gray-900">Conversations</h3></div>
                {conversations.length === 0 ? <p className="text-xs text-gray-400 text-center py-8">No conversations</p>
                : conversations.map((c, i) => (
                  <button key={i} onClick={() => loadConv(c.id)} className={`w-full p-3 text-left border-b border-gray-50 hover:bg-gray-50 ${activeConv === c.id ? "bg-pink-50" : ""}`}>
                    <p className="text-xs font-semibold text-gray-900">{c.user_name || "Guest"}</p>
                    <p className="text-[10px] text-gray-400 truncate">{c.last_message || "New"}</p>
                  </button>
                ))}
              </div>
              <div className="flex-1 bg-white rounded-xl border border-gray-100 flex flex-col">
                {!activeConv
                  ? <div className="flex-1 flex items-center justify-center"><MessageCircle className="w-8 h-8 text-gray-200" /></div>
                  : <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {convMessages.map((m, i) => (
                        <div key={i} className={`flex ${m.sender_type === "vendor" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${m.sender_type === "vendor" ? "text-white rounded-br-sm" : "bg-gray-100 text-gray-700 rounded-bl-sm"}`} style={m.sender_type === "vendor" ? { background: "#FE6972" } : {}}>
                            <p>{m.content}</p>
                            <p className={`text-[9px] mt-0.5 ${m.sender_type === "vendor" ? "text-white/50" : "text-gray-400"}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t flex gap-2">
                      <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === "Enter" && sendReply()} placeholder="Reply..." className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none" />
                      <button onClick={sendReply} className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: "#FE6972" }}><Send className="w-4 h-4" /></button>
                    </div>
                  </>}
              </div>
            </div>
          )}

          {/* ══ CALENDAR ══ */}
          {tab === "calendar" && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Your Availability</h2>
              <div className="grid grid-cols-7 gap-2">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-400 pb-1">{d}</div>)}
                {Array.from({ length: 35 }, (_, i) => {
                  const date = new Date(); date.setDate(date.getDate() + i - date.getDay());
                  const dateStr = date.toISOString().split("T")[0];
                  const cal = calendarDates.find((c: any) => c.date?.substring(0, 10) === dateStr);
                  const isBooked = cal && !cal.is_available;
                  return (
                    <div key={i} className={`text-center p-2 rounded-lg text-xs cursor-pointer transition ${isBooked ? "bg-red-50 text-red-600 font-bold" : "hover:bg-gray-50 text-gray-600"}`}>
                      {date.getDate()}{isBooked && <div className="w-1.5 h-1.5 rounded-full bg-red-500 mx-auto mt-0.5" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ PROFILE CENTER ══ */}
          {tab === "profile" && vendor && (
            <div className="space-y-4">
              {/* Status banner */}
              {vendor.registration_status === "approved" && vendor.is_active ? (
                <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ background: "#f0fdf4", borderColor: "#86efac" }}>
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-green-500" />
                  <div className="flex-1"><p className="text-sm font-bold text-green-800">Your profile is live on the marketplace</p><p className="text-xs text-green-600">Customers can find and contact you</p></div>
                  <a href={`/services/${vendorId}`} target="_blank" rel="noreferrer" className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-500 text-white">View Public Profile →</a>
                </div>
              ) : vendor.registration_status === "rejected" ? (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
                  <div><p className="text-sm font-bold text-red-700">Profile needs attention</p><p className="text-xs text-red-600">Update and resubmit for approval</p></div>
                </div>
              ) : vendor.registration_status === "submitted" ? (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
                  <Clock className="w-5 h-5 shrink-0 text-amber-600" />
                  <div><p className="text-sm font-bold text-amber-700">Profile under review</p><p className="text-xs text-amber-600">Admin will approve within 24 hours.</p></div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50">
                  <Info className="w-5 h-5 shrink-0 text-blue-500" />
                  <div className="flex-1"><p className="text-sm font-bold text-blue-700">Complete your profile to go live</p><p className="text-xs text-blue-600">Fill in all fields and save to submit for approval</p></div>
                </div>
              )}

              {/* Completeness bar */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 shrink-0">
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke={completenessColor} strokeWidth="3" strokeDasharray={`${completenessScore * 0.94} 100`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: completenessColor }}>{completenessScore}%</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Profile Completeness</p>
                    <p className="text-xs text-gray-500">{completenessScore >= 80 ? "Excellent! You rank higher in search." : `${completenessItems.filter(i => !i.done).length} items remaining`}</p>
                  </div>
                </div>
                {!editMode ? (
                  <button onClick={startEdit} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold" style={{ background: "#FE6972" }}>
                    <Edit className="w-4 h-4" />Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold bg-green-500 disabled:opacity-60">
                      <Save className="w-4 h-4" />{saving ? "Saving..." : "Save & Submit"}
                    </button>
                    <button onClick={() => { setEditMode(false); setCoverPreview(null); }} className={ghost}>Cancel</button>
                  </div>
                )}
              </div>

              {/* Completeness checklist */}
              {completenessScore < 100 && (
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <h3 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2"><Layers className="w-4 h-4 text-[#FE6972]" />Complete Your Profile</h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {completenessItems.map((item, i) => (
                      <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-[11px] ${item.done ? "bg-green-50" : "bg-gray-50"}`}>
                        {item.done ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-green-500" /> : <div className="w-3.5 h-3.5 shrink-0 rounded-full border-2 border-gray-300" />}
                        <span className={item.done ? "text-green-700 line-through" : "text-gray-600"}>{item.label}</span>
                        <span className="ml-auto text-[10px] font-bold" style={{ color: item.done ? "#22c55e" : "#9ca3af" }}>+{item.points}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit form */}
              {editMode && (
                <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                  <h3 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-3">Edit Profile Details</h3>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-2">Cover Photo</label>
                    <div onClick={() => coverRef.current?.click()} className="relative h-32 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-pink-300 transition overflow-hidden"
                      style={coverPreview || vendor.cover_image ? { backgroundImage: `url(${coverPreview || vendor.cover_image})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}>
                      {!coverPreview && !vendor.cover_image && <div className="text-center"><Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" /><p className="text-xs text-gray-400">Click to upload cover photo</p></div>}
                      {(coverPreview || vendor.cover_image) && <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition"><p className="text-white text-xs font-bold">Change photo</p></div>}
                    </div>
                    <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-semibold text-gray-700 block mb-1">Business Name (EN)</label><input className={inp} value={editForm.business_name || ""} onChange={e => setEditForm((f: any) => ({ ...f, business_name: e.target.value }))} /></div>
                    <div><label className="text-xs font-semibold text-gray-700 block mb-1">Business Name (AR)</label><input className={inp} dir="rtl" value={editForm.business_name_ar || ""} onChange={e => setEditForm((f: any) => ({ ...f, business_name_ar: e.target.value }))} /></div>
                  </div>
                  <div><label className="text-xs font-semibold text-gray-700 block mb-1">Short Description</label><input className={inp} value={editForm.description || ""} onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))} /></div>
                  <div><label className="text-xs font-semibold text-gray-700 block mb-1">About / Bio</label><textarea className={`${inp} h-24 resize-none`} value={editForm.bio || ""} onChange={e => setEditForm((f: any) => ({ ...f, bio: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-semibold text-gray-700 block mb-1">City</label><input className={inp} value={editForm.city || ""} onChange={e => setEditForm((f: any) => ({ ...f, city: e.target.value }))} /></div>
                    <div><label className="text-xs font-semibold text-gray-700 block mb-1">Starting Price (EGP)</label><input className={inp} type="number" value={editForm.price_min || ""} onChange={e => setEditForm((f: any) => ({ ...f, price_min: e.target.value }))} /></div>
                    <div><label className="text-xs font-semibold text-gray-700 block mb-1">Phone</label><input className={inp} value={editForm.phone || ""} onChange={e => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} /></div>
                    <div><label className="text-xs font-semibold text-gray-700 block mb-1">WhatsApp</label><input className={inp} value={editForm.whatsapp || ""} onChange={e => setEditForm((f: any) => ({ ...f, whatsapp: e.target.value }))} /></div>
                    <div><label className="text-xs font-semibold text-gray-700 block mb-1">Years of Experience</label><input className={inp} type="number" value={editForm.experience_years || ""} onChange={e => setEditForm((f: any) => ({ ...f, experience_years: e.target.value }))} /></div>
                    <div><label className="text-xs font-semibold text-gray-700 block mb-1">Website</label><input className={inp} value={editForm.website || ""} onChange={e => setEditForm((f: any) => ({ ...f, website: e.target.value }))} /></div>
                  </div>
                </div>
              )}

              {/* Portfolio manager */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><ImagePlus className="w-4 h-4 text-[#FE6972]" />Portfolio ({portfolioImages.length} images)</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Vendors with 10+ photos get 3x more leads</p>
                  </div>
                  <button onClick={() => portfolioRef.current?.click()} disabled={uploadingPortfolio}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-bold disabled:opacity-60"
                    style={{ background: "#FE6972" }}>
                    <Upload className="w-3.5 h-3.5" />{uploadingPortfolio ? "Uploading..." : "Upload Photos"}
                  </button>
                  <input ref={portfolioRef} type="file" accept="image/*" multiple className="hidden" onChange={uploadPortfolioImages} />
                </div>
                {portfolioImages.length === 0 ? (
                  <div onClick={() => portfolioRef.current?.click()} className="h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-pink-300 hover:bg-pink-50 transition">
                    <ImagePlus className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-xs text-gray-400">Click to upload portfolio images</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {portfolioImages.map((img: any, i: number) => (
                      <div key={img.id || i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img src={img.image_url} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5">
                          <button onClick={() => setPortfolioAsCover(img.id)} className="text-[10px] bg-white/90 text-gray-700 px-2 py-1 rounded font-semibold">⭐ Set Cover</button>
                          <button onClick={() => deletePortfolioImage(img.id)} className="text-[10px] bg-red-500 text-white px-2 py-1 rounded font-semibold">🗑 Remove</button>
                        </div>
                        {vendor.cover_image === img.image_url && <div className="absolute top-1 left-1 bg-yellow-400 text-[9px] font-bold text-white px-1.5 py-0.5 rounded">COVER</div>}
                      </div>
                    ))}
                    <div onClick={() => portfolioRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-pink-300 hover:bg-pink-50 transition">
                      <Plus className="w-6 h-6 text-gray-300" />
                    </div>
                  </div>
                )}
                {portfolioImages.length > 0 && portfolioImages.length < 10 && (
                  <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />Add {10 - portfolioImages.length} more images to unlock the "Top Portfolio" badge
                  </p>
                )}
              </div>

              {/* How customers see you */}
              {!editMode && (
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h3 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2"><Eye className="w-4 h-4 text-[#FE6972]" />How Customers See You</h3>
                  <div className="border rounded-xl overflow-hidden">
                    {vendor.cover_image && <div className="h-28 w-full" style={{ background: `url(${vendor.cover_image}) center/cover` }} />}
                    <div className="p-4 flex items-start gap-4 bg-gray-50">
                      <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center shrink-0"><Camera className="w-5 h-5 text-gray-400" /></div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{vendor.business_name}</h4>
                        <div className="flex gap-3 text-[10px] text-gray-500 mt-0.5">
                          <span><Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37] inline" /> {vendor.rating || "New"}</span>
                          <span>{vendor.city}</span>
                          {vendor.price_min && <span>From {Number(vendor.price_min).toLocaleString()} EGP</span>}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{vendor.description || "No description yet"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ SERVICES & PACKAGES ══ */}
          {tab === "packages" && (
            <div className="space-y-5">
              {/* Service Tags */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-purple-500" />Service Tags</h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  {services.map((s: any, i: number) => (
                    <span key={i} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-100">
                      {s.name}
                      <button onClick={() => deleteServiceTag(s.id)} className="ml-1 text-purple-400 hover:text-red-500"><XIcon className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className={`${inp} flex-1`} placeholder="Add a service tag (e.g. Wedding, Outdoor)..." value={svcInput} onChange={e => setSvcInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addServiceTag()} />
                  <button onClick={addServiceTag} className="px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "#6366f1" }}><Plus className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Pricing Packages */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Package className="w-4 h-4 text-[#FE6972]" />Pricing Packages</h2>
                  <button onClick={() => { setEditingPkg(null); setPkgForm({ name: "", price: "", description: "", includes: "", is_popular: false }); setShowPkgForm(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: "#FE6972" }}><Plus className="w-3 h-3" />Add Package</button>
                </div>
                {showPkgForm && (
                  <div className="mb-4 p-4 rounded-xl border border-pink-100 bg-pink-50 space-y-3">
                    <h4 className="text-xs font-bold text-gray-800">{editingPkg ? "Edit Package" : "New Package"}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-[10px] font-semibold text-gray-600 block mb-1">Name *</label><input className={inp} value={pkgForm.name} onChange={e => setPkgForm(f => ({ ...f, name: e.target.value }))} /></div>
                      <div><label className="text-[10px] font-semibold text-gray-600 block mb-1">Price (EGP) *</label><input className={inp} type="number" value={pkgForm.price} onChange={e => setPkgForm(f => ({ ...f, price: e.target.value }))} /></div>
                    </div>
                    <div><label className="text-[10px] font-semibold text-gray-600 block mb-1">Description</label><input className={inp} value={pkgForm.description} onChange={e => setPkgForm(f => ({ ...f, description: e.target.value }))} /></div>
                    <div><label className="text-[10px] font-semibold text-gray-600 block mb-1">Includes (comma-separated)</label><input className={inp} placeholder="8 hours coverage, edited photos..." value={pkgForm.includes} onChange={e => setPkgForm(f => ({ ...f, includes: e.target.value }))} /></div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={pkgForm.is_popular} onChange={e => setPkgForm(f => ({ ...f, is_popular: e.target.checked }))} /><label className="text-xs text-gray-700">Mark as Popular</label></div>
                    <div className="flex gap-2">
                      <button onClick={addPackage} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-60" style={{ background: "#FE6972" }}>{saving ? "Saving..." : editingPkg ? "Update" : "Add Package"}</button>
                      <button onClick={() => { setShowPkgForm(false); setEditingPkg(null); }} className={ghost}>Cancel</button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {packages.map((p: any, i: number) => (
                    <div key={i} className={`rounded-xl p-4 border relative ${p.is_popular ? "border-[#FE6972] bg-pink-50" : "border-gray-200"}`}>
                      {p.is_popular && <span className="absolute top-2 right-2 text-[9px] font-bold text-[#FE6972] bg-white px-1.5 py-0.5 rounded-full border border-pink-200">POPULAR</span>}
                      <h4 className="font-bold text-gray-900 text-sm">{p.name}</h4>
                      <p className="text-lg font-bold mt-1" style={{ color: "#6366f1" }}>{Number(p.price).toLocaleString()} EGP</p>
                      {p.description && <p className="text-[10px] text-gray-500 mt-1">{p.description}</p>}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => { setEditingPkg(p); setPkgForm({ name: p.name, price: p.price?.toString(), description: p.description || "", includes: Array.isArray(p.includes) ? p.includes.join(", ") : "", is_popular: p.is_popular || false }); setShowPkgForm(true); }} className="flex-1 py-1.5 rounded-lg border border-gray-200 text-[10px] font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1"><Edit className="w-3 h-3" />Edit</button>
                        <button onClick={() => deletePackage(p.id)} className="flex-1 py-1.5 rounded-lg border border-red-100 bg-red-50 text-[10px] font-semibold text-red-500 hover:bg-red-100 flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" />Delete</button>
                      </div>
                    </div>
                  ))}
                  {packages.length === 0 && <div className="col-span-3 py-8 text-center text-gray-400 text-sm">No packages yet — click "Add Package" to create one</div>}
                </div>
              </div>

              {/* Store Items */}
              {isStore && (
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-blue-500" />Store Items</h2>
                    <button onClick={() => { setEditingItem(null); setItemForm({ name: "", name_ar: "", price: "", description: "", category: "", stock_quantity: "0" }); setShowItemForm(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-500"><Plus className="w-3 h-3" />Add Item</button>
                  </div>
                  {showItemForm && (
                    <div className="mb-4 p-4 rounded-xl border border-blue-100 bg-blue-50 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] font-semibold text-gray-600 block mb-1">Item Name *</label><input className={inp} value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} /></div>
                        <div><label className="text-[10px] font-semibold text-gray-600 block mb-1">Price (EGP) *</label><input className={inp} type="number" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} /></div>
                        <div><label className="text-[10px] font-semibold text-gray-600 block mb-1">Category</label><input className={inp} value={itemForm.category} onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))} /></div>
                        <div><label className="text-[10px] font-semibold text-gray-600 block mb-1">Stock Qty</label><input className={inp} type="number" value={itemForm.stock_quantity} onChange={e => setItemForm(f => ({ ...f, stock_quantity: e.target.value }))} /></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveItem} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-500 disabled:opacity-60">{saving ? "Saving..." : editingItem ? "Update" : "Add Item"}</button>
                        <button onClick={() => { setShowItemForm(false); setEditingItem(null); }} className={ghost}>Cancel</button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                        <div className="flex-1"><p className="text-xs font-bold text-gray-900">{item.name}</p><p className="text-[10px] text-gray-500">{item.category} · Stock: {item.stock_quantity}</p></div>
                        <p className="text-sm font-bold text-blue-600">{Number(item.price).toLocaleString()} EGP</p>
                        <button onClick={() => { setEditingItem(item); setItemForm({ name: item.name, name_ar: item.name_ar || "", price: item.price?.toString(), description: item.description || "", category: item.category || "", stock_quantity: item.stock_quantity?.toString() || "0" }); setShowItemForm(true); }} className="p-1.5 rounded-lg border border-gray-200 hover:bg-white"><Edit className="w-3 h-3 text-gray-500" /></button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100"><Trash2 className="w-3 h-3 text-red-500" /></button>
                      </div>
                    ))}
                    {items.length === 0 && <p className="text-center text-sm text-gray-400 py-6">No items yet</p>}
                  </div>
                </div>
              )}

              {/* Happy Hour Deals */}
              {isHappyHour && (
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Clock3 className="w-4 h-4 text-pink-500" />Happy Hour Deals</h2>
                    <button onClick={() => { setEditingDeal(null); setDealForm({ title: "", description: "", original_price: "", discount_percentage: "20", start_time: "12:00", end_time: "18:00", valid_days: [] }); setShowDealForm(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: "#FE6972" }}><Plus className="w-3 h-3" />Add Deal</button>
                  </div>
                  {showDealForm && (
                    <div className="mb-4 p-4 rounded-xl border border-pink-100 bg-pink-50 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] font-semibold text-gray-600 block mb-1">Deal Title *</label><input className={inp} value={dealForm.title} onChange={e => setDealForm(f => ({ ...f, title: e.target.value }))} /></div>
                        <div><label className="text-[10px] font-semibold text-gray-600 block mb-1">Original Price *</label><input className={inp} type="number" value={dealForm.original_price} onChange={e => setDealForm(f => ({ ...f, original_price: e.target.value }))} /></div>
                        <div><label className="text-[10px] font-semibold text-gray-600 block mb-1">Discount %</label><input className={inp} type="number" min="1" max="99" value={dealForm.discount_percentage} onChange={e => setDealForm(f => ({ ...f, discount_percentage: e.target.value }))} /></div>
                        <div><label className="text-[10px] font-semibold text-gray-600 block mb-1">Description</label><input className={inp} value={dealForm.description} onChange={e => setDealForm(f => ({ ...f, description: e.target.value }))} /></div>
                        <div><label className="text-[10px] font-semibold text-gray-600 block mb-1">Start Time</label><input className={inp} type="time" value={dealForm.start_time} onChange={e => setDealForm(f => ({ ...f, start_time: e.target.value }))} /></div>
                        <div><label className="text-[10px] font-semibold text-gray-600 block mb-1">End Time</label><input className={inp} type="time" value={dealForm.end_time} onChange={e => setDealForm(f => ({ ...f, end_time: e.target.value }))} /></div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-600 block mb-1">Valid Days</label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS.map(d => (
                            <button key={d} type="button" onClick={() => setDealForm(f => ({ ...f, valid_days: f.valid_days.includes(d) ? f.valid_days.filter((x: string) => x !== d) : [...f.valid_days, d] }))}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition ${dealForm.valid_days.includes(d) ? "bg-pink-500 text-white border-pink-500" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>{d}</button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveDeal} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-60" style={{ background: "#FE6972" }}>{saving ? "Saving..." : editingDeal ? "Update" : "Add Deal"}</button>
                        <button onClick={() => { setShowDealForm(false); setEditingDeal(null); }} className={ghost}>Cancel</button>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {deals.map((d: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                        <div className="flex-1"><p className="text-xs font-bold text-gray-900">{d.title}</p><p className="text-[10px] text-gray-500">{d.start_time} – {d.end_time}</p></div>
                        <div className="text-right"><p className="text-xs line-through text-gray-400">{Number(d.original_price).toLocaleString()} EGP</p><p className="text-sm font-bold text-green-600">{Number(d.discount_price || 0).toLocaleString()} EGP</p></div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700">-{d.discount_percentage}%</span>
                        <button onClick={() => { setEditingDeal(d); setDealForm({ title: d.title, description: d.description || "", original_price: d.original_price?.toString(), discount_percentage: d.discount_percentage?.toString(), start_time: d.start_time || "12:00", end_time: d.end_time || "18:00", valid_days: Array.isArray(d.valid_days) ? d.valid_days : JSON.parse(d.valid_days || "[]") }); setShowDealForm(true); }} className="p-1.5 rounded-lg border border-gray-200 hover:bg-white"><Edit className="w-3 h-3 text-gray-500" /></button>
                        <button onClick={() => deleteDeal(d.id)} className="p-1.5 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100"><Trash2 className="w-3 h-3 text-red-500" /></button>
                      </div>
                    ))}
                    {deals.length === 0 && <p className="text-center text-sm text-gray-400 py-6">No deals yet</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ SHOP LISTINGS ══ */}
          {tab === "shop" && (
            <div className="max-w-4xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-[#FE6972]" />Shop Listings</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Paid advertising for your wedding products</p>
                </div>
                <button onClick={() => { setEditingShopProduct(null); setShowShopForm(true); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold" style={{ background: "linear-gradient(135deg,#FE6972,#c9485f)" }}>
                  <Plus className="w-3.5 h-3.5" />New Listing
                </button>
              </div>

              {/* Quota bar */}
              {shopQuota && (
                <div className={`rounded-xl p-3 mb-4 ${shopQuota.allowed ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-gray-700">
                      {shopQuota.plan?.toUpperCase() || "FREE"} Plan — {shopQuota.used} / {shopQuota.limit === -1 ? "∞" : shopQuota.limit} listings used this month
                    </span>
                    {!shopQuota.allowed && (
                      <button onClick={() => setShopSubTab("plans")} className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#D4AF37" }}>Upgrade</button>
                    )}
                  </div>
                  {shopQuota.limit !== -1 && (
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((shopQuota.used / shopQuota.limit) * 100, 100)}%`, background: shopQuota.allowed ? "#22c55e" : "#ef4444" }} />
                    </div>
                  )}
                  {!shopQuota.allowed && <p className="text-[10px] text-red-600 mt-1">{shopQuota.message}</p>}
                </div>
              )}

              {/* Sub tabs */}
              <div className="flex gap-1 mb-4 bg-gray-50 p-1 rounded-xl w-fit">
                {[
                  { id: "listings",  label: `Listings (${shopProducts.length})`  },
                  { id: "inquiries", label: `Inquiries${newShopInquiries > 0 ? ` (${newShopInquiries} new)` : ""}` },
                  { id: "plans",     label: "Plans & Pricing"                     },
                ].map(t => (
                  <button key={t.id} onClick={() => setShopSubTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${shopSubTab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Listings sub-tab */}
              {shopSubTab === "listings" && (
                <div className="space-y-3">
                  {shopProducts.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                      <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-500 mb-1">No shop listings yet</p>
                      <p className="text-xs text-gray-400 mb-4">Create your first product listing to start getting inquiries from customers.</p>
                      <button onClick={() => setShowShopForm(true)} className="px-4 py-2 rounded-xl text-white text-xs font-bold" style={{ background: "#FE6972" }}>+ Create First Listing</button>
                    </div>
                  ) : shopProducts.map((p: any) => {
                    const plan   = PLAN_META[p.plan_type] || PLAN_META.LITE;
                    const PlanIcon = plan.icon;
                    const status = SHOP_STATUS[p.status] || SHOP_STATUS.pending;
                    return (
                      <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3">
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                          {p.cover_image ? <img src={p.cover_image} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-6 h-6 text-gray-300" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-gray-900 text-xs line-clamp-1">{p.name}</h4>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.bg} ${status.text}`}>{status.label}</span>
                          </div>
                          {p.status === "rejected" && p.rejection_reason && (
                            <p className="text-[10px] text-red-500 mt-0.5 bg-red-50 px-2 py-0.5 rounded">Reason: {p.rejection_reason}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-xs font-bold text-gray-900">{parseFloat(p.price).toLocaleString()} EGP</span>
                            {PlanIcon && <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: plan.color }}><PlanIcon className="w-2.5 h-2.5" />{plan.label}</span>}
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Eye className="w-3 h-3" />{p.view_count}</span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{p.inquiry_count}</span>
                            {p.category_name && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: (p.category_color || "#FE6972") + "20", color: p.category_color || "#FE6972" }}>{p.category_name}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button onClick={() => { setEditingShopProduct(p); setShowShopForm(true); }} className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center"><Edit className="w-3.5 h-3.5 text-gray-500" /></button>
                          <button onClick={() => deleteShopProduct(p.id)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Inquiries sub-tab */}
              {shopSubTab === "inquiries" && (
                <div className="space-y-2">
                  {shopInquiries.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                      <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-500">No shop inquiries yet</p>
                    </div>
                  ) : shopInquiries.map((inq: any) => (
                    <div key={inq.id} className={`bg-white rounded-xl border p-3 ${inq.status === "new" ? "border-[#FE6972]/30 bg-pink-50/30" : "border-gray-100"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-gray-900">{inq.name}</span>
                            {inq.status === "new" && <span className="text-[9px] font-bold bg-[#FE6972] text-white px-1.5 py-0.5 rounded-full">NEW</span>}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">{inq.product_name} · {new Date(inq.created_at).toLocaleDateString()}</p>
                          {inq.message && <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 rounded-lg px-2 py-1.5">{inq.message}</p>}
                        </div>
                        <div className="flex flex-col gap-1 shrink-0 text-right">
                          {inq.phone && <a href={`tel:${inq.phone}`} className="text-[10px] text-blue-600 font-semibold">{inq.phone}</a>}
                          {inq.email && <a href={`mailto:${inq.email}`} className="text-[10px] text-blue-600 font-semibold">{inq.email}</a>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Plans sub-tab */}
              {shopSubTab === "plans" && (
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-1"><Megaphone className="w-4 h-4 text-[#FE6972]" />Advertising Plans</h3>
                    <p className="text-xs text-gray-500">First 3 listings/month are free. Upgrade for more listings, priority placement, and featured badges.</p>
                  </div>
                  {[
                    { id: "LITE",  name: "Lite",  price: "Free",  period: "",    color: "#94a3b8", features: ["3 free listings/month", "Standard placement", "Contact form"],             limit: "3/month" },
                    { id: "BASIC", name: "Basic", price: "299",   period: "/mo", color: "#22c55e", features: ["1 active listing", "Standard placement", "3 photos", "City targeting"],   limit: "1 active" },
                    { id: "PRO",   name: "Pro",   price: "699",   period: "/mo", color: "#6366f1", features: ["3 listings", "Priority placement", "8 photos", "Featured badge", "Analytics"], limit: "3 active", popular: true },
                    { id: "TOP",   name: "Top",   price: "1,299", period: "/mo", color: "#D4AF37", features: ["Unlimited listings", "Top placement", "20 photos", "Homepage spotlight", "Dedicated support"], limit: "Unlimited" },
                  ].map(plan => (
                    <div key={plan.id} className={`bg-white rounded-xl border p-4 relative ${(plan as any).popular ? "border-[#FE6972]" : "border-gray-200"} ${shopQuota?.plan?.toUpperCase() === plan.id ? "ring-2 ring-[#FE6972]/30" : ""}`}>
                      {(plan as any).popular && <span className="absolute -top-2.5 right-4 bg-[#FE6972] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">POPULAR</span>}
                      {shopQuota?.plan?.toUpperCase() === plan.id && <span className="absolute -top-2.5 left-4 bg-gray-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">CURRENT</span>}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: plan.color }} />
                          <span className="font-bold text-sm text-gray-900">{plan.name}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{plan.limit}</span>
                        </div>
                        <span className="font-black text-base" style={{ color: plan.color }}>
                          {plan.price === "Free" ? "Free" : `EGP ${plan.price}`}<span className="text-xs font-normal text-gray-400">{plan.period}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {plan.features.map(f => <span key={f} className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">✓ {f}</span>)}
                      </div>
                      {shopQuota?.plan?.toUpperCase() !== plan.id && plan.id !== "LITE" && (
                        <button onClick={async () => {
                          const res = await fetch(`${API}/api/shop/vendor/${vendorId}/upgrade-plan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: plan.id }) });
                          const data = await res.json();
                          if (data.success) { alert(`Upgraded to ${plan.name}! In production this triggers payment.`); if (vendorId) loadShopData(vendorId); }
                        }} className="w-full py-2 rounded-xl text-white text-xs font-bold" style={{ background: plan.color }}>
                          Upgrade to {plan.name}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ SERVICE LISTINGS ══ */}
          {tab === "listings" && (
            <div className="max-w-4xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2"><List className="w-4 h-4 text-indigo-600" />Service Listings</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Advertise your wedding services — photography, makeup, catering, etc.</p>
                </div>
                <button onClick={() => { setEditingListing(null); setShowListingForm(true); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold" style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
                  <Plus className="w-3.5 h-3.5" />New Service Listing
                </button>
              </div>

              {/* Sub tabs */}
              <div className="flex gap-1 mb-4 bg-gray-50 p-1 rounded-xl w-fit">
                {[
                  { id: "listings",  label: `Listings (${serviceListings.length})` },
                  { id: "inquiries", label: `Inquiries (${listingInquiries.length})` },
                ].map(t => (
                  <button key={t.id} onClick={() => setListingSubTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${listingSubTab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {listingSubTab === "listings" && (
                <div className="space-y-3">
                  {serviceListings.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                      <List className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-500 mb-1">No service listings yet</p>
                      <p className="text-xs text-gray-400 mb-4">Create a listing to advertise your wedding services to couples.</p>
                      <button onClick={() => setShowListingForm(true)} className="px-4 py-2 rounded-xl text-white text-xs font-bold" style={{ background: "#6366f1" }}>+ Create First Listing</button>
                    </div>
                  ) : serviceListings.map((l: any) => {
                    const plan   = PLAN_META[l.plan_type] || PLAN_META.LITE;
                    const PlanIcon = plan.icon;
                    const rawStatus = l.status || "pending_review";
                    const status = LISTING_STATUS[rawStatus] || LISTING_STATUS.pending_review;
                    return (
                      <div key={l.id} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3">
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                          {(l.cover_image || l.image_urls?.[0])
                            ? <img src={l.cover_image || l.image_urls?.[0]} alt={l.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><List className="w-6 h-6 text-gray-300" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-gray-900 text-xs line-clamp-1">{l.title}</h4>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.bg} ${status.text}`}>{status.label}</span>
                          </div>
                          {l.rejection_reason && <p className="text-[10px] text-red-500 mt-0.5 bg-red-50 px-2 py-0.5 rounded">Reason: {l.rejection_reason}</p>}
                          {l.admin_note && <p className="text-[10px] text-purple-600 mt-0.5 bg-purple-50 px-2 py-0.5 rounded">Note: {l.admin_note}</p>}
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {l.price && <span className="text-xs font-bold text-gray-900">{parseFloat(l.price).toLocaleString()} EGP</span>}
                            {PlanIcon && <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: plan.color }}><PlanIcon className="w-2.5 h-2.5" />{plan.label}</span>}
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Eye className="w-3 h-3" />{l.views || 0}</span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{l.inquiries || 0}</span>
                            {l.category && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">{l.category}</span>}
                            {l.city && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{l.city}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button onClick={() => { setEditingListing(l); setShowListingForm(true); }} className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center"><Edit className="w-3.5 h-3.5 text-gray-500" /></button>
                          <button onClick={() => deleteServiceListing(l.id)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {listingSubTab === "inquiries" && (
                <div className="space-y-2">
                  {listingInquiries.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                      <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-500">No service listing inquiries yet</p>
                    </div>
                  ) : listingInquiries.map((inq: any) => (
                    <div key={inq.id} className="bg-white rounded-xl border border-gray-100 p-3">
                      <p className="text-xs font-bold text-gray-900">{inq.name}</p>
                      <p className="text-[10px] text-gray-400">{inq.listing_title} · {new Date(inq.created_at).toLocaleDateString()}</p>
                      {inq.message && <p className="text-xs text-gray-600 mt-1">{inq.message}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ EARNINGS ══ */}
          {tab === "earnings" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center"><p className="text-2xl font-bold text-green-600">{totalEarnings.toLocaleString()}</p><p className="text-[10px] text-gray-400">Total Earned (EGP)</p></div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center"><p className="text-2xl font-bold text-amber-600">{earnings.filter(e => e.status === "pending").reduce((s, e) => s + parseFloat(e.amount), 0).toLocaleString()}</p><p className="text-[10px] text-gray-400">Pending (EGP)</p></div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center"><p className="text-2xl font-bold text-gray-900">{earnings.length}</p><p className="text-[10px] text-gray-400">Transactions</p></div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Transaction History</h2>
                {earnings.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">No transactions yet</p>
                : earnings.map((e: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><DollarSign className="w-4 h-4 text-green-600" /></div>
                      <div><p className="text-xs font-semibold text-gray-900">{e.description}</p><p className="text-[9px] text-gray-400">{new Date(e.created_at).toLocaleDateString()}</p></div>
                    </div>
                    <p className="text-sm font-bold text-green-600">+{Number(e.amount).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ ANALYTICS ══ */}
          {tab === "analytics" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Profile Views",   value: vendor?.profile_views || 0 },
                  { label: "Lead Conversion", value: leads.length > 0 ? `${Math.round(leads.filter(l => l.status === "BOOKED").length / leads.length * 100)}%` : "0%" },
                  { label: "Response Time",   value: `${vendor?.response_time_hours || "N/A"}h` },
                  { label: "Completed Jobs",  value: vendor?.completed_bookings || 0 },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="text-[10px] text-gray-400 mb-1">{s.label}</p>
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-5 text-center" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                <Crown className="w-6 h-6 text-white mx-auto mb-2" />
                <p className="text-white font-bold text-sm mb-1">Get 5x More Leads</p>
                <p className="text-white/60 text-xs mb-3">Upgrade to TOP plan</p>
                <button onClick={() => { setTab("shop"); setShopSubTab("plans"); }} className="bg-white px-5 py-2 rounded-lg text-xs font-bold" style={{ color: "#6366f1" }}>View Plans</button>
              </div>
            </div>
          )}

          {/* ══ SETTINGS ══ */}
          {tab === "settings" && vendor && (
            <div className="max-w-xl space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-900">Business Settings</h2>
                  <button onClick={() => { startEdit(); setTab("profile"); }} className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ color: "#FE6972", border: "1px solid #FE6972" }}><Edit className="w-3 h-3" />Edit</button>
                </div>
                <div className="space-y-3">
                  {[
                    ["Business Name", vendor.business_name],
                    ["City",          vendor.city],
                    ["Category",      vendor.category_name || "—"],
                    ["Plan",          vendor.plan_type || "—"],
                    ["Starting Price",vendor.price_min ? `${Number(vendor.price_min).toLocaleString()} EGP` : "Not set"],
                    ["Experience",    `${vendor.experience_years || 0} years`],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-500 text-xs">{label}</span>
                      <span className="font-semibold text-gray-900 text-xs">{val as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ══ SHOP PRODUCT FORM MODAL ══ */}
      {showShopForm && vendorId && (
        <ShopProductForm
          categories={shopCategories}
          vendorId={vendorId}
          product={editingShopProduct}
          onSave={handleShopProductSaved}
          onCancel={() => { setShowShopForm(false); setEditingShopProduct(null); }}
        />
      )}

      {/* ══ SERVICE LISTING FORM MODAL ══ */}
      {showListingForm && vendorId && (
        <ServiceListingForm
          vendorId={vendorId}
          listing={editingListing}
          serviceCategories={serviceCategories}
          onSave={handleListingSaved}
          onCancel={() => { setShowListingForm(false); setEditingListing(null); }}
        />
      )}
    </div>
  );
}
