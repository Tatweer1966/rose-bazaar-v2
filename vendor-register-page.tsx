"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight, ChevronLeft, Check, ShoppingBag, Clock,
  User, Briefcase, MapPin, Phone, Globe, Upload,
  FileText, Send, Sparkles, Star, Camera, Building,
  Tag, AlertCircle, Eye, EyeOff
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

// ── Vendor account types (Individual first) ──────────────────
const ACCOUNT_TYPES = [
  {
    id: "individual",
    label: "Individual Seller",
    labelAr: "بائع فردي",
    icon: User,
    desc: "Sell used wedding items, handmade products, or offer freelance services",
    color: "#6366f1",
    badge: "FREE — 3 ads/month",
    examples: ["Used wedding dress", "Pre-owned decor", "Handmade invitations"],
  },
  {
    id: "service",
    label: "Wedding Services",
    labelAr: "خدمات الزفاف",
    icon: Camera,
    desc: "Photography, makeup, planning, catering, DJ and more",
    color: "#FE6972",
    badge: "Professional",
    examples: ["Photography", "Makeup artist", "Wedding planner"],
  },
  {
    id: "store",
    label: "Wedding Shop",
    labelAr: "متجر الزفاف",
    icon: ShoppingBag,
    desc: "Bridal dresses, decor, accessories and wedding gifts",
    color: "#8b5cf6",
    badge: "Business",
    examples: ["Bridal boutique", "Decor shop", "Gift store"],
  },
  {
    id: "venue",
    label: "Wedding Venue",
    labelAr: "قاعة أفراح",
    icon: Building,
    desc: "Halls, hotels, gardens and outdoor event spaces",
    color: "#D4AF37",
    badge: "Premium",
    examples: ["Ballroom", "Garden venue", "Hotel"],
  },
  {
    id: "happy_hour",
    label: "Restaurant / Happy Hour",
    labelAr: "مطعم / هابي آور",
    icon: Clock,
    desc: "Restaurants and lounges with wedding or happy hour deals",
    color: "#f97316",
    badge: "F&B",
    examples: ["Fine dining", "Rooftop lounge", "Beach club"],
  },
];

const CONDITION_OPTS = ["New", "Like New", "Excellent", "Good", "Used"];
const SERVICE_CATS   = ["Photography", "Videography", "Catering", "Makeup", "Hair", "Planning", "DJ / Music", "Decor", "Flowers", "Cake", "Transportation", "Stationery"];
const STORE_CATS     = ["Wedding Dresses", "Bridesmaid Dresses", "Suits", "Decor Items", "Accessories", "Gifts", "Invitations", "Used Items"];
const VENUE_TYPES    = ["Indoor Hall", "Outdoor Garden", "Hotel", "Beach", "Rooftop", "Villa"];
const CITIES         = ["Cairo", "Alexandria", "Giza", "Hurghada", "Sharm El Sheikh", "Luxor", "Aswan", "Mansoura", "Tanta"];

const inp = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#FE6972] focus:ring-2 focus:ring-[#FE6972]/10 transition text-gray-700 bg-white";

export default function VendorRegister() {
  const router = useRouter();
  const [step,       setStep]       = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState("");
  const [showPwd,    setShowPwd]    = useState(false);

  const [form, setForm] = useState({
    // Account
    first_name: "", last_name: "", email: "", password: "", phone: "",
    // Type
    vendor_type: "", account_type: "", // account_type: individual|company
    // Profile
    business_name: "", business_name_ar: "", city: "", experience_years: 0,
    description: "",
    // Contact
    whatsapp: "", website: "", instagram: "",
    // Details (type-specific)
    services:          [] as string[],
    product_categories:[] as string[],
    venue_types:       [] as string[],
    product_condition: "",
    // Pricing
    price_min: 0, price_max: 0,
    // Location
    address_full: "",
    // Agreement
    agree_terms: false, agree_fees: false,
  });

  const u = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));
  const toggleArr = (field: string, val: string) => {
    const arr = (form as any)[field] as string[];
    u(field, arr.includes(val) ? arr.filter((v: string) => v !== val) : [...arr, val]);
  };

  const selectedType  = ACCOUNT_TYPES.find(t => t.id === form.vendor_type);
  const isIndividual  = form.vendor_type === "individual";
  const isVenue       = form.vendor_type === "venue";
  const isService     = form.vendor_type === "service";
  const isStore       = form.vendor_type === "store";

  // Steps vary by vendor type
  const STEPS = [
    "Account",
    "What Are You Offering?",
    ...(isIndividual ? ["Seller Type"] : ["Business Structure"]),
    "Your Profile",
    "Contact & Social",
    ...(isIndividual ? ["Item Details"] : ["Business Details"]),
    "Pricing",
    "Location",
    "Documents",
    "Agreement",
    "Review & Submit",
  ];
  const totalSteps = STEPS.length;
  const progress   = Math.round(((step + 1) / totalSteps) * 100);

  async function handleSubmit() {
    if (!form.agree_terms) { setError("Please accept the Terms & Conditions."); return; }
    setSubmitting(true); setError("");
    try {
      const payload = {
        ...form,
        vendor_type:  isIndividual ? "store" : form.vendor_type, // individuals map to store
        account_type: form.account_type || (isIndividual ? "individual" : "business"),
        registration_status: "submitted",
      };
      const res  = await fetch(API + "/api/services/vendor/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || data.error || "Registration failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────
  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#FFF8F3" }}>
      <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow-lg border border-gray-100">
        <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FE6972,#c9485f)" }}>
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>Application Submitted!</h2>
        <p className="text-sm text-gray-500 mb-2">Our team will review your profile within 24 hours.</p>
        <p className="text-sm text-gray-500 mb-6">You will receive an email at <strong>{form.email}</strong> once approved.</p>

        <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Name:</span><span className="font-semibold">{form.first_name} {form.last_name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Type:</span><span className="font-semibold capitalize">{selectedType?.label}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">City:</span><span className="font-semibold">{form.city}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Monthly Ads:</span><span className="font-semibold text-green-600">3 free / month</span></div>
        </div>

        <div className="space-y-2">
          <button onClick={() => router.push("/vendor/login")} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#FE6972" }}>
            Go to Vendor Login
          </button>
          <Link href="/" className="block w-full py-2.5 rounded-xl text-sm font-semibold text-center text-gray-500 border border-gray-200 hover:bg-gray-50">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );

  // ── Main form ───────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#FFF8F3" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-20 pb-4 px-6 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h1 className="font-bold text-gray-900 text-lg" style={{ fontFamily: "'Playfair Display',serif" }}>
              {STEPS[step]}
            </h1>
            <span className="text-xs text-gray-400 font-semibold">{step + 1} / {totalSteps}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: progress + "%", background: "linear-gradient(to right,#FE6972,#c9485f)" }} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm min-h-[400px]">

          {/* ── STEP 0: Account ── */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">First Name *</label>
                  <input className={inp} value={form.first_name} onChange={e => u("first_name", e.target.value)} placeholder="Sara" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Last Name *</label>
                  <input className={inp} value={form.last_name} onChange={e => u("last_name", e.target.value)} placeholder="Ahmed" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Email Address *</label>
                <input className={inp} type="email" value={form.email} onChange={e => u("email", e.target.value)} placeholder="sara@example.com" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Phone Number *</label>
                <input className={inp} value={form.phone} onChange={e => u("phone", e.target.value)} placeholder="+20 1xx xxx xxxx" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Password *</label>
                <div className="relative">
                  <input className={inp + " pr-10"} type={showPwd ? "text" : "password"} value={form.password} onChange={e => u("password", e.target.value)} placeholder="Min 8 characters" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Already have an account? <Link href="/vendor/login" className="text-[#FE6972] font-semibold">Sign In</Link>
              </p>
            </div>
          )}

          {/* ── STEP 1: Vendor Type ── */}
          {step === 1 && (
            <div>
              <p className="text-xs text-gray-400 mb-4">Choose the option that best describes what you want to do on Rose Bazaar</p>
              <div className="space-y-3">
                {ACCOUNT_TYPES.map(t => {
                  const Icon = t.icon;
                  const active = form.vendor_type === t.id;
                  return (
                    <button key={t.id} onClick={() => u("vendor_type", t.id)}
                      className="w-full text-left p-4 rounded-xl border-2 transition"
                      style={{ borderColor: active ? t.color : "#e5e7eb", background: active ? t.color + "06" : "#fff" }}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.color + "15" }}>
                          <Icon className="w-5 h-5" style={{ color: t.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900">{t.label}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: t.color + "15", color: t.color }}>{t.badge}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {t.examples.map(ex => (
                              <span key={ex} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{ex}</span>
                            ))}
                          </div>
                        </div>
                        {active && <Check className="w-5 h-5 shrink-0 mt-1" style={{ color: t.color }} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP 2: Individual/Company ── */}
          {step === 2 && (
            <div>
              <p className="text-xs text-gray-400 mb-4">
                {isIndividual ? "Are you selling as a private individual or representing a business?" : "Is this a personal account or a registered company?"}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "individual", label: isIndividual ? "Private Individual" : "Individual / Freelancer", icon: User, desc: isIndividual ? "Selling personal items" : "Solo professional" },
                  { id: "company",    label: "Company / Business", icon: Briefcase, desc: "Registered business entity" },
                ].map(t => {
                  const Icon = t.icon;
                  const active = form.account_type === t.id;
                  return (
                    <button key={t.id} onClick={() => u("account_type", t.id)}
                      className={`p-5 rounded-xl border-2 text-left transition ${active ? "border-[#FE6972] bg-[#FE6972]/5" : "border-gray-200 hover:border-gray-300"}`}>
                      <Icon className="w-6 h-6 mb-2" style={{ color: active ? "#FE6972" : "#9ca3af" }} />
                      <h3 className="font-bold text-sm text-gray-900">{t.label}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                    </button>
                  );
                })}
              </div>
              {isIndividual && (
                <div className="mt-4 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                  <p className="text-xs text-indigo-700 font-semibold">Individual Seller Limits</p>
                  <p className="text-xs text-indigo-600 mt-0.5">3 free approved ads per month. Each ad stays live for 30 days. Renewal is 100 EGP after expiry.</p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Basic Profile ── */}
          {step === 3 && (
            <div className="space-y-4">
              {isIndividual ? (
                <>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                    As an individual seller, your full name will be your display name.
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Display Name *</label>
                    <input className={inp} value={form.business_name} onChange={e => u("business_name", e.target.value)} placeholder={`${form.first_name} ${form.last_name}`} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Business Name (English) *</label>
                    <input className={inp} value={form.business_name} onChange={e => u("business_name", e.target.value)} placeholder="e.g. Elegance Events" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Business Name (Arabic)</label>
                    <input className={inp} dir="rtl" value={form.business_name_ar} onChange={e => u("business_name_ar", e.target.value)} placeholder="اسم النشاط التجاري" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Years of Experience</label>
                    <input className={inp} type="number" min="0" value={form.experience_years || ""} onChange={e => u("experience_years", parseInt(e.target.value) || 0)} placeholder="0" />
                  </div>
                </>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">City *</label>
                <select className={inp} value={form.city} onChange={e => u("city", e.target.value)}>
                  <option value="">Select city</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">{isIndividual ? "About the Item(s) You're Selling" : "About Your Business"}</label>
                <textarea className={inp + " resize-none"} rows={3} value={form.description} onChange={e => u("description", e.target.value)}
                  placeholder={isIndividual ? "e.g. I'm selling my wedding dress worn once in excellent condition..." : "Tell couples about your business and what makes you special..."} />
              </div>
            </div>
          )}

          {/* ── STEP 4: Contact & Social ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">WhatsApp Number</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <input className="flex-1 text-sm outline-none text-gray-700" value={form.whatsapp} onChange={e => u("whatsapp", e.target.value)} placeholder="+20 1xx xxx xxxx" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Website</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <input className="flex-1 text-sm outline-none text-gray-700" value={form.website} onChange={e => u("website", e.target.value)} placeholder="https://yourwebsite.com" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Instagram</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5">
                  <span className="text-gray-400 text-sm">@</span>
                  <input className="flex-1 text-sm outline-none text-gray-700" value={form.instagram} onChange={e => u("instagram", e.target.value)} placeholder="yourhandle" />
                </div>
              </div>
              <p className="text-xs text-gray-400">Social links help customers trust and find you. At least one contact method recommended.</p>
            </div>
          )}

          {/* ── STEP 5: Details (type-specific) ── */}
          {step === 5 && (
            <div className="space-y-4">
              {isIndividual && (
                <>
                  <p className="text-xs text-gray-400">Tell us about the type of items you're selling so we can approve your listings faster.</p>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-2">Product Category</label>
                    <div className="flex flex-wrap gap-2">
                      {STORE_CATS.map(cat => (
                        <button key={cat} onClick={() => toggleArr("product_categories", cat)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${form.product_categories.includes(cat) ? "text-white" : "bg-gray-100 text-gray-600"}`}
                          style={form.product_categories.includes(cat) ? { background: "#6366f1" } : {}}>
                          {form.product_categories.includes(cat) && <Check className="w-3 h-3 inline mr-1" />}{cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Typical Item Condition</label>
                    <div className="flex flex-wrap gap-2">
                      {CONDITION_OPTS.map(c => (
                        <button key={c} onClick={() => u("product_condition", c)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${form.product_condition === c ? "text-white" : "bg-gray-100 text-gray-600"}`}
                          style={form.product_condition === c ? { background: "#FE6972" } : {}}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {isService && (
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">Services Offered</label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_CATS.map(cat => (
                      <button key={cat} onClick={() => toggleArr("services", cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${form.services.includes(cat) ? "text-white" : "bg-gray-100 text-gray-600"}`}
                        style={form.services.includes(cat) ? { background: "#FE6972" } : {}}>
                        {form.services.includes(cat) && <Check className="w-3 h-3 inline mr-1" />}{cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {isStore && (
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">Product Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {STORE_CATS.map(cat => (
                      <button key={cat} onClick={() => toggleArr("product_categories", cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${form.product_categories.includes(cat) ? "text-white" : "bg-gray-100 text-gray-600"}`}
                        style={form.product_categories.includes(cat) ? { background: "#8b5cf6" } : {}}>
                        {form.product_categories.includes(cat) && <Check className="w-3 h-3 inline mr-1" />}{cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {isVenue && (
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">Venue Type</label>
                  <div className="flex flex-wrap gap-2">
                    {VENUE_TYPES.map(vt => (
                      <button key={vt} onClick={() => toggleArr("venue_types", vt)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${form.venue_types.includes(vt) ? "text-white" : "bg-gray-100 text-gray-600"}`}
                        style={form.venue_types.includes(vt) ? { background: "#D4AF37" } : {}}>
                        {form.venue_types.includes(vt) && <Check className="w-3 h-3 inline mr-1" />}{vt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 6: Pricing ── */}
          {step === 6 && (
            <div className="space-y-4">
              {isIndividual ? (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                  You can set pricing for each product listing after approval. Enter a rough range here.
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">{isIndividual ? "Lowest Price (EGP)" : "Starting Price (EGP)"}</label>
                  <input className={inp} type="number" value={form.price_min || ""} onChange={e => u("price_min", parseFloat(e.target.value) || 0)} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Highest Price (EGP)</label>
                  <input className={inp} type="number" value={form.price_max || ""} onChange={e => u("price_max", parseFloat(e.target.value) || 0)} placeholder="0" />
                </div>
              </div>
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500 font-semibold mb-1">Ad Plan</p>
                <p className="text-xs text-gray-400">Your account starts on the <strong className="text-indigo-600">Free Plan</strong> — 3 approved ads per month, each live for 30 days. You can upgrade anytime from your dashboard.</p>
              </div>
            </div>
          )}

          {/* ── STEP 7: Location ── */}
          {step === 7 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Full Address</label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <input className="flex-1 text-sm outline-none text-gray-700" value={form.address_full} onChange={e => u("address_full", e.target.value)} placeholder="Street, area, neighborhood" />
                </div>
              </div>
              <div className="bg-gray-100 rounded-xl h-40 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Map integration coming soon</p>
                  <p className="text-[10px] text-gray-300">Precise location helps couples find you</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Your city ({form.city}) is already saved. Address is optional but helps with discovery.</p>
            </div>
          )}

          {/* ── STEP 8: Documents ── */}
          {step === 8 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">Documents help us verify your identity and speed up approval. You can also upload from your dashboard after registration.</p>
              <div className="space-y-3">
                {[
                  { label: isIndividual ? "National ID / Passport" : "Commercial Registration", required: false },
                  { label: isIndividual ? "Item Photos (preview)" : "Business License",         required: false },
                  { label: "Any other supporting document",                                      required: false },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#FE6972]/30 transition">
                    <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700">{doc.label}</p>
                      <p className="text-[10px] text-gray-400">PDF, JPG, PNG • Max 5MB</p>
                    </div>
                    <button className="px-3 py-1 rounded-lg text-[10px] font-bold border" style={{ color: "#FE6972", borderColor: "#FE6972" }}>
                      <Upload className="w-3 h-3 inline mr-1" />Upload
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-indigo-600 font-semibold">Tip: Verified vendors get approved faster and show a trust badge on the marketplace.</p>
            </div>
          )}

          {/* ── STEP 9: Agreement ── */}
          {step === 9 && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 max-h-52 overflow-y-auto text-xs text-gray-600 leading-relaxed">
                <p className="font-bold text-gray-800 mb-2">Rose Bazaar Vendor Agreement</p>
                <p className="mb-2">By registering as a vendor on Rose Bazaar, you agree to:</p>
                <ul className="space-y-1 list-disc list-inside text-gray-500">
                  <li>Provide accurate and truthful information about your business and products</li>
                  <li>Respond to customer inquiries within 48 hours</li>
                  <li>Maintain professional conduct with all customers</li>
                  <li>Not post prohibited, misleading, or duplicate listings</li>
                  <li>Comply with Egyptian consumer protection laws</li>
                  <li>Accept Rose Bazaar's moderation decisions on listings</li>
                </ul>
                <p className="mt-3 font-semibold text-gray-700">Ad Policy</p>
                <p className="text-gray-500">Free plan includes 3 approved ads per month, each active for 30 days. Renewal after 30 days costs 100 EGP per listing. Featured placement is available as an optional paid upgrade.</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-[#FE6972]/30 transition">
                <input type="checkbox" checked={form.agree_terms} onChange={e => u("agree_terms", e.target.checked)} className="w-4 h-4 rounded mt-0.5 accent-[#FE6972]" />
                <span className="text-sm text-gray-700">I agree to the <span className="text-[#FE6972] font-semibold">Terms & Conditions</span> and Vendor Agreement</span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:border-[#FE6972]/30 transition">
                <input type="checkbox" checked={form.agree_fees} onChange={e => u("agree_fees", e.target.checked)} className="w-4 h-4 rounded mt-0.5 accent-[#FE6972]" />
                <span className="text-sm text-gray-700">I understand the <span className="font-semibold">ad pricing</span> — 3 free ads/month, 100 EGP per renewal</span>
              </label>
            </div>
          )}

          {/* ── STEP 10: Review & Submit ── */}
          {step === 10 && (
            <div className="text-center py-4">
              <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: "#D4AF37" }} />
              <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>Ready to Submit?</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">Our team will review your application within 24 hours and notify you by email once approved.</p>

              <div className="bg-gray-50 rounded-xl p-4 text-left max-w-sm mx-auto mb-6 space-y-2.5 text-sm">
                {[
                  ["Name",    `${form.first_name} ${form.last_name}`],
                  ["Type",    selectedType?.label || "—"],
                  ["City",    form.city || "—"],
                  ["Email",   form.email],
                  ["Phone",   form.phone || "—"],
                  ["Monthly Ads", "3 free / month"],
                  ["Ad Duration", "30 days per listing"],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}:</span>
                    <span className="font-semibold text-gray-900">{val}</span>
                  </div>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700 mb-4 max-w-sm mx-auto">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}

              <button onClick={handleSubmit} disabled={submitting || !form.agree_terms}
                className="px-10 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg inline-flex items-center gap-2 disabled:opacity-50 transition"
                style={{ background: "linear-gradient(135deg,#FE6972,#c9485f)" }}>
                {submitting
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</>
                  : <><Send className="w-4 h-4" />Submit Application</>}
              </button>

              {!form.agree_terms && <p className="text-xs text-amber-600 mt-2">Please accept the Terms & Conditions in the previous step.</p>}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-white border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition">
            <ChevronLeft className="w-4 h-4" />Back
          </button>
          {step < totalSteps - 1 && (
            <button onClick={() => {
              // Basic validation per step
              if (step === 0 && (!form.first_name || !form.email || !form.password)) {
                setError("Please fill in all required fields."); return;
              }
              if (step === 1 && !form.vendor_type) { setError("Please select a vendor type."); return; }
              setError(""); setStep(s => s + 1);
            }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition"
              style={{ background: "linear-gradient(135deg,#FE6972,#c9485f)" }}>
              Continue<ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
        {error && step < totalSteps - 1 && (
          <p className="text-xs text-red-500 text-center mt-2 flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>
        )}
      </div>
    </div>
  );
}
