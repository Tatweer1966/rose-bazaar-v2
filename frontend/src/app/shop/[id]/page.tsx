"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MapPin, Shield, Heart, Flame, Crown, Zap, Check,
  ChevronRight, MessageCircle, CreditCard, Phone,
  ArrowLeft, Share2, Eye, Tag, Sparkles, X,
  CheckCircle, AlertCircle,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

const PLANS: Record<string, { label: string; color: string; icon: any }> = {
  TOP:   { label: "Top",   color: "#D4AF37", icon: Crown },
  PRO:   { label: "Pro",   color: "#6366f1", icon: Zap   },
  BASIC: { label: "Basic", color: "#22c55e", icon: Check },
  LITE:  { label: "Lite",  color: "#94a3b8", icon: null  },
};

interface Product {
  id: string; name: string; name_ar?: string;
  description?: string; description_ar?: string;
  category_id: string; subcategory_id?: string;
  category_name?: string; category_color?: string; category_icon?: string;
  subcategory_name?: string;
  price: string; price_original?: string; currency: string; price_on_request: boolean;
  city?: string; plan_type: string;
  is_featured: boolean; is_verified: boolean;
  cover_image?: string; display_image?: string; images: string[];
  view_count: number; inquiry_count: number; save_count: number;
  tags: string[];
  vendor_business_name?: string; vendor_description?: string;
  vendor_phone_profile?: string; vendor_whatsapp_profile?: string;
  vendor_city?: string; vendor_rating?: number; vendor_reviews_count?: number;
  vendor_is_verified?: boolean;
}

interface RelatedProduct {
  id: string; name: string; price: string; currency: string;
  cover_image?: string; display_image?: string;
  category_name?: string; category_color?: string;
  plan_type: string; is_featured: boolean; city?: string;
}

function SkeletonDetail() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="h-96 bg-gray-100 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-12 bg-gray-100 rounded w-1/3" />
          <div className="h-24 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ShopProductPage() {
  const params  = useParams();
  const id      = params?.id as string;

  const [product,  setProduct]  = useState<Product | null>(null);
  const [related,  setRelated]  = useState<RelatedProduct[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  // Inquiry form state
  const [form,       setForm]       = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [formError,  setFormError]  = useState("");

  // Installment calculator
  const [months, setMonths] = useState(12);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API}/api/shop/products/${id}`)
      .then(r => r.json())
      .then(d => {
        if (!d.success || !d.data) { setNotFound(true); setLoading(false); return; }
        setProduct(d.data);
        setLoading(false);
        // Load related
        fetch(`${API}/api/shop/products?category=${d.data.category_id}&limit=4`)
          .then(r => r.json())
          .then(rd => {
            if (rd.success) setRelated(rd.data.filter((p: any) => p.id !== id).slice(0, 3));
          }).catch(() => {});
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  const allImages = product
    ? [product.display_image || product.cover_image, ...product.images].filter(Boolean) as string[]
    : [];

  const price     = product ? parseFloat(product.price) : 0;
  const origPrice = product?.price_original ? parseFloat(product.price_original) : null;
  const discount  = origPrice ? Math.round((1 - price / origPrice) * 100) : null;
  const monthly   = price > 0 ? Math.round(price / months) : 0;

  async function handleInquiry() {
    if (!form.name.trim()) { setFormError("Please enter your name."); return; }
    if (!form.phone.trim() && !form.email.trim()) { setFormError("Please enter a phone or email."); return; }
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/shop/products/${id}/inquire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) { setSubmitted(true); }
      else setFormError(data.error || "Something went wrong. Please try again.");
    } catch {
      setFormError("Could not send inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="min-h-screen" style={{ background: "#F9FAFB" }}><SkeletonDetail /></div>;

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#F9FAFB" }}>
      <div className="text-5xl mb-4">🌹</div>
      <h1 className="text-xl font-bold text-gray-800 mb-2">Product Not Found</h1>
      <p className="text-gray-500 text-sm mb-6">This listing may have been removed or expired.</p>
      <Link href="/shop" className="px-6 py-2.5 rounded-xl text-white text-sm font-bold" style={{ background: "#FE6972" }}>
        Back to Shop
      </Link>
    </div>
  );

  if (!product) return null;
  const plan    = PLANS[product.plan_type] || PLANS.LITE;
  const PlanIcon = plan.icon;

  return (
    <div className="min-h-screen pb-20" style={{ background: "#F9FAFB" }}>

      {/* ── BREADCRUMB ─────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-2 text-xs text-gray-400 flex-wrap">
          <Link href="/" className="hover:text-[#FE6972] transition">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/shop" className="hover:text-[#FE6972] transition">Shop</Link>
          {product.category_name && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/shop?category=${product.category_id}`} className="hover:text-[#FE6972] transition">
                {product.category_name}
              </Link>
            </>
          )}
          {product.subcategory_name && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-500">{product.subcategory_name}</span>
            </>
          )}
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-700 font-medium line-clamp-1">{product.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── BACK + ACTIONS ─────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/shop" className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#FE6972] transition font-medium">
            <ArrowLeft className="w-4 h-4" />Back to Shop
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { navigator.clipboard?.writeText(window.location.href); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition"
            >
              <Share2 className="w-3.5 h-3.5" />Share
            </button>
            <button
              onClick={() => setSaved(s => !s)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${saved ? "border-[#FE6972] bg-pink-50 text-[#FE6972]" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
            >
              <Heart className={`w-3.5 h-3.5 ${saved ? "fill-[#FE6972]" : ""}`} />
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* ── MAIN GRID ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">

          {/* LEFT: Image gallery */}
          <div>
            {/* Main image */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 mb-3" style={{ aspectRatio: "4/3" }}>
              <img
                src={allImages[activeImg] || "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {/* Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                {PlanIcon && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                    style={{ background: plan.color }}>
                    <PlanIcon className="w-3.5 h-3.5" />{plan.label}
                  </span>
                )}
                {product.is_featured && (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FE6972] text-white shadow-lg">
                    <Flame className="w-3.5 h-3.5" />Featured
                  </span>
                )}
                {discount && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-500 text-white shadow-lg">
                    -{discount}% OFF
                  </span>
                )}
              </div>
              {/* View count */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg">
                <Eye className="w-3 h-3" />{product.view_count} views
              </div>
            </div>
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition ${activeImg === i ? "border-[#FE6972]" : "border-transparent"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product info */}
          <div className="flex flex-col">
            {/* Category pill */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {product.category_name && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: `${product.category_color}20`, color: product.category_color || "#FE6972" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: product.category_color || "#FE6972" }} />
                  {product.category_name}
                </span>
              )}
              {product.subcategory_name && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                  {product.subcategory_name}
                </span>
              )}
              {product.is_verified && (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full font-semibold">
                  <Shield className="w-3 h-3" />Verified
                </span>
              )}
            </div>

            <h1 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 italic mb-2 leading-tight">
              {product.name}
            </h1>

            {product.city && (
              <div className="flex items-center gap-1 text-sm text-gray-400 mb-4">
                <MapPin className="w-3.5 h-3.5" />{product.city}
              </div>
            )}

            {/* Price */}
            <div className="flex items-end gap-3 mb-4">
              {product.price_on_request ? (
                <span className="text-2xl font-black text-gray-900">Price on Request</span>
              ) : (
                <>
                  <span className="text-3xl font-black text-gray-900">
                    {price.toLocaleString()} <span className="text-lg font-semibold text-gray-500">EGP</span>
                  </span>
                  {origPrice && (
                    <span className="text-base text-gray-400 line-through mb-1">
                      {origPrice.toLocaleString()} EGP
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Installment calculator */}
            {price > 3000 && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-bold text-purple-700">Easy Installments</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {[6, 12, 18, 24].map(m => (
                    <button key={m} onClick={() => setMonths(m)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${months === m ? "bg-purple-600 text-white" : "bg-white text-purple-600 border border-purple-200"}`}>
                      {m}mo
                    </button>
                  ))}
                </div>
                <p className="text-sm text-purple-700">
                  From <strong>{monthly.toLocaleString()} EGP/month</strong> over {months} months
                </p>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{product.description}</p>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mb-4">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                {product.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-6 pb-6 border-b border-gray-100">
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{product.view_count} views</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{product.inquiry_count} inquiries</span>
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{product.save_count} saves</span>
            </div>

            {/* Vendor info */}
            {product.vendor_business_name && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-gray-900">{product.vendor_business_name}</span>
                  {product.vendor_is_verified && (
                    <span className="flex items-center gap-1 text-[10px] text-green-600 font-semibold">
                      <Shield className="w-3 h-3" />Verified
                    </span>
                  )}
                </div>
                {product.vendor_city && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{product.vendor_city}
                  </span>
                )}
                {product.vendor_whatsapp_profile && (
                  <a href={`https://wa.me/${product.vendor_whatsapp_profile}`} target="_blank" rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-2 text-xs font-semibold text-green-600 hover:text-green-700 transition">
                    <Phone className="w-3.5 h-3.5" />Chat on WhatsApp
                  </a>
                )}
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex gap-3">
              <a href="#inquiry"
                className="flex-1 py-3.5 rounded-xl text-white text-sm font-bold text-center transition"
                style={{ background: "linear-gradient(135deg,#FE6972,#c9485f)" }}>
                Send Inquiry
              </a>
              {product.vendor_whatsapp_profile && (
                <a href={`https://wa.me/${product.vendor_whatsapp_profile}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-500 hover:bg-green-600 transition">
                  <Phone className="w-5 h-5 text-white" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── INQUIRY FORM ────────────────────────────────── */}
        <div id="inquiry" className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 mb-10 scroll-mt-20">
          <h2 className="font-serif text-xl font-bold italic text-gray-900 mb-1">Send an Inquiry</h2>
          <p className="text-sm text-gray-400 mb-6">The vendor will contact you directly.</p>

          {submitted ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
              <h3 className="font-bold text-gray-900 mb-1">Inquiry Sent!</h3>
              <p className="text-sm text-gray-500">The vendor will get back to you soon.</p>
              <button onClick={() => setSubmitted(false)}
                className="mt-4 text-xs text-[#FE6972] font-semibold hover:underline">
                Send another inquiry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Your Name *
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Sara Ahmed"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FE6972] transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Phone Number
                </label>
                <input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="e.g. 01012345678"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FE6972] transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. sara@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FE6972] transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Message
                </label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Tell the vendor what you need..."
                  rows={1}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FE6972] transition resize-none"
                />
              </div>
              {formError && (
                <div className="md:col-span-2 flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />{formError}
                </div>
              )}
              <div className="md:col-span-2">
                <button
                  onClick={handleInquiry}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl text-white text-sm font-bold transition disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#FE6972,#c9485f)" }}
                >
                  {submitting ? "Sending..." : "Send Inquiry"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RELATED PRODUCTS ────────────────────────────── */}
        {related.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-bold italic text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FE6972]" />Related Products
              </h2>
              <Link href={`/shop?category=${product.category_id}`}
                className="text-xs font-semibold flex items-center gap-1" style={{ color: "#FE6972" }}>
                See all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map(p => {
                const rPlan = PLANS[p.plan_type] || PLANS.LITE;
                const RPlanIcon = rPlan.icon;
                return (
                  <Link key={p.id} href={`/shop/${p.id}`}
                    className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#FE6972]/30 hover:shadow-lg transition-all duration-300">
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={p.display_image || p.cover_image || "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=70"}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute top-2 left-2 flex gap-1">
                        {RPlanIcon && (
                          <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                            style={{ background: rPlan.color }}>
                            <RPlanIcon className="w-2.5 h-2.5" />{rPlan.label}
                          </span>
                        )}
                        {p.is_featured && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FE6972] text-white">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-0.5 rounded-lg">
                          {parseFloat(p.price).toLocaleString()} EGP
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-sm text-gray-900 group-hover:text-[#FE6972] transition line-clamp-1">{p.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        {p.category_name && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.category_color || "#FE6972" }} />
                            {p.category_name}
                          </span>
                        )}
                        {p.city && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />{p.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
