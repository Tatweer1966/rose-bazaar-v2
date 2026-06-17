"use client";
import { useState, useEffect } from "react";
import { DollarSign, CreditCard, Check, Shield, ChevronDown, Clock, Star, ArrowRight, X, Calculator } from "lucide-react";

const API = "http://localhost:9000";

interface FinancingProps {
  totalAmount: number;
  weddingId?: string;
  onApply?: (session: any) => void;
  mode?: "inline" | "modal" | "banner";
}

interface Provider {
  id: string;
  name: string;
  name_ar?: string;
  interest_rate: number;
  min_months: number;
  max_months: number;
  min_amount: number;
  max_amount: number;
}

export default function FinancingWidget({ totalAmount, weddingId, onApply, mode = "inline" }: FinancingProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [months, setMonths] = useState(12);
  const [showDetails, setShowDetails] = useState(mode === "inline");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/services/financing/providers`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length > 0) {
          setProviders(d.data);
          setSelectedProvider(d.data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const provider = providers.find(p => p.id === selectedProvider);
  const rate = provider?.interest_rate || 0;
  const monthlyPayment = totalAmount > 0 ? Math.round((totalAmount * (1 + rate * months / 1200)) / months) : 0;
  const totalRepayment = monthlyPayment * months;
  const interestTotal = totalRepayment - totalAmount;
  const commission = Math.round(totalAmount * 0.01);

  const handleApply = async () => {
    if (!selectedProvider) return;
    setApplying(true);
    try {
      const res = await fetch(`${API}/api/services/financing/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wedding_id: weddingId,
          provider_id: selectedProvider,
          total_amount: totalAmount,
          months,
          monthly_payment: monthlyPayment,
          interest_rate: rate,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setApplied(true);
        onApply?.(d.data);
      }
    } catch (e) { console.error(e); }
    setApplying(false);
  };

  if (providers.length === 0) return null;

  // Banner mode - compact CTA
  if (mode === "banner") {
    return (
      <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-white" />
          <div>
            <p className="text-white text-sm font-bold">Pay in installments</p>
            <p className="text-white/70 text-xs">From {monthlyPayment.toLocaleString()} EGP/month</p>
          </div>
        </div>
        <button onClick={() => setShowDetails(true)} className="bg-white px-4 py-2 rounded-lg text-xs font-bold" style={{ color: "#6366f1" }}>
          Learn More
        </button>
      </div>
    );
  }

  // Success state
  if (applied) {
    return (
      <div className="bg-white rounded-2xl border border-green-200 p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 mx-auto mb-3 flex items-center justify-center">
          <Check className="w-7 h-7 text-green-600" />
        </div>
        <h3 className="font-serif text-lg font-bold text-gray-900 italic mb-1">Application Submitted!</h3>
        <p className="text-xs text-gray-500 mb-3">You will receive a response from {provider?.name} within 24 hours.</p>
        <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-gray-900">{totalAmount.toLocaleString()} EGP</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Monthly</span><span className="font-bold text-gray-900">{monthlyPayment.toLocaleString()} EGP x {months}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Provider</span><span className="font-bold text-gray-900">{provider?.name}</span></div>
        </div>
      </div>
    );
  }

  // Full inline/modal view
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#6366f1" + "15" }}>
              <CreditCard className="w-5 h-5" style={{ color: "#6366f1" }} />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-gray-900 italic">Pay in Installments</h3>
              <p className="text-[10px] text-gray-400">Financing by licensed partners</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold" style={{ color: "#6366f1" }}>{monthlyPayment.toLocaleString()} EGP</p>
            <p className="text-[10px] text-gray-400">per month</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Provider selection */}
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-2 block">Choose Provider</label>
          <div className="flex gap-2">
            {providers.map(p => (
              <button key={p.id} onClick={() => setSelectedProvider(p.id)}
                className={`flex-1 p-3 rounded-xl border-2 text-center transition ${selectedProvider === p.id ? "shadow-md" : "border-gray-200"}`}
                style={selectedProvider === p.id ? { borderColor: "#6366f1", background: "#6366f1" + "08" } : {}}>
                <p className="text-sm font-bold text-gray-900">{p.name}</p>
                <p className="text-[10px] text-gray-400">{p.interest_rate > 0 ? `${p.interest_rate}% interest` : "0% interest"}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Duration slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-700">Duration</label>
            <span className="text-xs font-bold" style={{ color: "#6366f1" }}>{months} months</span>
          </div>
          <input type="range" min={provider?.min_months || 3} max={provider?.max_months || 36} value={months}
            onChange={e => setMonths(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full accent-indigo-500 cursor-pointer" />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>{provider?.min_months || 3} months</span>
            <span>{provider?.max_months || 36} months</span>
          </div>
        </div>

        {/* Calculation breakdown */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-gray-500">Wedding total</span><span className="font-semibold text-gray-900">{totalAmount.toLocaleString()} EGP</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Monthly payment</span><span className="font-bold text-lg" style={{ color: "#6366f1" }}>{monthlyPayment.toLocaleString()} EGP</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-semibold text-gray-900">{months} months</span></div>
          {interestTotal > 0 && <div className="flex justify-between"><span className="text-gray-500">Interest</span><span className="text-gray-900">{interestTotal.toLocaleString()} EGP</span></div>}
          <div className="flex justify-between border-t border-gray-200 pt-2 mt-2"><span className="text-gray-500">Total repayment</span><span className="font-bold text-gray-900">{totalRepayment.toLocaleString()} EGP</span></div>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-semibold"><Shield className="w-3 h-3" />Licensed partner</span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold"><Clock className="w-3 h-3" />24h approval</span>
          {rate === 0 && <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-semibold"><Star className="w-3 h-3" />0% interest</span>}
        </div>

        {/* CTA */}
        <button onClick={handleApply} disabled={applying}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          {applying ? "Submitting..." : <><CreditCard className="w-4 h-4" />Apply for Installments</>}
        </button>

        {/* Disclaimer */}
        <p className="text-[9px] text-gray-400 text-center leading-relaxed">
          Financing provided by licensed partners. Rose Bazaar does not provide loans directly.
          Terms and conditions apply. Subject to approval.
        </p>
      </div>
    </div>
  );
}
