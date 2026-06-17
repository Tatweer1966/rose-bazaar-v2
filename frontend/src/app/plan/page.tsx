"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, MapPin, Users, DollarSign, Sparkles, ChevronRight, ChevronLeft,
  Camera, Building2, Utensils, Music, Palette, Shirt, Cake, Car, Heart,
  Clock, Check, AlertTriangle, Star, Send, Zap, Shield, TrendingUp
} from "lucide-react";

const API = "http://localhost:9000";

const BUDGET_DEFAULTS: Record<string, { pct: number; icon: any; label: string }> = {
  "venue": { pct: 40, icon: Building2, label: "Venue & Catering" },
  "photography": { pct: 12, icon: Camera, label: "Photography" },
  "videography": { pct: 8, icon: Camera, label: "Videography" },
  "decor": { pct: 10, icon: Palette, label: "Decor & Flowers" },
  "music": { pct: 7, icon: Music, label: "Music & DJ" },
  "makeup": { pct: 5, icon: Sparkles, label: "Makeup & Hair" },
  "cake": { pct: 3, icon: Cake, label: "Cake & Dessert" },
  "dress": { pct: 8, icon: Shirt, label: "Attire & Fashion" },
  "transport": { pct: 3, icon: Car, label: "Transportation" },
  "planning": { pct: 4, icon: Heart, label: "Wedding Planner" },
};

const CITIES = ["Cairo", "Alexandria", "Giza", "Hurghada", "Sharm El Sheikh"];

const SERVICE_DETAILS: Record<string, { styles?: string[]; venues?: string[]; extras?: string[] }> = {
  venue: { venues: ["Indoor Hall", "Outdoor Garden", "Hotel", "Beach", "Rooftop", "Villa"] },
  photography: { styles: ["Documentary", "Fine Art", "Editorial", "Candid", "Traditional"] },
  videography: { styles: ["Cinematic", "Documentary", "Highlight Reel", "Same-day Edit"] },
  decor: { styles: ["Classic", "Modern", "Bohemian", "Luxury", "Minimalist"] },
  music: { styles: ["DJ", "Live Band", "Arabic Traditional", "Western", "Mixed"] },
  makeup: { styles: ["Natural", "Glamour", "Soft Glam", "Arabic", "Bridal Classic"] },
};

export default function WeddingPlanner() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [matchResults, setMatchResults] = useState<any[]>([]);

  // Step 1: Wedding Profile
  const [date, setDate] = useState("");
  const [city, setCity] = useState("");
  const [guests, setGuests] = useState(150);
  const [budget, setBudget] = useState(30000);
  const [flexibility, setFlexibility] = useState("flexible");

  // Budget allocations (editable)
  const [allocations, setAllocations] = useState(() =>
    Object.entries(BUDGET_DEFAULTS).map(([key, val]) => ({
      key, ...val, selected: ["venue", "photography", "decor", "music", "cake"].includes(key),
      customPct: val.pct,
    }))
  );

  // Step 2: Service details
  const [serviceDetails, setServiceDetails] = useState<Record<string, any>>({});

  const selectedServices = allocations.filter(a => a.selected);
  const totalPct = selectedServices.reduce((sum, a) => sum + a.customPct, 0);

  const budgetWarning = useMemo(() => {
    if (guests > 200 && budget < 20000) return "Your budget may be tight for 200+ guests. Consider increasing or reducing services.";
    if (guests > 100 && budget < 10000) return "Budget is very tight for this guest count.";
    return null;
  }, [guests, budget]);

  const isPeakSeason = useMemo(() => {
    if (!date) return false;
    const month = new Date(date).getMonth() + 1;
    return [5, 6, 7, 9, 10].includes(month);
  }, [date]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/services/planner/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wedding_date: date, city, guest_count: guests, total_budget: budget,
          budget_flexibility: flexibility,
          services: selectedServices.map(s => ({
            service_type: s.key, percentage: s.customPct,
            allocated_amount: Math.round(budget * s.customPct / 100),
            details: serviceDetails[s.key] || {},
          })),
        }),
      });
      const d = await res.json();
      if (d.success) {
        setMatchResults(d.data?.matches || []);
        router.push(`/matches?wedding=${d.data?.wedding_id}`);
      }
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-20 pb-4 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-serif text-2xl font-bold text-gray-900 italic">Plan Your Dream Wedding</h1>
          <p className="text-xs text-gray-400 mt-1">
            {step === 0 ? "Tell us about your wedding" : step === 1 ? "Choose your services" : step === 2 ? "Review & get matched" : "Your matches are ready!"}
          </p>
          <div className="mt-3 flex gap-1">
            {[0,1,2,3].map(i => (
              <div key={i} className="flex-1 h-1.5 rounded-full transition-all" style={{ background: i <= step ? "#FE6972" : "#e5e7eb" }} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* ═══ STEP 1: Wedding Profile & Budget ═══ */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-5">Wedding Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Wedding Date</label>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1 text-sm outline-none" />
                  </div>
                  {isPeakSeason && <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: "#f97316" }}><TrendingUp className="w-3 h-3" />Peak season — prices may be higher</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">City</label>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <select value={city} onChange={e => setCity(e.target.value)} className="flex-1 text-sm outline-none bg-transparent">
                      <option value="">Select city</option>
                      {CITIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Guest Count</label>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5">
                    <Users className="w-4 h-4 text-gray-400" />
                    <input type="number" value={guests} onChange={e => setGuests(parseInt(e.target.value) || 0)} className="flex-1 text-sm outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">Total Budget (EGP)</label>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <input type="number" value={budget} onChange={e => setBudget(parseInt(e.target.value) || 0)} className="flex-1 text-sm outline-none" />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs font-semibold text-gray-700 mb-2 block">Budget Flexibility</label>
                <div className="flex gap-2">
                  {[{id:"strict",label:"Strict"},{id:"flexible",label:"Flexible"},{id:"very_flexible",label:"Very Flexible"}].map(f => (
                    <button key={f.id} onClick={() => setFlexibility(f.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${flexibility === f.id ? "text-white shadow-md" : "text-gray-500 bg-gray-100"}`}
                      style={flexibility === f.id ? { background: "#FE6972" } : {}}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {budgetWarning && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-amber-50 text-amber-700 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />{budgetWarning}
                </div>
              )}
            </div>

            {/* Smart Budget Allocation */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-xl font-bold text-gray-900 italic">Smart Budget Allocation</h2>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${totalPct === 100 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                  {totalPct}% allocated
                </span>
              </div>

              <div className="space-y-3">
                {allocations.map((a, i) => {
                  const Icon = a.icon;
                  const amount = Math.round(budget * a.customPct / 100);
                  return (
                    <div key={a.key} className={`flex items-center gap-3 p-3 rounded-xl transition ${a.selected ? "bg-[#FE6972]/5 border border-[#FE6972]/20" : "bg-gray-50 border border-transparent"}`}>
                      <button onClick={() => {
                        const updated = [...allocations];
                        updated[i].selected = !updated[i].selected;
                        setAllocations(updated);
                      }} className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${a.selected ? "border-[#FE6972] bg-[#FE6972]" : "border-gray-300"}`}>
                        {a.selected && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <Icon className="w-4 h-4 shrink-0" style={{ color: a.selected ? "#FE6972" : "#9ca3af" }} />
                      <span className={`text-sm font-medium flex-1 ${a.selected ? "text-gray-900" : "text-gray-400"}`}>{a.label}</span>
                      {a.selected && (
                        <>
                          <input type="range" min={1} max={50} value={a.customPct}
                            onChange={e => { const u = [...allocations]; u[i].customPct = parseInt(e.target.value); setAllocations(u); }}
                            className="w-20 h-1 accent-pink-500" />
                          <span className="text-xs font-bold w-8 text-right" style={{ color: "#FE6972" }}>{a.customPct}%</span>
                          <span className="text-xs text-gray-400 w-20 text-right">{amount.toLocaleString()} EGP</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Service Details ═══ */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-1">Customize Your Services</h2>
              <p className="text-xs text-gray-400 mb-5">Tell vendors exactly what you need</p>

              {selectedServices.map(service => {
                const Icon = service.icon;
                const details = SERVICE_DETAILS[service.key];
                const current = serviceDetails[service.key] || {};
                const updateDetail = (field: string, value: any) => {
                  setServiceDetails(prev => ({ ...prev, [service.key]: { ...prev[service.key], [field]: value } }));
                };

                return (
                  <div key={service.key} className="mb-6 pb-6 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#FE6972" + "15" }}>
                        <Icon className="w-4 h-4" style={{ color: "#FE6972" }} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{service.label}</h3>
                        <p className="text-[10px] text-gray-400">{Math.round(budget * service.customPct / 100).toLocaleString()} EGP budget</p>
                      </div>
                    </div>

                    {details?.styles && (
                      <div className="mb-3">
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Preferred Style</label>
                        <div className="flex flex-wrap gap-1.5">
                          {details.styles.map(s => (
                            <button key={s} onClick={() => updateDetail("style", s)}
                              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition ${current.style === s ? "text-white" : "text-gray-600 bg-gray-100"}`}
                              style={current.style === s ? { background: "#FE6972" } : {}}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {details?.venues && (
                      <div className="mb-3">
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Venue Type</label>
                        <div className="flex flex-wrap gap-1.5">
                          {details.venues.map(v => (
                            <button key={v} onClick={() => updateDetail("venue_type", v)}
                              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition ${current.venue_type === v ? "text-white" : "text-gray-600 bg-gray-100"}`}
                              style={current.venue_type === v ? { background: "#FE6972" } : {}}>
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {service.key === "venue" && (
                      <p className="text-[10px] text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" />Capacity: {guests} guests (from Step 1)</p>
                    )}

                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Special Requirements</label>
                      <input value={current.notes || ""} onChange={e => updateDetail("notes", e.target.value)}
                        placeholder="Any specific requests..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Review & Submit ═══ */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-4">Review Your Wedding Plan</h2>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-50 rounded-xl p-3"><span className="text-[10px] text-gray-400 block">Date</span><span className="text-sm font-bold text-gray-900">{date || "Not set"}</span></div>
                <div className="bg-gray-50 rounded-xl p-3"><span className="text-[10px] text-gray-400 block">City</span><span className="text-sm font-bold text-gray-900">{city || "Not set"}</span></div>
                <div className="bg-gray-50 rounded-xl p-3"><span className="text-[10px] text-gray-400 block">Guests</span><span className="text-sm font-bold text-gray-900">{guests}</span></div>
                <div className="bg-gray-50 rounded-xl p-3"><span className="text-[10px] text-gray-400 block">Budget</span><span className="text-sm font-bold text-gray-900">{budget.toLocaleString()} EGP</span></div>
              </div>

              <h3 className="text-sm font-bold text-gray-900 mb-3">Selected Services ({selectedServices.length})</h3>
              <div className="space-y-2 mb-6">
                {selectedServices.map(s => {
                  const Icon = s.icon;
                  const amount = Math.round(budget * s.customPct / 100);
                  return (
                    <div key={s.key} className="flex items-center justify-between p-3 rounded-xl bg-[#FE6972]/5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: "#FE6972" }} />
                        <span className="text-sm font-medium text-gray-900">{s.label}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: "#FE6972" }}>{amount.toLocaleString()} EGP</span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-900 rounded-xl p-4 text-center">
                <p className="text-white/60 text-xs mb-1">We will match you with</p>
                <p className="text-white text-2xl font-bold font-serif">Top {Math.min(selectedServices.length * 3, 15)} Vendors</p>
                <p className="text-white/40 text-[10px] mt-1">Your info stays private until you choose to connect</p>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={submitting}
              className="w-full py-4 rounded-xl text-sm font-bold text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition"
              style={{ background: "linear-gradient(135deg, #FE6972, #d44a54)" }}>
              {submitting ? "Finding matches..." : <><Zap className="w-4 h-4" />Find My Perfect Vendors</>}
            </button>
          </div>
        )}

        {/* ═══ STEP 4: Results ═══ */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#D4AF37" }}>
                <Star className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-gray-900 italic mb-2">Your Matches Are Ready!</h2>
              <p className="text-sm text-gray-500 mb-6">We found the best vendors for your wedding. Browse and connect!</p>

              {matchResults.length > 0 ? (
                <div className="space-y-3 text-left">
                  {matchResults.map((vendor: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:shadow-md transition cursor-pointer"
                      onClick={() => router.push(`/services/${vendor.id}`)}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#FE6972" + "15" }}>
                        <span className="text-sm font-bold" style={{ color: "#FE6972" }}>#{i+1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900">{vendor.business_name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                          <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />{vendor.rating}
                          <span>· {vendor.city}</span>
                          <span>· From {Number(vendor.price_min).toLocaleString()} EGP</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "#D4AF37" + "15", color: "#D4AF37" }}>
                        {Math.round(vendor.match_score || 85)}% match
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-4">Vendors in your area will receive your requirements and send proposals.</p>
                  <div className="flex items-center gap-2 justify-center text-xs text-gray-400">
                    <Shield className="w-4 h-4" />Your contact info stays private
                  </div>
                </div>
              )}

              <button onClick={() => router.push("/services")} className="mt-6 px-8 py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#FE6972" }}>
                Browse All Vendors
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step < 3 && (
          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-white border border-gray-200 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />Back
            </button>
            {step < 2 && (
              <button onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md"
                style={{ background: "#FE6972" }}>
                Continue<ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
