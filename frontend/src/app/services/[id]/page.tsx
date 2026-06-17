"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ChatDialog from "@/components/ChatDialog";
import {
  Star, MapPin, Check, Crown, Zap, Clock, Calendar, Users,
  Heart, Share2, ChevronLeft, ChevronRight, X, MessageCircle,
  Mail, Phone, Award, Shield, Eye, Sparkles, ChevronDown,
  Send, Camera, DollarSign, ArrowRight
} from "lucide-react";

const API = "http://localhost:9000";

const PLANS: Record<string, { label: string; color: string; icon: any }> = {
  TOP: { label: "Top Vendor", color: "#D4AF37", icon: Crown },
  PRO: { label: "Pro", color: "#6366f1", icon: Zap },
  BASIC: { label: "Basic", color: "#22c55e", icon: Check },
  LITE: { label: "Lite", color: "#94a3b8", icon: null },
};

export default function VendorProfile() {
  const { id } = useParams();
  const [vendor, setVendor] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [styles, setStyles] = useState<any[]>([]);
  const [similar, setSimilar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    // Fetch vendor profile
    fetch(`${API}/api/services/vendors/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setVendor(d.data); setLoading(false); })
      .catch(() => setLoading(false));

    // Fetch related data
    fetch(`${API}/api/services/vendors/${id}/portfolio`).then(r=>r.json()).then(d=>{ if(d.success) setPortfolio(d.data||[]); }).catch(()=>{});
    fetch(`${API}/api/services/vendors/${id}/reviews`).then(r=>r.json()).then(d=>{ if(d.success) { setReviews(d.data?.reviews||d.data||[]); } }).catch(()=>{});

    // Fetch packages, services, faqs, awards, styles from extended endpoint
    fetch(`${API}/api/services/vendors/${id}/packages`).then(r=>r.json()).then(d=>{ if(d.success) setPackages(d.data||[]); }).catch(()=>{});
    fetch(`${API}/api/services/vendors/${id}/services-list`).then(r=>r.json()).then(d=>{ if(d.success) setServices(d.data||[]); }).catch(()=>{});
    fetch(`${API}/api/services/vendors/${id}/faqs`).then(r=>r.json()).then(d=>{ if(d.success) setFaqs(d.data||[]); }).catch(()=>{});
    fetch(`${API}/api/services/vendors/${id}/awards`).then(r=>r.json()).then(d=>{ if(d.success) setAwards(d.data||[]); }).catch(()=>{});
    fetch(`${API}/api/services/vendors/${id}/styles`).then(r=>r.json()).then(d=>{ if(d.success) setStyles(d.data||[]); }).catch(()=>{});

    // Similar vendors
    fetch(`${API}/api/services/vendors?limit=4`).then(r=>r.json()).then(d=>{ if(d.success) setSimilar((d.data||[]).filter((v:any)=>v.id!==id).slice(0,3)); }).catch(()=>{});
  }, [id]);

  const plan = vendor ? (PLANS[vendor.plan_type] || PLANS.LITE) : PLANS.LITE;
  const PlanIcon = plan.icon;

  const handleQuoteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await fetch(`${API}/api/services/vendors/${id}/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventDate: form.get("date"),
          guestCount: parseInt(form.get("guests") as string) || null,
          budgetMin: parseInt(form.get("budget") as string) || null,
          message: form.get("message"),
        }),
      });
      setQuoteSent(true);
      setTimeout(() => { setQuoteSent(false); setShowQuoteForm(false); }, 3000);
    } catch { setQuoteSent(true); }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-pulse text-center">
        <div className="w-16 h-16 rounded-full bg-pink-100 mx-auto mb-4" />
        <div className="h-4 w-48 bg-gray-100 rounded mx-auto" />
      </div>
    </div>
  );

  if (!vendor) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Vendor not found</p>
        <Link href="/services" className="text-sm font-semibold" style={{ color: "#FE6972" }}>← Back to Services</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* ═══ 1. HERO ═══ */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src={vendor.cover_image || "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200"}
          alt={vendor.business_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Back button */}
        <Link href="/services" className="absolute top-24 left-6 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition">
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </Link>

        {/* Save + Share */}
        <div className="absolute top-24 right-6 flex gap-2">
          <button onClick={() => setSaved(!saved)} className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition">
            <Heart className={`w-5 h-5 ${saved ? "fill-red-500 text-red-500" : "text-gray-700"}`} />
          </button>
          <button className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition">
            <Share2 className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {PlanIcon && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: plan.color }}>
                  <PlanIcon className="w-3.5 h-3.5" />{plan.label}
                </span>
              )}
              {vendor.is_verified && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white">
                  <Shield className="w-3.5 h-3.5" />Verified
                </span>
              )}
              {vendor.is_featured && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37]/80 text-white">
                  <Sparkles className="w-3.5 h-3.5" />Featured
                </span>
              )}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-2 italic">{vendor.business_name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
              <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />{vendor.rating} ({vendor.reviews_count} reviews)</span>
              {vendor.city && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{vendor.city}</span>}
              {vendor.category_name && <span className="flex items-center gap-1"><Camera className="w-4 h-4" />{vendor.category_name}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2-COLUMN LAYOUT ═══ */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ═══ LEFT COLUMN (70%) ═══ */}
          <div className="flex-1 min-w-0 space-y-10">

            {/* ── TRUST BAND ── */}
            <div className="flex flex-wrap gap-3">
              {vendor.is_verified && <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 text-green-700 text-xs font-semibold"><Check className="w-4 h-4" />Verified Vendor</span>}
              {vendor.experience_years > 0 && <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold"><Award className="w-4 h-4" />{vendor.experience_years} Years Experience</span>}
              {vendor.response_time_hours && <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-semibold"><Clock className="w-4 h-4" />Responds in {vendor.response_time_hours}h</span>}
              {vendor.completed_bookings > 0 && <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold"><Calendar className="w-4 h-4" />{vendor.completed_bookings} Bookings</span>}
              <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-50 text-pink-700 text-xs font-semibold"><Eye className="w-4 h-4" />{vendor.profile_views} Views</span>
            </div>

            {/* ── ABOUT ── */}
            {vendor.bio && (
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-3">About {vendor.business_name}</h2>
                <p className="text-gray-600 leading-relaxed text-sm">{vendor.bio}</p>
                {vendor.languages?.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-semibold">Languages:</span>{vendor.languages.join(", ")}
                  </div>
                )}
                {vendor.locations_served?.length > 0 && (
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-semibold">Serves:</span>{vendor.locations_served.join(", ")}
                  </div>
                )}
              </div>
            )}

            {/* ── PACKAGES ── */}
            {packages.length > 0 && (
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-4">Packages & Pricing</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {packages.map((pkg: any, i: number) => (
                    <div key={pkg.id || i} className={`rounded-2xl p-5 border transition hover:shadow-lg ${pkg.is_popular ? "border-[#FE6972] bg-[#FE6972]/5 shadow-md" : "border-gray-200 bg-white"}`}>
                      {pkg.is_popular && <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#FE6972" }}>Most Popular</span>}
                      <h3 className="font-serif font-bold text-lg text-gray-900 italic">{pkg.name}</h3>
                      <div className="text-2xl font-bold text-gray-900 mt-1">{Number(pkg.price).toLocaleString()} <span className="text-xs font-normal text-gray-400">{pkg.currency || "EGP"}</span></div>
                      <ul className="mt-3 space-y-1.5">
                        {(pkg.includes || []).map((item: string, j: number) => (
                          <li key={j} className="flex items-center gap-2 text-xs text-gray-600"><Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#FE6972" }} />{item}</li>
                        ))}
                      </ul>
                      <button onClick={() => setShowQuoteForm(true)} className="mt-4 w-full py-2 rounded-xl text-xs font-bold transition" style={{ background: pkg.is_popular ? "#FE6972" : "transparent", color: pkg.is_popular ? "white" : "#FE6972", border: pkg.is_popular ? "none" : "1px solid #FE6972" }}>
                        Request This Package
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SERVICES ── */}
            {services.length > 0 && (
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-3">Services & Features</h2>
                <div className="grid grid-cols-2 gap-2">
                  {services.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 shrink-0" style={{ color: s.included ? "#22c55e" : "#d1d5db" }} />
                      <span className={s.included ? "text-gray-700" : "text-gray-400 line-through"}>{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── STYLES ── */}
            {styles.length > 0 && (
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-3">Style & Specialization</h2>
                <div className="flex flex-wrap gap-2">
                  {styles.map((s: any, i: number) => (
                    <span key={i} className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">{s.style}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ── AWARDS ── */}
            {awards.length > 0 && (
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-3">Awards & Recognition</h2>
                <div className="space-y-2">
                  {awards.map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-amber-50 rounded-xl px-4 py-3">
                      <Award className="w-5 h-5 text-[#D4AF37] shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                        {a.year && <p className="text-xs text-gray-400">{a.year}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── REVIEWS ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl font-bold text-gray-900 italic">Reviews</h2>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                  <span className="font-bold text-gray-900">{vendor.rating}</span>
                  <span className="text-gray-400">({vendor.reviews_count} reviews)</span>
                </div>
              </div>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r: any, i: number) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-xs font-bold" style={{ color: "#FE6972" }}>
                          {(r.first_name || "U")[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{r.first_name} {r.last_name}</p>
                          <div className="flex gap-0.5">{[...Array(r.rating || 5)].map((_, j) => <Star key={j} className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />)}</div>
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No reviews yet. Be the first to review!</p>
              )}
            </div>

            {/* ── FAQ ── */}
            {faqs.length > 0 && (
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-3">Frequently Asked Questions</h2>
                <div className="space-y-2">
                  {faqs.map((faq: any, i: number) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
                        <span className="text-sm font-semibold text-gray-900">{faq.question}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition ${openFaq === i ? "rotate-180" : ""}`} />
                      </button>
                      {openFaq === i && <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{faq.answer}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SIMILAR VENDORS ── */}
            {similar.length > 0 && (
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-4">Similar Vendors</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {similar.map((v: any) => (
                    <Link href={`/services/${v.id}`} key={v.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">{v.business_name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />{v.rating}
                        {v.city && <span>· {v.city}</span>}
                      </div>
                      {v.price_min && <p className="text-sm font-bold text-gray-900 mt-2">From {Number(v.price_min).toLocaleString()} EGP</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── FINAL CTA ── */}
            <div className="rounded-2xl p-8 text-center" style={{ background: "linear-gradient(135deg, #FE6972, #d44a54)" }}>
              <h2 className="font-serif text-2xl font-bold text-white italic mb-2">Ready to book {vendor.business_name}?</h2>
              <p className="text-white/70 text-sm mb-5">Send a free inquiry and get a personalized quote</p>
              <button onClick={() => setShowQuoteForm(true)} className="bg-white px-8 py-3 rounded-full text-sm font-bold transition shadow-lg hover:shadow-xl inline-flex items-center gap-2" style={{ color: "#FE6972" }}>
                <Mail className="w-4 h-4" />Request Free Quote
              </button>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN — STICKY SIDEBAR (30%) ═══ */}
          <div className="w-full lg:w-[340px] shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">

              {/* Price + CTA Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {vendor.price_min ? `${Number(vendor.price_min).toLocaleString()} EGP` : "Contact for price"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-4">Starting price</p>

                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                  <span className="text-sm font-bold text-gray-900">{vendor.rating}</span>
                  <span className="text-xs text-gray-400">({vendor.reviews_count} reviews)</span>
                </div>

                <button onClick={() => setShowQuoteForm(true)} className="w-full py-3 rounded-xl text-sm font-bold text-white transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2" style={{ background: "#FE6972" }}>
                  <Mail className="w-4 h-4" />Request Quote
                </button>
                <button className="w-full py-3 rounded-xl text-sm font-bold transition border mt-2 flex items-center justify-center gap-2" onClick={() => setShowChat(true)} style={{ color: "#FE6972", borderColor: "#FE6972" }}><MessageCircle className="w-4 h-4" />Chat Now
                </button>

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  {vendor.response_time_hours && <div className="flex items-center gap-2 text-xs text-gray-500"><Clock className="w-3.5 h-3.5" />Responds in {vendor.response_time_hours} hours</div>}
                  {vendor.is_verified && <div className="flex items-center gap-2 text-xs text-green-600"><Shield className="w-3.5 h-3.5" />Verified Vendor</div>}
                  {vendor.completed_bookings > 0 && <div className="flex items-center gap-2 text-xs text-gray-500"><Calendar className="w-3.5 h-3.5" />{vendor.completed_bookings} bookings completed</div>}
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Info</h3>
                <div className="space-y-2.5 text-xs text-gray-600">
                  {vendor.city && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400" />{vendor.city}</div>}
                  {vendor.experience_years > 0 && <div className="flex items-center gap-2"><Award className="w-3.5 h-3.5 text-gray-400" />{vendor.experience_years} years experience</div>}
                  {vendor.category_name && <div className="flex items-center gap-2"><Camera className="w-3.5 h-3.5 text-gray-400" />{vendor.category_name}</div>}
                  {vendor.languages?.length > 0 && <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-gray-400" />{vendor.languages.join(", ")}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MOBILE STICKY CTA ═══ */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-200 px-4 py-3 flex gap-2 z-40 shadow-lg">
        <button className="flex-1 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2" style={{ border: "1px solid #FE6972", color: "#FE6972" }} onClick={() => setShowChat(true)}>
          <MessageCircle className="w-4 h-4" />Chat
        </button>
        <button onClick={() => setShowQuoteForm(true)} className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition shadow-lg flex items-center justify-center gap-2" style={{ background: "#FE6972" }}>
          <Mail className="w-4 h-4" />Request Quote
        </button>
      </div>

      {/* ═══ QUOTE MODAL ═══ */}
      {showQuoteForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button onClick={() => setShowQuoteForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            
            {quoteSent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#FE6972" }}>
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-serif text-xl font-bold text-gray-900 italic mb-2">Quote Sent!</h3>
                <p className="text-sm text-gray-500">The vendor will respond within {vendor.response_time_hours || 24} hours</p>
              </div>
            ) : (
              <>
                <h3 className="font-serif text-xl font-bold text-gray-900 italic mb-1">Request a Quote</h3>
                <p className="text-xs text-gray-400 mb-5">from {vendor.business_name}</p>
                
                <form onSubmit={handleQuoteSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Wedding Date</label>
                    <input name="date" type="date" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-300" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-1 block">Guests</label>
                      <input name="guests" type="number" placeholder="e.g. 200" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-300" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-1 block">Budget (EGP)</label>
                      <input name="budget" type="number" placeholder="e.g. 5000" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-300" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Message</label>
                    <textarea name="message" rows={3} placeholder="Tell the vendor about your wedding..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-300 resize-none" />
                  </div>
                  <button type="submit" className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg" style={{ background: "#FE6972" }}>
                    <Send className="w-4 h-4" />Send Quote Request
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
      {/* Chat Dialog */}
      <ChatDialog vendor={vendor} isOpen={showChat} onClose={() => setShowChat(false)} />
    </div>
  );
}
