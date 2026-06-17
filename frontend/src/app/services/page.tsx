"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search, MapPin, Star, X, Crown, Zap, Check,
  Camera, Music, Palette, ClipboardList, Sparkles, Mail,
  Cake, Utensils, Car, Globe, Shield, Gift, Heart,
  ChevronRight, Eye, Filter, ArrowUpDown, TrendingUp,
  Flame, Verified, MessageCircle, Clock, DollarSign, CreditCard,
  SlidersHorizontal, ChevronDown, Bookmark, Zap as ZapIcon
} from "lucide-react";

const API = "http://localhost:9000";

const ICONS: Record<string, any> = {
  Camera, Music, Palette, ClipboardList, Sparkles, Mail,
  Cake, Utensils, Car, Globe, Shield, Gift, Heart,
};

const PLANS: Record<string, { label: string; color: string; icon: any; priority: number }> = {
  TOP:   { label: "Top",   color: "#D4AF37", icon: Crown,   priority: 4 },
  PRO:   { label: "Pro",   color: "#6366f1", icon: Zap,     priority: 3 },
  BASIC: { label: "Basic", color: "#22c55e", icon: Check,   priority: 2 },
  LITE:  { label: "Lite",  color: "#94a3b8", icon: null,    priority: 1 },
};

const CITIES = ["All Cities", "Cairo", "Alexandria", "Giza", "Hurghada"];
const PRICE_RANGES = [
  { label: "Any Budget", min: 0, max: 999999 },
  { label: "Under 3,000 EGP", min: 0, max: 3000 },
  { label: "3,000–8,000 EGP", min: 3000, max: 8000 },
  { label: "8,000–20,000 EGP", min: 8000, max: 20000 },
  { label: "20,000+ EGP", min: 20000, max: 999999 },
];

interface Cat { id: string; name: string; name_ar?: string; slug: string; icon: string; color: string; vendor_count?: number; subcategories?: Sub[]; }
interface Sub { id: string; name: string; slug: string; }
interface Vendor {
  id: string; business_name: string; category_id: string; category_name?: string; category_color?: string;
  city?: string; price_min?: number; plan_type: string; rating: number; reviews_count: number;
  profile_views: number; is_featured: boolean; is_verified: boolean; description?: string;
  cover_image?: string; experience_years?: number; response_time_hours?: number;
}

// Skeleton loader card
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

// Vendor card component
function VendorCard({ vendor: v, saved, onToggleSave }: { vendor: Vendor; saved: boolean; onToggleSave: () => void }) {
  const plan = PLANS[v.plan_type] || PLANS.LITE;
  const PlanIcon = plan.icon;
  const coverImg = v.cover_image || `https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=70`;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#FE6972]/30 hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Cover image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={coverImg}
          alt={v.business_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {PlanIcon && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold text-white shadow" style={{ background: plan.color }}>
              <PlanIcon className="w-3 h-3" />{plan.label}
            </span>
          )}
          {v.is_featured && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-[#FE6972] text-white shadow">
              <Flame className="w-3 h-3" />Featured
            </span>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition"
        >
          <Heart className={`w-4 h-4 ${saved ? "fill-[#FE6972] text-[#FE6972]" : "text-gray-500"}`} />
        </button>

        {/* Price bottom left */}
        {v.price_min && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg">
              From {Number(v.price_min).toLocaleString()} EGP
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#FE6972] transition line-clamp-1">{v.business_name}</h3>
          {v.is_verified && <Shield className="w-4 h-4 shrink-0 text-green-500" />}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          {v.category_name && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: v.category_color || "#FE6972" }} />
              {v.category_name}
            </span>
          )}
          {v.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{v.city}</span>}
        </div>

        {v.description && (
          <p className="text-[11px] text-gray-400 line-clamp-2 mb-3 flex-1">{v.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
            <span className="text-xs font-bold text-gray-900">{v.rating}</span>
            <span className="text-[10px] text-gray-400">({v.reviews_count})</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{v.profile_views}</span>
            {v.experience_years && v.experience_years > 0 && (
              <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{v.experience_years}y</span>
            )}
          </div>
        </div>

        {/* Financing badge */}
        {v.price_min && v.price_min > 3000 && (
          <div className="flex items-center gap-1 mb-3 px-2 py-1 rounded-lg bg-purple-50 text-purple-700">
            <CreditCard className="w-3 h-3" />
            <span className="text-[10px] font-semibold">From {Math.round(v.price_min / 12).toLocaleString()} EGP/month</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Link href={`/services/${v.id}`} className="flex-1 py-2 rounded-xl text-xs font-bold text-center transition" style={{ background: "#FE6972", color: "#fff" }}>
            View Profile
          </Link>
          <Link href={`/services/${v.id}`} className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
            <MessageCircle className="w-4 h-4 text-gray-500" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Section: horizontal scroll row
function VendorRow({ title, icon, vendors, savedMap, onToggleSave }: any) {
  if (!vendors.length) return null;
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4 px-6 max-w-7xl mx-auto">
        <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-gray-900 italic">
          <span>{icon}</span>{title}
        </h2>
        <Link href="/services" className="text-xs font-semibold flex items-center gap-1" style={{ color: "#FE6972" }}>
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {vendors.slice(0, 4).map((v: Vendor) => (
          <VendorCard key={v.id} vendor={v} saved={savedMap[v.id] || false} onToggleSave={() => onToggleSave(v.id)} />
        ))}
      </div>
    </div>
  );
}

export default function ServicesDiscovery() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [city, setCity] = useState("All Cities");
  const [sort, setSort] = useState("best_match");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [savedVendors, setSavedVendors] = useState<Record<string, boolean>>({});
  const [priceRange, setPriceRange] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API}/api/services/categories?includeSubcategories=true`)
      .then(r => r.json()).then(d => { if (d.success) setCats(d.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (activeCat) p.set("category", activeCat);
    if (activeSub) p.set("subcategory", activeSub);
    if (city !== "All Cities") p.set("city", city);
    p.set("sortBy", sort);
    p.set("page", page.toString());
    p.set("limit", "24");
    fetch(`${API}/api/services/vendors?${p}`)
      .then(r => r.json())
      .then(d => { setVendors(d.data || []); setTotal(d.pagination?.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeCat, activeSub, city, sort, page]);

  const toggleSave = useCallback((id: string) => {
    setSavedVendors(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const selectedCat = cats.find(c => c.id === activeCat);
  const totalPages = Math.ceil(total / 24);
  const isFiltered = !!(activeCat || city !== "All Cities" || search || priceRange > 0);

  const priceFilter = PRICE_RANGES[priceRange];
  const displayed = useMemo(() => {
    let list = vendors;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(v => v.business_name?.toLowerCase().includes(q) || v.category_name?.toLowerCase().includes(q) || v.city?.toLowerCase().includes(q));
    }
    if (priceRange > 0) {
      list = list.filter(v => !v.price_min || (v.price_min >= priceFilter.min && v.price_min <= priceFilter.max));
    }
    return list;
  }, [vendors, search, priceRange]);

  const featuredVendors = useMemo(() => displayed.filter(v => v.is_featured || v.plan_type === 'TOP'), [displayed]);
  const topRated = useMemo(() => [...displayed].sort((a, b) => b.rating - a.rating).slice(0, 8), [displayed]);
  const budgetFriendly = useMemo(() => displayed.filter(v => v.price_min && v.price_min < 5000), [displayed]);

  return (
    <div className="min-h-screen" style={{ background: "#F9FAFB" }}>

      {/* ═══ HERO ═══ */}
      <section className="relative pt-16 pb-10 overflow-hidden" style={{ minHeight: 340 }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center 40%",
          }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(254,105,114,0.85) 0%, rgba(180,50,60,0.75) 100%)" }} />

        <div className="relative max-w-4xl mx-auto px-6 text-center pt-10 pb-4">
          <p className="text-white/70 text-sm font-medium mb-2 tracking-widest uppercase">Rose Bazaar</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white italic mb-3">
            {selectedCat ? selectedCat.name : "Find Your Perfect Wedding Vendor"}
          </h1>
          <p className="text-white/75 text-sm md:text-base mb-8">
            {selectedCat
              ? `${total} verified ${selectedCat.name.toLowerCase()} vendors`
              : `Discover ${total} verified wedding vendors across Egypt`}
          </p>

          {/* Search bar */}
          <div className="flex gap-2 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 flex-1 shadow-xl">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search photographers, venues, makeup..."
                className="bg-transparent outline-none text-sm text-gray-700 w-full placeholder:text-gray-400"
              />
              {search && <button onClick={() => setSearch("")}><X className="w-4 h-4 text-gray-400 hover:text-gray-600" /></button>}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-2xl px-4 py-3.5 flex items-center gap-2 text-sm font-semibold hover:bg-white/30 transition shadow-xl"
            >
              <SlidersHorizontal className="w-4 h-4" />Filters
            </button>
          </div>

          {/* Trending tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["Photography", "Venues", "Makeup", "Catering", "DJ & Music"].map(tag => (
              <button
                key={tag}
                onClick={() => setSearch(tag === search ? "" : tag)}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition"
                style={{ background: search === tag ? "#fff" : "rgba(255,255,255,0.15)", color: search === tag ? "#FE6972" : "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FILTER PANEL (collapsible) ═══ */}
      {showFilters && (
        <section className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Price Range</p>
              <div className="flex gap-1.5">
                {PRICE_RANGES.map((range, i) => (
                  <button key={i} onClick={() => setPriceRange(i)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${priceRange === i ? "bg-[#FE6972] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Sort By</p>
              <div className="flex gap-1.5">
                {[["best_match","Best Match"],["rating","Top Rated"],["price_asc","Price ↑"],["price_desc","Price ↓"],["popular","Trending"]].map(([val, label]) => (
                  <button key={val} onClick={() => setSort(val)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${sort === val ? "bg-[#FE6972] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ CATEGORY PILLS ═══ */}
      <section className="bg-white border-b border-gray-100 sticky top-[63px] z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto">
          <div className="flex gap-1 py-3 min-w-max">
            <button onClick={() => { setActiveCat(null); setActiveSub(null); setPage(1); }} className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition ${!activeCat ? "text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`} style={!activeCat ? { background: "#FE6972" } : {}}>
              <Sparkles className="w-3.5 h-3.5" />All Services
            </button>
            {cats.map(cat => {
              const Icon = ICONS[cat.icon] || Sparkles;
              const active = activeCat === cat.id;
              return (
                <button key={cat.id} onClick={() => { setActiveCat(active ? null : cat.id); setActiveSub(null); setPage(1); }}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition ${active ? "text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  style={active ? { background: cat.color || "#FE6972" } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />{cat.name}
                  {cat.vendor_count ? <span className={`text-[10px] ${active ? "opacity-75" : "text-gray-400"}`}>({cat.vendor_count})</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ SUBCATEGORY PILLS ═══ */}
      {selectedCat?.subcategories && selectedCat.subcategories.length > 0 && (
        <section className="bg-[#FFF8F3] px-6 py-3 border-b border-orange-100">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-2">
            <button onClick={() => { setActiveSub(null); setPage(1); }} className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${!activeSub ? "bg-[#FE6972] text-white" : "bg-white text-gray-500 border border-gray-200"}`}>
              All {selectedCat.name}
            </button>
            {selectedCat.subcategories.map(sub => (
              <button key={sub.id} onClick={() => { setActiveSub(activeSub === sub.id ? null : sub.id); setPage(1); }} className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${activeSub === sub.id ? "bg-[#FE6972] text-white" : "bg-white text-gray-500 border border-gray-200"}`}>
                {sub.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ═══ CITY + COUNT BAR ═══ */}
      <section className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-gray-400" />
            {CITIES.map(c => (
              <button key={c} onClick={() => { setCity(c); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${city === c ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                {c}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400">{displayed.length} vendors{isFiltered ? " (filtered)" : ""}</span>
        </div>
      </section>

      {/* ═══ MAIN CONTENT ═══ */}
      {loading ? (
        <div className="max-w-7xl mx-auto px-6 pb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 px-6">
          <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-4"><Search className="w-8 h-8 text-pink-200" /></div>
          <p className="text-gray-700 font-semibold mb-1">No vendors found</p>
          <p className="text-gray-400 text-sm mb-4">Try adjusting your filters or search term</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {activeCat && <button onClick={() => setActiveCat(null)} className="px-4 py-2 rounded-xl bg-pink-50 text-[#FE6972] text-xs font-bold">Clear category</button>}
            {city !== "All Cities" && <button onClick={() => setCity("All Cities")} className="px-4 py-2 rounded-xl bg-pink-50 text-[#FE6972] text-xs font-bold">All cities</button>}
            {search && <button onClick={() => setSearch("")} className="px-4 py-2 rounded-xl bg-pink-50 text-[#FE6972] text-xs font-bold">Clear search</button>}
            {priceRange > 0 && <button onClick={() => setPriceRange(0)} className="px-4 py-2 rounded-xl bg-pink-50 text-[#FE6972] text-xs font-bold">Any price</button>}
          </div>
        </div>
      ) : !isFiltered ? (
        /* ═══ DISCOVERY MODE (no filters) — show sections ═══ */
        <div className="pb-16">
          {featuredVendors.length > 0 && (
            <VendorRow title="Featured Vendors" icon="🔥" vendors={featuredVendors} savedMap={savedVendors} onToggleSave={toggleSave} />
          )}
          <VendorRow title="Top Rated" icon="⭐" vendors={topRated} savedMap={savedVendors} onToggleSave={toggleSave} />
          {budgetFriendly.length > 0 && (
            <VendorRow title="Budget-Friendly Picks" icon="💰" vendors={budgetFriendly} savedMap={savedVendors} onToggleSave={toggleSave} />
          )}
          {/* Show remaining in flat grid */}
          {displayed.length > 8 && (
            <div className="px-6 max-w-7xl mx-auto">
              <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-4 flex items-center gap-2">
                🌸 All Vendors <span className="text-base text-gray-400 font-normal not-italic">({total})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayed.map(v => <VendorCard key={v.id} vendor={v} saved={savedVendors[v.id] || false} onToggleSave={() => toggleSave(v.id)} />)}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ═══ FILTERED MODE — flat grid ═══ */
        <div className="max-w-7xl mx-auto px-6 pb-16">
          {isFiltered && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-gray-500">{displayed.length} results for:</span>
              {activeCat && <span className="px-2 py-1 rounded-lg bg-pink-100 text-[#FE6972] text-xs font-semibold flex items-center gap-1">{selectedCat?.name}<button onClick={() => setActiveCat(null)}><X className="w-3 h-3" /></button></span>}
              {city !== "All Cities" && <span className="px-2 py-1 rounded-lg bg-pink-100 text-[#FE6972] text-xs font-semibold flex items-center gap-1">{city}<button onClick={() => setCity("All Cities")}><X className="w-3 h-3" /></button></span>}
              {search && <span className="px-2 py-1 rounded-lg bg-pink-100 text-[#FE6972] text-xs font-semibold flex items-center gap-1">"{search}"<button onClick={() => setSearch("")}><X className="w-3 h-3" /></button></span>}
              {priceRange > 0 && <span className="px-2 py-1 rounded-lg bg-pink-100 text-[#FE6972] text-xs font-semibold flex items-center gap-1">{priceFilter.label}<button onClick={() => setPriceRange(0)}><X className="w-3 h-3" /></button></span>}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayed.map(v => <VendorCard key={v.id} vendor={v} saved={savedVendors[v.id] || false} onToggleSave={() => toggleSave(v.id)} />)}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-xs font-bold transition ${page === p ? "text-white shadow" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`} style={page === p ? { background: "#FE6972" } : {}}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
