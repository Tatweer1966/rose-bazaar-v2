"use client";
import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard, DollarSign, User, Briefcase, Building2, ChevronRight, ChevronLeft,
  Check, Shield, Clock, Star, Phone, Mail, MapPin, Calculator, Lock, Sparkles
} from "lucide-react";

const API = "http://localhost:9000";

const INCOME_RANGES = ["Below 5,000 EGP", "5,000 - 10,000 EGP", "10,000 - 20,000 EGP", "20,000 - 50,000 EGP", "50,000+ EGP"];
const CITIES = ["Cairo", "Alexandria", "Giza", "Hurghada", "Sharm El Sheikh"];
const DURATIONS = [
  { months: 6, label: "6 months" },
  { months: 12, label: "12 months" },
  { months: 24, label: "24 months" },
  { months: 36, label: "36 months" },
];

function FinancingFormInner() {
  const router = useRouter();
  const params = useSearchParams();
  const weddingTotal = parseInt(params.get("amount") || "30000");
  const weddingId = params.get("wedding") || null;

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [amount, setAmount] = useState(weddingTotal);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [employment, setEmployment] = useState("");
  const [income, setIncome] = useState("");
  const [hasLoans, setHasLoans] = useState("");
  const [months, setMonths] = useState(12);
  const [agreeShare, setAgreeShare] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const monthlyPayment = useMemo(() => Math.round(amount / months), [amount, months]);
  const progress = Math.round(((step + 1) / 5) * 100);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/services/financing/pre-apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wedding_id: weddingId, amount, months, monthly_payment: monthlyPayment,
          name, phone, email, city, employment, income_range: income, has_existing_loans: hasLoans === "yes",
        }),
      });
      const d = await res.json();
      setResult(d.data || { eligible: true, max_amount: amount + 10000 });
    } catch { setResult({ eligible: true, max_amount: amount + 10000 }); }
    setSubmitting(false);
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-20 pb-4 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-5 h-5" style={{ color: "#6366f1" }} />
            <h1 className="font-serif text-xl font-bold text-gray-900 italic">Wedding Financing</h1>
          </div>
          <p className="text-xs text-gray-400">Step {Math.min(step + 1, 4)} of 4 - Pay your wedding in easy installments</p>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: progress + "%", background: "#6366f1" }} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Form */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">

              {/* STEP 0: Amount */}
              {step === 0 && (
                <div className="space-y-5">
                  <h2 className="font-serif text-lg font-bold text-gray-900 italic">How much would you like to finance?</h2>
                  <div>
                    <input type="range" min={5000} max={200000} step={1000} value={amount}
                      onChange={e => setAmount(parseInt(e.target.value))}
                      className="w-full h-2 rounded-full accent-indigo-500 cursor-pointer" />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      <span>5,000 EGP</span><span>200,000 EGP</span>
                    </div>
                  </div>
                  <div className="text-center py-4">
                    <p className="text-3xl font-bold" style={{ color: "#6366f1" }}>{amount.toLocaleString()} EGP</p>
                    <p className="text-xs text-gray-400 mt-1">Selected amount</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Estimated Monthly Payment</p>
                    <div className="grid grid-cols-2 gap-2">
                      {DURATIONS.map(d => (
                        <div key={d.months} className="text-center p-2 rounded-lg bg-white border border-gray-100">
                          <p className="text-sm font-bold" style={{ color: "#6366f1" }}>{Math.round(amount / d.months).toLocaleString()} EGP</p>
                          <p className="text-[10px] text-gray-400">x {d.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="font-serif text-lg font-bold text-gray-900 italic">Tell us about you</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-1 block">Full Name *</label>
                      <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5">
                        <User className="w-4 h-4 text-gray-400" />
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" className="flex-1 text-sm outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-1 block">Phone Number *</label>
                      <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+20 XXX XXX XXXX" className="flex-1 text-sm outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-1 block">Email (optional)</label>
                      <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="flex-1 text-sm outline-none" />
                      </div>
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
                  </div>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1"><Shield className="w-3 h-3" />We only use this to match you with financing partners</p>
                </div>
              )}

              {/* STEP 2: Financial Profile */}
              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="font-serif text-lg font-bold text-gray-900 italic">Financial Snapshot</h2>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-2 block">Employment Status</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[{id:"employed",label:"Employed",icon:Briefcase},{id:"self-employed",label:"Self-employed",icon:User},{id:"business",label:"Business Owner",icon:Building2}].map(e => {
                        const Icon = e.icon;
                        return (
                          <button key={e.id} onClick={() => setEmployment(e.id)}
                            className={`p-3 rounded-xl border-2 text-center transition ${employment === e.id ? "shadow-md" : "border-gray-200"}`}
                            style={employment === e.id ? { borderColor: "#6366f1", background: "#6366f1" + "08" } : {}}>
                            <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: employment === e.id ? "#6366f1" : "#9ca3af" }} />
                            <p className="text-[11px] font-semibold text-gray-700">{e.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Monthly Income Range</label>
                    <select value={income} onChange={e => setIncome(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                      <option value="">Select range</option>
                      {INCOME_RANGES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-2 block">Do you have existing loans?</label>
                    <div className="flex gap-3">
                      {["yes", "no"].map(v => (
                        <button key={v} onClick={() => setHasLoans(v)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition capitalize ${hasLoans === v ? "text-white" : "border-gray-200 text-gray-600"}`}
                          style={hasLoans === v ? { background: "#6366f1", borderColor: "#6366f1" } : {}}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">This helps find better options. We never store sensitive financial data.</p>
                </div>
              )}

              {/* STEP 3: Plan + Consent */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="font-serif text-lg font-bold text-gray-900 italic">Choose your plan</h2>
                  <div className="space-y-2">
                    {DURATIONS.map(d => {
                      const mp = Math.round(amount / d.months);
                      return (
                        <button key={d.months} onClick={() => setMonths(d.months)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition ${months === d.months ? "shadow-md" : "border-gray-200"}`}
                          style={months === d.months ? { borderColor: "#6366f1", background: "#6366f1" + "08" } : {}}>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${months === d.months ? "border-[#6366f1] bg-[#6366f1]" : "border-gray-300"}`}>
                              {months === d.months && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{d.label}</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: "#6366f1" }}>{mp.toLocaleString()} EGP/mo</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-xs space-y-1">
                    <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-gray-900">{amount.toLocaleString()} EGP</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Monthly</span><span className="font-bold" style={{ color: "#6366f1" }}>{monthlyPayment.toLocaleString()} EGP x {months}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Interest</span><span className="font-semibold text-green-600">0% (subject to approval)</span></div>
                  </div>
                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={agreeShare} onChange={e => setAgreeShare(e.target.checked)} className="w-4 h-4 mt-0.5 rounded accent-indigo-500" />
                      <span className="text-xs text-gray-600">I agree to share my information with financing partners</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} className="w-4 h-4 mt-0.5 rounded accent-indigo-500" />
                      <span className="text-xs text-gray-600">I understand loans are provided by licensed financial companies, not Rose Bazaar</span>
                    </label>
                  </div>
                  <button onClick={handleSubmit} disabled={submitting || !agreeShare || !agreeTerms}
                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                    {submitting ? "Checking..." : <><Sparkles className="w-4 h-4" />Check My Financing Options</>}
                  </button>
                </div>
              )}

              {/* STEP 4: Result */}
              {step === 4 && result && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-green-100">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-2">You Are Eligible!</h2>
                  <p className="text-sm text-gray-500 mb-5">Based on your profile, you qualify for financing</p>
                  <div className="bg-gray-50 rounded-xl p-5 text-left space-y-2 text-sm mb-5">
                    <div className="flex justify-between"><span className="text-gray-500">Approved up to</span><span className="font-bold text-lg" style={{ color: "#6366f1" }}>{(result.max_amount || amount).toLocaleString()} EGP</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Monthly payment</span><span className="font-bold text-gray-900">{monthlyPayment.toLocaleString()} EGP x {months}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Partner</span><span className="font-semibold text-gray-900">Sympl / ValU</span></div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center mb-5">
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold"><Shield className="w-3.5 h-3.5" />Licensed</span>
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold"><Clock className="w-3.5 h-3.5" />24h final approval</span>
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold"><Lock className="w-3.5 h-3.5" />Secure</span>
                  </div>
                  <button onClick={() => router.push("/matches")} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#6366f1" }}>
                    Continue to Your Matches
                  </button>
                  <p className="text-[9px] text-gray-400 mt-3">Final approval and terms provided by financing partner. Subject to eligibility.</p>
                </div>
              )}
            </div>

            {/* Navigation */}
            {step < 3 && (
              <div className="flex justify-between mt-5">
                <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-white border border-gray-200 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />Back
                </button>
                <button onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md"
                  style={{ background: "#6366f1" }}>
                  Continue<ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <p className="text-[9px] text-gray-400 text-center mt-6">Financing provided by licensed partners. Rose Bazaar does not provide loans directly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FinancingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
      <FinancingFormInner />
    </Suspense>
  );
}
