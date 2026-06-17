"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, ChevronLeft, Check, Camera, Building2, ShoppingBag, Clock,
  User, Briefcase, MapPin, Phone, Globe, Instagram, Facebook, Upload,
  DollarSign, Image, FileText, Shield, Send, Sparkles, Star
} from "lucide-react";

const API = "http://localhost:9000";

const VENDOR_TYPES = [
  { id: "service", label: "Wedding Services", labelAr: "خدمات الزفاف", icon: Camera, desc: "Photography, planning, makeup, DJ, etc.", color: "#FE6972" },
  { id: "venue", label: "Venue Rental", labelAr: "تأجير قاعات", icon: Building2, desc: "Halls, hotels, gardens, outdoor spaces", color: "#D4AF37" },
  { id: "store", label: "Wedding Shop", labelAr: "متجر الزفاف", icon: ShoppingBag, desc: "Dresses, decor, accessories, gifts", color: "#6366f1" },
  { id: "happy_hour", label: "Restaurant / Happy Hour", labelAr: "مطعم / هابي آور", icon: Clock, desc: "Restaurants, lounges, cafés with deals", color: "#f97316" },
];

const SERVICE_CATS = ["Photography", "Videography", "Catering", "Makeup", "Hair", "Planning", "DJ / Music", "Decor", "Flowers", "Cake", "Transportation", "Stationery"];
const VENUE_TYPES = ["Indoor Hall", "Outdoor Garden", "Hotel", "Beach", "Rooftop", "Villa"];
const VENUE_FACILITIES = ["Catering", "Parking", "Decoration", "Sound System", "Lighting", "Bridal Suite", "Valet", "AC"];
const STORE_CATS = ["Wedding Dresses", "Bridesmaid Dresses", "Suits", "Decor Items", "Accessories", "Gifts", "Invitations"];
const DELIVERY_OPTS = ["Shipping", "Pickup", "Both"];
const RESTAURANT_TYPES = ["Fine Dining", "Casual", "Café", "Lounge", "Beach Club", "Rooftop", "Fast Casual"];
const MENU_TYPES = ["Food", "Drinks", "Shisha", "Desserts"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STEPS = [
  "Account", "Business Type", "Individual / Company", "Basic Profile",
  "Contact & Social", "Details", "Pricing", "Portfolio", "Location", "Documents", "Agreement", "Submit"
];

export default function VendorRegister() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "", first_name: "", last_name: "", phone: "",
    vendor_type: "", business_type: "individual",
    business_name: "", business_name_ar: "", category_id: "", city: "", experience_years: 0, description: "", description_ar: "",
    whatsapp: "", website: "", instagram: "", facebook: "",
    services: [] as string[], styles: [] as string[], price_min: 0, price_max: 0,
    capacity_min: 0, capacity_max: 0, venue_types: [] as string[], facilities: [] as string[],
    product_categories: [] as string[], delivery_options: [] as string[],
    restaurant_type: "", happy_hour_days: [] as string[], start_time: "17:00", end_time: "20:00",
    discount_type: "percentage", discount_value: 0, offer_description: "", menu_types: [] as string[],
    packages: [{ name: "", price: 0, includes: "" }],
    latitude: 0, longitude: 0, address_full: "",
    agree_terms: false, agree_fees: false,
  });

  const u = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));
  const toggleArray = (field: string, val: string) => {
    const arr = (form as any)[field] as string[];
    u(field, arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(API + "/api/services/vendor/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (d.success) setSubmitted(true);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  if (submitted) return (
    <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow-lg border border-gray-100">
        <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "#FE6972" }}>
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-gray-900 italic mb-2">Application Submitted!</h2>
        <p className="text-sm text-gray-500 mb-6">Our team will review your profile within 24-48 hours. You will receive an email notification once approved.</p>
        <button onClick={() => router.push("/")} className="px-8 py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#FE6972" }}>
          Back to Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-20 pb-4 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-serif text-2xl font-bold text-gray-900 italic">Vendor Registration</h1>
          <p className="text-xs text-gray-400 mt-1">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: progress + "%", background: "#FE6972" }} />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm min-h-[400px]">

          {/* STEP 0: Account */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-4">Create Your Account</h2>
              <div className="grid grid-cols-2 gap-3">
                <Input label="First Name" value={form.first_name} onChange={v => u("first_name", v)} />
                <Input label="Last Name" value={form.last_name} onChange={v => u("last_name", v)} />
              </div>
              <Input label="Email" type="email" value={form.email} onChange={v => u("email", v)} />
              <Input label="Phone" value={form.phone} onChange={v => u("phone", v)} />
              <Input label="Password" type="password" value={form.password} onChange={v => u("password", v)} />
            </div>
          )}

          {/* STEP 1: Vendor Type */}
          {step === 1 && (
            <div>
              <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-4">What Do You Offer?</h2>
              <div className="grid grid-cols-2 gap-3">
                {VENDOR_TYPES.map(t => {
                  const Icon = t.icon;
                  const active = form.vendor_type === t.id;
                  return (
                    <button key={t.id} onClick={() => u("vendor_type", t.id)}
                      className={`p-4 rounded-xl border-2 text-left transition ${active ? "shadow-md" : "border-gray-200 hover:border-gray-300"}`}
                      style={active ? { borderColor: t.color, background: t.color + "08" } : {}}>
                      <Icon className="w-6 h-6 mb-2" style={{ color: t.color }} />
                      <h3 className="font-semibold text-sm text-gray-900">{t.label}</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Individual/Company */}
          {step === 2 && (
            <div>
              <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-4">Business Structure</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "individual", label: "Individual", icon: User, desc: "Freelancer or solo professional" },
                  { id: "company", label: "Company / Firm", icon: Briefcase, desc: "Registered business entity" },
                ].map(t => {
                  const Icon = t.icon;
                  const active = form.business_type === t.id;
                  return (
                    <button key={t.id} onClick={() => u("business_type", t.id)}
                      className={`p-5 rounded-xl border-2 text-left transition ${active ? "border-[#FE6972] bg-[#FE6972]/5 shadow-md" : "border-gray-200"}`}>
                      <Icon className="w-6 h-6 mb-2" style={{ color: active ? "#FE6972" : "#9ca3af" }} />
                      <h3 className="font-semibold text-sm text-gray-900">{t.label}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Basic Profile */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-4">Basic Profile</h2>
              <Input label="Business Name (English)" value={form.business_name} onChange={v => u("business_name", v)} />
              <Input label="Business Name (Arabic)" value={form.business_name_ar} onChange={v => u("business_name_ar", v)} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">City</label>
                  <select value={form.city} onChange={e => u("city", e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                    <option value="">Select city</option>
                    {["Cairo", "Alexandria", "Giza", "Hurghada", "Sharm El Sheikh"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <Input label="Years of Experience" type="number" value={form.experience_years} onChange={v => u("experience_years", parseInt(v) || 0)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => u("description", e.target.value)} rows={3} placeholder="Tell couples about your business..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
              </div>
            </div>
          )}

          {/* STEP 4: Contact & Social */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-4">Contact & Social</h2>
              <Input label="WhatsApp Number" value={form.whatsapp} onChange={v => u("whatsapp", v)} icon={<Phone className="w-4 h-4" />} />
              <Input label="Website" value={form.website} onChange={v => u("website", v)} icon={<Globe className="w-4 h-4" />} />
              <Input label="Instagram" value={form.instagram} onChange={v => u("instagram", v)} icon={<Instagram className="w-4 h-4" />} />
              <Input label="Facebook" value={form.facebook} onChange={v => u("facebook", v)} icon={<Facebook className="w-4 h-4" />} />
            </div>
          )}

          {/* STEP 5: Dynamic Details */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-4">
                {form.vendor_type === "service" ? "Service Details" :
                 form.vendor_type === "venue" ? "Venue Details" :
                 form.vendor_type === "store" ? "Store Details" : "Happy Hour Details"}
              </h2>

              {form.vendor_type === "service" && (
                <>
                  <TagSelector label="Services Offered" options={SERVICE_CATS} selected={form.services} onToggle={v => toggleArray("services", v)} />
                  <TagSelector label="Styles" options={["Documentary", "Fine Art", "Editorial", "Candid", "Traditional", "Modern"]} selected={form.styles} onToggle={v => toggleArray("styles", v)} />
                </>
              )}

              {form.vendor_type === "venue" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Min Capacity" type="number" value={form.capacity_min} onChange={v => u("capacity_min", parseInt(v) || 0)} />
                    <Input label="Max Capacity" type="number" value={form.capacity_max} onChange={v => u("capacity_max", parseInt(v) || 0)} />
                  </div>
                  <TagSelector label="Venue Type" options={VENUE_TYPES} selected={form.venue_types} onToggle={v => toggleArray("venue_types", v)} />
                  <TagSelector label="Facilities" options={VENUE_FACILITIES} selected={form.facilities} onToggle={v => toggleArray("facilities", v)} />
                </>
              )}

              {form.vendor_type === "store" && (
                <>
                  <TagSelector label="Product Categories" options={STORE_CATS} selected={form.product_categories} onToggle={v => toggleArray("product_categories", v)} />
                  <TagSelector label="Delivery Options" options={DELIVERY_OPTS} selected={form.delivery_options} onToggle={v => toggleArray("delivery_options", v)} />
                </>
              )}

              {form.vendor_type === "happy_hour" && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Restaurant Type</label>
                    <select value={form.restaurant_type} onChange={e => u("restaurant_type", e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                      <option value="">Select type</option>
                      {RESTAURANT_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <TagSelector label="Happy Hour Days" options={DAYS} selected={form.happy_hour_days} onToggle={v => toggleArray("happy_hour_days", v)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Start Time" type="time" value={form.start_time} onChange={v => u("start_time", v)} />
                    <Input label="End Time" type="time" value={form.end_time} onChange={v => u("end_time", v)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-1 block">Discount Type</label>
                      <select value={form.discount_type} onChange={e => u("discount_type", e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                        <option value="percentage">Percentage Off</option>
                        <option value="bogo">Buy 1 Get 1</option>
                        <option value="fixed">Fixed Amount Off</option>
                        <option value="custom">Custom Offer</option>
                      </select>
                    </div>
                    <Input label="Discount Value" type="number" value={form.discount_value} onChange={v => u("discount_value", parseFloat(v) || 0)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Offer Description</label>
                    <textarea value={form.offer_description} onChange={e => u("offer_description", e.target.value)} rows={2} placeholder="e.g. 50% off all drinks" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
                  </div>
                  <TagSelector label="Menu Types" options={MENU_TYPES} selected={form.menu_types} onToggle={v => toggleArray("menu_types", v)} />
                </>
              )}
            </div>
          )}

          {/* STEP 6: Pricing */}
          {step === 6 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-4">Pricing</h2>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Starting Price (EGP)" type="number" value={form.price_min} onChange={v => u("price_min", parseFloat(v) || 0)} />
                <Input label="Maximum Price (EGP)" type="number" value={form.price_max} onChange={v => u("price_max", parseFloat(v) || 0)} />
              </div>
              <p className="text-xs text-gray-400">You can add detailed packages after approval</p>
            </div>
          )}

          {/* STEP 7: Portfolio */}
          {step === 7 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-4">Portfolio & Media</h2>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#FE6972]/30 transition cursor-pointer">
                <Image className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-semibold">Upload your best work</p>
                <p className="text-xs text-gray-400 mt-1">Minimum 5 images. JPG, PNG (max 10MB each)</p>
                <button className="mt-4 px-6 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "#FE6972" }}>
                  <Upload className="w-3.5 h-3.5 inline mr-1" />Choose Files
                </button>
              </div>
              <p className="text-xs text-gray-400">Portfolio upload will be available after account creation. You can add images from your dashboard.</p>
            </div>
          )}

          {/* STEP 8: Location */}
          {step === 8 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-4">Location</h2>
              <Input label="Full Address" value={form.address_full} onChange={v => u("address_full", v)} icon={<MapPin className="w-4 h-4" />} />
              <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Map integration coming soon</p>
                  <p className="text-[10px] text-gray-300">Your location helps couples find you</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: Documents */}
          {step === 9 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-4">Verification Documents</h2>
              <div className="space-y-3">
                {["National ID / Passport", "Business License (optional)", "Portfolio Certificate (optional)"].map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-[#FE6972]/30 transition cursor-pointer">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700">{doc}</p>
                      <p className="text-[10px] text-gray-400">PDF, JPG, PNG (max 5MB)</p>
                    </div>
                    <button className="px-3 py-1 rounded-lg text-[10px] font-bold border" style={{ color: "#FE6972", borderColor: "#FE6972" }}>Upload</button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">Document upload will be available from your dashboard after registration.</p>
            </div>
          )}

          {/* STEP 10: Agreement */}
          {step === 10 && (
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-4">Terms & Agreement</h2>
              <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto text-xs text-gray-600 leading-relaxed">
                <p className="font-semibold mb-2">Rose Bazaar Vendor Agreement</p>
                <p>By registering as a vendor on Rose Bazaar, you agree to provide accurate business information, maintain professional service standards, respond to inquiries within 48 hours, and comply with our community guidelines. Rose Bazaar reserves the right to suspend accounts that violate these terms.</p>
                <p className="mt-2">Vendor listings are subject to approval by our quality team. Featured placement and premium visibility are available through our subscription plans.</p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.agree_terms} onChange={e => u("agree_terms", e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-700">I agree to the Terms & Conditions</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.agree_fees} onChange={e => u("agree_fees", e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-700">I understand the fees & commission structure</span>
              </label>
            </div>
          )}

          {/* STEP 11: Submit */}
          {step === 11 && (
            <div className="text-center py-6">
              <Sparkles className="w-12 h-12 mx-auto mb-4" style={{ color: "#D4AF37" }} />
              <h2 className="font-serif text-2xl font-bold text-gray-900 italic mb-2">Ready to Submit?</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Your profile will be reviewed by our team within 24-48 hours. Once approved, you will appear in search results.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 text-left max-w-sm mx-auto mb-6 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Business:</span><span className="font-semibold text-gray-900">{form.business_name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Type:</span><span className="font-semibold text-gray-900 capitalize">{form.vendor_type.replace("_", " ") || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">City:</span><span className="font-semibold text-gray-900">{form.city || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Price:</span><span className="font-semibold text-gray-900">{form.price_min ? `From ${form.price_min} EGP` : "—"}</span></div>
              </div>
              <button onClick={handleSubmit} disabled={submitting}
                className="px-10 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg inline-flex items-center gap-2 disabled:opacity-50"
                style={{ background: "#FE6972" }}>
                {submitting ? "Submitting..." : <><Send className="w-4 h-4" />Submit Application</>}
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-white border border-gray-200 disabled:opacity-30 transition hover:bg-gray-50">
            <ChevronLeft className="w-4 h-4" />Back
          </button>
          {step < 11 && (
            <button onClick={() => setStep(s => Math.min(11, s + 1))}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition"
              style={{ background: "#FE6972" }}>
              Continue<ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable Input component
function Input({ label, value, onChange, type = "text", icon }: { label: string; value: any; onChange: (v: string) => void; type?: string; icon?: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-700 mb-1 block">{label}</label>
      <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5">
        {icon && <span className="text-gray-400">{icon}</span>}
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          className="flex-1 text-sm outline-none text-gray-700 bg-transparent" />
      </div>
    </div>
  );
}

// Tag selector component
function TagSelector({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-700 mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt} onClick={() => onToggle(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              selected.includes(opt) ? "text-white" : "text-gray-600 bg-gray-100 hover:bg-gray-200"
            }`} style={selected.includes(opt) ? { background: "#FE6972" } : {}}>
            {selected.includes(opt) && <Check className="w-3 h-3 inline mr-1" />}{opt}
          </button>
        ))}
      </div>
    </div>
  );
}
