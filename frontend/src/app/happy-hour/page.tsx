"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Clock, MapPin, Star, Heart, Search, Sparkles, Percent, Gift,
  ChevronRight, Filter, Zap, Crown, Check, Users, Wine, Coffee,
  UtensilsCrossed, Music, Sun, Moon, Tag, TrendingUp, Timer, Flame
} from "lucide-react";

const API = "http://localhost:9000";
const CITIES = ["All", "Cairo", "Alexandria", "Giza", "Hurghada"];
const TYPES = ["All", "Lounge", "Beach Club", "Cafe", "Fine Dining", "Rooftop"];
const TODAY_NAME = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];
const TYPE_ICONS: Record<string, any> = { Lounge: Wine, "Beach Club": Sun, Cafe: Coffee, "Fine Dining": UtensilsCrossed, Rooftop: Moon };

interface Offer {
  id: string; vendor_id: string; business_name: string; business_name_ar?: string;
  city: string; description: string; cover_image?: string; rating: number; reviews_count: number;
  plan_type: string; is_featured: boolean; restaurant_type: string;
  days: string[]; start_time: string; end_time: string;
  discount_type: string; discount_value: number; offer_description: string;
  menu_types: string[];
}

function getTimeRemaining(endTime: string) {
  const now = new Date();
  const [h, m] = (endTime || "23:59").split(":").map(Number);
  const end = new Date(); end.setHours(h, m, 0);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return null;
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return { hrs, mins, text: `${hrs}h ${mins}m left` };
}

export default function HappyHourPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("All");
  const [type, setType] = useState("All");
  const [timeFilter, setTimeFilter] = useState("all");
  const [coupleMode, setCoupleMode] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`${API}/api/services/happy-hour`)
      .then(r => r.json())
      .then(d => { if (d.success) setOffers(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const isLive = (o: Offer) => {
    if (!o.days?.includes(TODAY_NAME)) return false;
    const [sh, sm] = (o.start_time || "00:00").split(":").map(Number);
    const [eh, em] = (o.end_time || "23:59").split(":").map(Number);
    return currentTime >= sh * 60 + sm && currentTime <= eh * 60 + em;
  };
  const isToday = (o: Offer) => o.days?.includes(TODAY_NAME);
  const isWeekend = (o: Offer) => o.days?.includes("Fri") || o.days?.includes("Sat");

  const filtered = useMemo(() => {
    let r = offers;
    if (city !== "All") r = r.filter(o => o.city === city);
    if (type !== "All") r = r.filter(o => o.restaurant_type === type);
    if (timeFilter === "live") r = r.filter(o => isLive(o));
    if (timeFilter === "today") r = r.filter(o => isToday(o));
    if (timeFilter === "weekend") r = r.filter(o => isWeekend(o));
    return r.sort((a, b) => {
      if (isLive(a) && !isLive(b)) return -1;
      if (!isLive(a) && isLive(b)) return 1;
      if (a.is_featured && !b.is_featured) return -1;
      return b.rating - a.rating;
    });
  }, [offers, city, type, timeFilter]);

  const liveCount = offers.filter(o => isLive(o)).length;
  const toggleSave = (id: string) => setSaved(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const fmtDiscount = (o: Offer) => o.discount_type === "percentage" ? `${o.discount_value}% OFF` : o.discount_type === "bogo" ? "BUY 1 GET 1" : o.discount_type === "fixed" ? `${o.discount_value} EGP OFF` : "SPECIAL";

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-12 px-6">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#FFF8F3]" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs text-white/90 font-semibold mb-5 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />Deals & Experiences for Couples
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white italic mb-3">Happy Hour</h1>
          <p className="text-white/70 text-lg mb-6">Amazing deals at the best restaurants, lounges & cafes</p>

          {/* Time filters */}
          <div className="flex justify-center gap-2 mb-4">
            {[
              { id: "all", label: "All Deals", icon: Tag },
              { id: "live", label: `Live Now (${liveCount})`, icon: Flame },
              { id: "today", label: "Today", icon: Sun },
              { id: "weekend", label: "Weekend", icon: Music },
            ].map(f => {
              const Icon = f.icon;
              return (
                <button key={f.id} onClick={() => setTimeFilter(f.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition ${
                    timeFilter === f.id ? "bg-white text-orange-600 shadow-lg" : "bg-white/15 text-white/80 hover:bg-white/25"
                  } ${f.id === "live" && liveCount > 0 && timeFilter !== "live" ? "animate-pulse" : ""}`}>
                  <Icon className="w-3.5 h-3.5" />{f.label}
                </button>
              );
            })}
          </div>

          {/* Couple toggle */}
          <button onClick={() => setCoupleMode(!coupleMode)}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition ${coupleMode ? "bg-[#FE6972] text-white" : "bg-white/10 text-white/70 border border-white/20"}`}>
            <Heart className={`w-3.5 h-3.5 ${coupleMode ? "fill-white" : ""}`} />
            {coupleMode ? "Couple Mode ON" : "For Couples"}
          </button>
        </div>
      </section>

      {/* Category/City filters */}
      <section className="bg-white border-b border-gray-100 px-6 py-3 sticky top-16 z-20">
        <div className="max-w-5xl mx-auto flex items-center gap-3 overflow-x-auto">
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          {CITIES.map(c => (
            <button key={c} onClick={() => setCity(c)} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${city === c ? "text-white" : "text-gray-500 hover:bg-gray-50"}`} style={city === c ? { background: "#f97316" } : {}}>
              {c === "All" ? "All Cities" : c}
            </button>
          ))}
          <div className="w-px h-5 bg-gray-200 shrink-0" />
          {TYPES.map(t => (
            <button key={t} onClick={() => setType(t)} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${type === t ? "text-white" : "text-gray-500 hover:bg-gray-50"}`} style={type === t ? { background: "#f97316" } : {}}>
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Cards Grid */}
      <section className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-sm text-gray-500 mb-5">{filtered.length} deal{filtered.length !== 1 ? "s" : ""}</p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16"><Wine className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-gray-500 text-sm">No deals match your filters</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(offer => {
              const live = isLive(offer);
              const remaining = live ? getTimeRemaining(offer.end_time) : null;
              const TypeIcon = TYPE_ICONS[offer.restaurant_type] || UtensilsCrossed;
              const fakeBookings = Math.floor(offer.reviews_count * 0.15) + 3;
              return (
                <div key={offer.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all">
                  <div className="relative h-44 overflow-hidden">
                    <img src={offer.cover_image || "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400"} alt={offer.business_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    {live && <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-white animate-pulse" style={{ background: "#ef4444" }}><span className="w-1.5 h-1.5 rounded-full bg-white" />LIVE NOW</div>}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: "#f97316" }}>{fmtDiscount(offer)}</div>

                    <button onClick={() => toggleSave(offer.id)} className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                      <Heart className={`w-4 h-4 ${saved.has(offer.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
                    </button>

                    <div className="absolute bottom-3 left-3 flex gap-1.5">
                      <span className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-semibold text-gray-700"><TypeIcon className="w-3 h-3" />{offer.restaurant_type}</span>
                      {offer.is_featured && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: "#D4AF37" }}>Featured</span>}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-orange-600 transition">{offer.business_name}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-2">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{offer.city}</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />{offer.rating} ({offer.reviews_count})</span>
                    </div>

                    <div className="bg-orange-50 rounded-xl p-3 mb-3">
                      <p className="text-xs font-bold text-orange-800 mb-1">{offer.offer_description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] text-orange-600">
                          <Clock className="w-3 h-3" />
                          <span>{offer.start_time?.substring(0,5)} - {offer.end_time?.substring(0,5)}</span>
                        </div>
                        {live && remaining && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-600"><Timer className="w-3 h-3" />{remaining.text}</span>
                        )}
                      </div>
                    </div>

                    {/* Social proof */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex items-center gap-1 text-[10px] text-orange-600 font-semibold"><Flame className="w-3 h-3" />{fakeBookings} booked today</span>
                      {coupleMode && <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#FE6972" }}><Heart className="w-3 h-3 fill-current" />Perfect for couples</span>}
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/services/${offer.vendor_id}`} className="flex-1 py-2 rounded-xl text-xs font-bold text-center text-white transition" style={{ background: "#f97316" }}>View Deal</Link>
                      <button className="py-2 px-3 rounded-xl text-xs font-semibold border transition" style={{ color: "#f97316", borderColor: "#f97316" }}>Book</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Wedding Cross-sell */}
        <div className="mt-12 rounded-2xl p-8 text-center overflow-hidden relative">
          <div className="absolute inset-0"><img src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1200" alt="" className="w-full h-full object-cover" /><div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(254,105,114,0.9), rgba(212,74,84,0.9))" }} /></div>
          <div className="relative">
            <h2 className="font-serif text-2xl font-bold text-white italic mb-2">Planning Your Wedding?</h2>
            <p className="text-white/70 text-sm mb-5">Discover exclusive vendor offers and start planning your dream day</p>
            <Link href="/plan" className="inline-flex items-center gap-2 bg-white px-8 py-3 rounded-full text-sm font-bold transition shadow-lg" style={{ color: "#FE6972" }}>
              <Sparkles className="w-4 h-4" />Start Planning
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
