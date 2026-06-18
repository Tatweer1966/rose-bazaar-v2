"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search, MapPin, Shield, Heart, Flame, Crown, Zap, Check,
  ChevronRight, Eye, MessageCircle, CreditCard, Clock,
  Sparkles, SlidersHorizontal, X, Star, Tag, Megaphone,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

const PLANS: Record<string, { label: string; color: string; icon: any; priority: number }> = {
  TOP:   { label: "Top",   color: "#D4AF37", icon: Crown, priority: 4 },
  PRO:   { label: "Pro",   color: "#6366f1", icon: Zap,   priority: 3 },
  BASIC: { label: "Basic", color: "#22c55e", icon: Check, priority: 2 },
  LITE:  { label: "Lite",  color: "#94a3b8", icon: null,  priority: 1 },
};

const CITIES = ["All Cities", "Cairo", "Alexandria", "Giza", "Hurghada"];
const PRICE_RANGES = [
  { label: "Any Budget",       min: 0,     max: 999999 },
  { label: "Under 3,000",      min: 0,     max: 3000   },
  { label: "3,000 – 8,000",    min: 3000,  max: 8000   },
  { label: "8,000 – 20,000",   min: 8000,  max: 20000  },
  { label: "20,000+",          min: 20000, max: 999999 },
];
const SORT_OPTIONS = [
  { value: "best_match", label: "Best Match"      },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "newest",     label: "Newest"           },
  { value: "popular",    label: "Most Viewed"      },
];

interface Category {
  id: string; name: string; name_ar?: string; slug: string;
  icon: string; color: string; display_order: number;
  product_count?: number; subcategories?: SubCategory[];
}
interface SubCategory { id: string; category_id: string; name: string; slug: string; }
interface Product {
  id: string; name: string; description?: string;
  category_id: string; subcategory_id?: string;
  category_name?: string; category_color?: string; subcategory_name?: string;
  price: string; price_original?: string; currency: string;
  city?: string; plan_type: string;
  is_featured: boolean; is_verified: boolean;
  cover_image?: string; display_image?: string; images: string[];
  view_count: number; inquiry_count: number; save_count: number;
  vendor_business_name?: string; score: number;
}

// ── Skeleton ────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="h-48 bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
  );
}

// ── Product Card ─────────────────────────────────────────────────
function ProductCard({ product: p, saved, onToggleSave }: {
  product: Product; saved: boolean; onToggleSave: () => void;
}) {
  const plan    = PLANS[p.plan_type] || PLANS.LITE;
  const PlanIcon = plan.icon;
  const img     = p.display_image || p.cover_image || "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=70";
  const price   = parseFloat(p.price);
  const origPrice = p.price_original ? parseFloat(p.price_original) : null;
  const discount  = origPrice ? Math.round((1 - price / origPrice) * 100) : null;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#FE6972]/30 hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={img} alt={p.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Plan + featured badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {PlanIcon && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold text-white shadow"
              style={{ background: plan.color }}>
              <PlanIcon className="w-3 h-3" />{plan.label}
            </span>
          )}
          {p.is_featured && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-[#FE6972] text-white shadow">
              <Flame className="w-3 h-3" />Featured
            </span>
          )}
          {discount && (
            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-500 text-white shadow">
              -{discount}%
            </span>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition"
        >
          <Heart className={`w-4 h-4 ${saved ? "fill-[#FE6972] text-[#FE6972]" : "text-gray-500"}`} />
        </button>

        {/* Price overlay */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg">
            {price.toLocaleString()} EGP
            {origPrice && <span className="line-through opacity-60 ml-1.5">{origPrice.toLocaleString()}</span>}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#FE6972] transition line-clamp-1">
            {p.name}
          </h3>
          {p.is_verified && <Shield className="w-4 h-4 shrink-0 text-green-500" />}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 flex-wrap">
          {p.category_name && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.category_color || "#FE6972" }} />
              {p.category_name}
            </span>
          )}
          {p.subcategory_name && (
            <span className="text-gray-300">·</span>
          )}
          {p.subcategory_name && (
            <span className="text-gray-400">{p.subcategory_name}</span>
          )}
          {p.city && (
            <span className="flex items-center gap-1 ml-auto">
              <MapPin className="w-3 h-3" />{p.city}
            </span>
          )}
        </div>

        {p.description && (
          <p className="text-[11px] text-gray-400 line-clamp-2 mb-3 flex-1">{p.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-3">
          <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{p.view_count} views</span>
          <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{p.inquiry_count} inquiries</span>
          <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{p.save_count}</span>
        </div>

        {/* Installment hint for expensive items */}
        {price > 3000 && (
          <div className="flex items-center gap-1 mb-3 px-2 py-1 rounded-lg bg-purple-50 text-purple-700">
            <CreditCard className="w-3 h-3" />
            <span className="text-[10px] font-semibold">
              From {Math.round(price / 12).toLocaleString()} EGP/month
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Link
            href={`/shop/${p.id}`}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-center transition"
            style={{ background: "#FE6972", color: "#fff" }}
          >
            View Details
          </Link>
          <Link
            href={`/shop/${p.id}`}
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
          >
            <MessageCircle className="w-4 h-4 text-gray-500" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Section row (discovery mode) ─────────────────────────────────
function ProductRow({ title, icon, products, savedMap, onToggleSave }: {
  title: string; icon: string; products: Product[];
  savedMap: Record<string, boolean>; onToggleSave: (id: string) => void;
}) {
  if (!products.length) return null;
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4 px-6 max-w-7xl mx-auto">
        <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-gray-900 italic">
          <span>{icon}</span>{title}
        </h2>
        <Link href="/shop" className="text-xs font-semibold flex items-center gap-1" style={{ color: "#FE6972" }}>
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {products.slice(0, 4).map(p => (
          <ProductCard key={p.id} product={p} saved={savedMap[p.id] || false} onToggleSave={() => onToggleSave(p.id)} />
        ))}
      </div>
    </div>
  );
}

// ── Advertise Modal ───────────────────────────────────────────────
function AdvertiseModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-md w-full relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition text-lg">
          ×
        </button>
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🌹</div>
          <h2 className="font-serif text-2xl font-bold italic text-gray-900 mb-2">Advertise on Rose Bazaar</h2>
          <p className="text-sm text-gray-500">Reach thousands of couples planning weddings across Egypt</p>
        </div>
        {[
          { id: "BASIC", name: "Basic",    price: "299",   period: "mo", popular: false,
            features: ["1 listing", "Standard placement", "3 photos", "Contact form"] },
          { id: "PRO",   name: "Pro",      price: "699",   period: "mo", popular: true,
            features: ["3 listings", "Priority placement", "8 photos", "Featured badge", "Analytics", "WhatsApp button"] },
          { id: "TOP",   name: "Top",      price: "1,299", period: "mo", popular: false,
            features: ["Unlimited listings", "Top placement", "20 photos", "Homepage spotlight", "Dedicated support"] },
        ].map(plan => (
          <div key={plan.id}
            className={`border rounded-xl p-4 mb-3 relative ${plan.popular ? "border-[#FE6972] bg-pink-50" : "border-gray-200"}`}>
            {plan.popular && (
              <span className="absolute -top-2.5 right-4 bg-[#FE6972] text-white text-[10px] font-bold px-3 py-0.5 rounded-full tracking-wide">
                POPULAR
              </span>
            )}
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-900">{plan.name}</span>
              <span className="font-black text-lg" style={{ color: plan.popular ? "#FE6972" : "#1a1a1a" }}>
                EGP {plan.price}<span className="text-xs font-normal text-gray-400">/{plan.period}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {plan.features.map(f => (
                <span key={f} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">✓ {f}</span>
              ))}
            </div>
          </div>
        ))}
        <button
          className="w-full py-3.5 rounded-xl font-bold text-white mt-2 transition"
          style={{ background: "linear-gradient(135deg,#FE6972,#c9485f)" }}
        >
          Get Started — Contact Us
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          Questions? WhatsApp us or email shop@rosebazaar.eg
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function ShopPage() {
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [products,    setProducts]    = useState<Product[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeCat,   setActiveCat]   = useState<string | null>(null);
  const [activeSub,   setActiveSub]   = useState<string | null>(null);
  const [city,        setCity]        = useState("All Cities");
  const [sortBy,      setSortBy]      = useState("best_match");
  const [search,      setSearch]      = useState("");
  const [priceRange,  setPriceRange]  = useState(0);
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [saved,       setSaved]       = useState<Record<string, boolean>>({});

  // Load categories once
  useEffect(() => {
    fetch(`${API}/api/shop/categories?includeSubcategories=true`)
      .then(r => r.json())
      .then(d => { if (d.success) setCategories(d.data); })
      .catch(() => {});
  }, []);

  // Load products whenever filters change
  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (activeCat)   p.set("category",    activeCat);
    if (activeSub)   p.set("subcategory", activeSub);
    if (city !== "All Cities") p.set("city", city);
    if (search)      p.set("q",           search);
    if (priceRange > 0) {
      const r = PRICE_RANGES[priceRange];
      p.set("min_price", String(r.min));
      p.set("max_price", String(r.max));
    }
    p.set("sortBy", sortBy);
    p.set("page",   String(page));
    p.set("limit",  "24");

    fetch(`${API}/api/shop/products?${p}`)
      .then(r => r.json())
      .then(d => {
        setProducts(d.data || []);
        setTotal(d.pagination?.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeCat, activeSub, city, search, priceRange, sortBy, page]);

  const toggleSave = useCallback((id: string) => {
    setSaved(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const selectedCat  = categories.find(c => c.id === activeCat);
  const totalPages   = Math.ceil(total / 24);
  const isFiltered   = !!(activeCat || city !== "All Cities" || search || priceRange > 0);
  const priceFilter  = PRICE_RANGES[priceRange];

  const featured      = useMemo(() => products.filter(p => p.is_featured || p.plan_type === "TOP"), [products]);
  const budgetPicks   = useMemo(() => products.filter(p => parseFloat(p.price) < 3000), [products]);

  return (
    <div className="min-h-screen" style={{ background: "#F9FAFB" }}>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-10 overflow-hidden" style={{ minHeight: 340 }}>
        <div className="absolute inset-0"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80')",
            backgroundSize: "cover", backgroundPosition: "center 40%",
          }} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(135deg,rgba(254,105,114,0.85) 0%,rgba(180,50,60,0.75) 100%)" }} />

        <div className="relative max-w-4xl mx-auto px-6 text-center pt-10 pb-4">
          <p className="text-white/70 text-sm font-medium mb-2 tracking-widest uppercase">Rose Bazaar</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white italic mb-3">
            {selectedCat ? selectedCat.name : "Wedding Shop"}
          </h1>
          <p className="text-white/75 text-sm md:text-base mb-8">
            {selectedCat
              ? `${total} products in ${selectedCat.name}`
              : `Discover ${total} wedding products from trusted vendors across Egypt`}
          </p>

          {/* Search */}
          <div className="flex gap-2 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 flex-1 shadow-xl">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search dresses, flowers, jewelry..."
                className="bg-transparent outline-none text-sm text-gray-700 w-full placeholder:text-gray-400"
              />
              {search && (
                <button onClick={() => { setSearch(""); setPage(1); }}>
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-2xl px-4 py-3.5 flex items-center gap-2 text-sm font-semibold hover:bg-white/30 transition shadow-xl"
            >
              <SlidersHorizontal className="w-4 h-4" />Filters
            </button>
          </div>

          {/* Quick tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["Dresses", "Flowers", "Jewelry", "Cakes", "Makeup"].map(tag => (
              <button key={tag}
                onClick={() => {
                  const cat = categories.find(c => c.name.toLowerCase().includes(tag.toLowerCase()));
                  if (cat) { setActiveCat(cat.id === activeCat ? null : cat.id); setPage(1); }
                }}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition"
                style={{
                  background: categories.find(c => c.name.toLowerCase().includes(tag.toLowerCase()))?.id === activeCat
                    ? "#fff" : "rgba(255,255,255,0.15)",
                  color: categories.find(c => c.name.toLowerCase().includes(tag.toLowerCase()))?.id === activeCat
                    ? "#FE6972" : "#fff",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >{tag}</button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FILTER PANEL ─────────────────────────────────────── */}
      {showFilters && (
        <section className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-6">
            <div>
              <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Price Range</p>
              <div className="flex gap-1.5 flex-wrap">
                {PRICE_RANGES.map((r, i) => (
                  <button key={i} onClick={() => { setPriceRange(i); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${priceRange === i ? "bg-[#FE6972] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Sort By</p>
              <div className="flex gap-1.5 flex-wrap">
                {SORT_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => { setSortBy(o.value); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${sortBy === o.value ? "bg-[#FE6972] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CATEGORY PILLS ───────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100 sticky top-[63px] z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto">
          <div className="flex gap-1 py-3 min-w-max">
            <button
              onClick={() => { setActiveCat(null); setActiveSub(null); setPage(1); }}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition ${!activeCat ? "text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              style={!activeCat ? { background: "#FE6972" } : {}}
            >
              <Sparkles className="w-3.5 h-3.5" />All Products
            </button>
            {categories.map(cat => {
              const active = activeCat === cat.id;
              return (
                <button key={cat.id}
                  onClick={() => { setActiveCat(active ? null : cat.id); setActiveSub(null); setPage(1); }}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition ${active ? "text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  style={active ? { background: cat.color || "#FE6972" } : {}}
                >
                  {cat.name}
                  {cat.product_count ? (
                    <span className={`text-[10px] ${active ? "opacity-75" : "text-gray-400"}`}>
                      ({cat.product_count})
                    </span>
                  ) : null}
                </button>
              );
            })}
            {/* Advertise CTA in pill bar */}
            <button
              onClick={() => setShowAdModal(true)}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white transition ml-2"
              style={{ background: "linear-gradient(135deg,#D4AF37,#b8920a)" }}
            >
              <Megaphone className="w-3.5 h-3.5" />Advertise Here
            </button>
          </div>
        </div>
      </section>

      {/* ── SUBCATEGORY PILLS ────────────────────────────────── */}
      {selectedCat?.subcategories && selectedCat.subcategories.length > 0 && (
        <section className="bg-[#FFF8F3] px-6 py-3 border-b border-orange-100">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-2">
            <button onClick={() => { setActiveSub(null); setPage(1); }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${!activeSub ? "bg-[#FE6972] text-white" : "bg-white text-gray-500 border border-gray-200"}`}>
              All {selectedCat.name}
            </button>
            {selectedCat.subcategories.map(sub => (
              <button key={sub.id}
                onClick={() => { setActiveSub(activeSub === sub.id ? null : sub.id); setPage(1); }}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${activeSub === sub.id ? "bg-[#FE6972] text-white" : "bg-white text-gray-500 border border-gray-200"}`}>
                {sub.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── CITY + COUNT BAR ─────────────────────────────────── */}
      <section className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1 flex-wrap">
            <MapPin className="w-4 h-4 text-gray-400" />
            {CITIES.map(c => (
              <button key={c} onClick={() => { setCity(c); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${city === c ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {isFiltered && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeCat && (
                  <span className="px-2 py-1 rounded-lg bg-pink-100 text-[#FE6972] text-xs font-semibold flex items-center gap-1">
                    {selectedCat?.name}
                    <button onClick={() => { setActiveCat(null); setActiveSub(null); setPage(1); }}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {city !== "All Cities" && (
                  <span className="px-2 py-1 rounded-lg bg-pink-100 text-[#FE6972] text-xs font-semibold flex items-center gap-1">
                    {city}<button onClick={() => { setCity("All Cities"); setPage(1); }}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {search && (
                  <span className="px-2 py-1 rounded-lg bg-pink-100 text-[#FE6972] text-xs font-semibold flex items-center gap-1">
                    "{search}"<button onClick={() => { setSearch(""); setPage(1); }}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {priceRange > 0 && (
                  <span className="px-2 py-1 rounded-lg bg-pink-100 text-[#FE6972] text-xs font-semibold flex items-center gap-1">
                    {priceFilter.label}<button onClick={() => { setPriceRange(0); setPage(1); }}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}
            <span className="text-xs text-gray-400">{total} products{isFiltered ? " (filtered)" : ""}</span>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      {loading ? (
        <div className="max-w-7xl mx-auto px-6 pb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>

      ) : products.length === 0 ? (
        <div className="text-center py-20 px-6">
          <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-pink-200" />
          </div>
          <p className="text-gray-700 font-semibold mb-1">No products found</p>
          <p className="text-gray-400 text-sm mb-4">Try adjusting your filters or search term</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {activeCat   && <button onClick={() => { setActiveCat(null); setActiveSub(null); }} className="px-4 py-2 rounded-xl bg-pink-50 text-[#FE6972] text-xs font-bold">Clear category</button>}
            {city !== "All Cities" && <button onClick={() => setCity("All Cities")} className="px-4 py-2 rounded-xl bg-pink-50 text-[#FE6972] text-xs font-bold">All cities</button>}
            {search      && <button onClick={() => setSearch("")}     className="px-4 py-2 rounded-xl bg-pink-50 text-[#FE6972] text-xs font-bold">Clear search</button>}
            {priceRange > 0 && <button onClick={() => setPriceRange(0)} className="px-4 py-2 rounded-xl bg-pink-50 text-[#FE6972] text-xs font-bold">Any price</button>}
          </div>
        </div>

      ) : !isFiltered ? (
        /* Discovery mode — sectioned rows */
        <div className="pb-16">
          {featured.length > 0 && (
            <ProductRow title="Featured Products" icon="🔥" products={featured} savedMap={saved} onToggleSave={toggleSave} />
          )}
          {/* Advertise banner between sections */}
          <div className="max-w-7xl mx-auto px-6 mb-10">
            <div className="rounded-2xl p-6 flex items-center gap-6 flex-wrap"
              style={{ background: "linear-gradient(135deg,#FFF8E1,#FFF3E0)", border: "1px solid #FFE082" }}>
              <div className="text-3xl">📣</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">Advertise Your Wedding Products</p>
                <p className="text-xs text-gray-500 mt-0.5">Reach thousands of couples — paid listings start from EGP 299/month</p>
              </div>
              <button onClick={() => setShowAdModal(true)}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-bold transition shrink-0"
                style={{ background: "#E65100" }}>
                Get Listed
              </button>
            </div>
          </div>
          {budgetPicks.length > 0 && (
            <ProductRow title="Budget-Friendly Picks" icon="💰" products={budgetPicks} savedMap={saved} onToggleSave={toggleSave} />
          )}
          {products.length > 4 && (
            <div className="px-6 max-w-7xl mx-auto">
              <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-4 flex items-center gap-2">
                🌸 All Products <span className="text-base text-gray-400 font-normal not-italic">({total})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map(p => (
                  <ProductCard key={p.id} product={p} saved={saved[p.id] || false} onToggleSave={() => toggleSave(p.id)} />
                ))}
              </div>
            </div>
          )}
        </div>

      ) : (
        /* Filtered mode — flat grid */
        <div className="max-w-7xl mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(p => (
              <ProductCard key={p.id} product={p} saved={saved[p.id] || false} onToggleSave={() => toggleSave(p.id)} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                <button key={pg} onClick={() => setPage(pg)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition ${page === pg ? "text-white shadow" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}
                  style={page === pg ? { background: "#FE6972" } : {}}>
                  {pg}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ADVERTISE MODAL ──────────────────────────────────── */}
      {showAdModal && <AdvertiseModal onClose={() => setShowAdModal(false)} />}
    </div>
  );
}
