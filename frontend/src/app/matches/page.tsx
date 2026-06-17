"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Star, MapPin, Check, Crown, Zap, Clock, Calendar, Users, DollarSign,
  MessageCircle, Eye, ChevronDown, Shield, TrendingUp, Heart, Filter,
  ArrowRight, Sparkles, AlertCircle, Edit, Plus
} from "lucide-react";
import ChatDialog from "@/components/ChatDialog";
import FinancingWidget from "@/components/FinancingWidget";

const API = "http://localhost:9000";

const PLAN_BADGE: Record<string, { label: string; color: string; icon: any }> = {
  TOP: { label: "Top", color: "#D4AF37", icon: Crown },
  PRO: { label: "Pro", color: "#6366f1", icon: Zap },
  BASIC: { label: "Basic", color: "#22c55e", icon: Check },
  LITE: { label: "Lite", color: "#94a3b8", icon: null },
};

const STATUS_TABS = [
  { id: "all", label: "All Matches" },
  { id: "proposal", label: "New Proposals" },
  { id: "pending", label: "Waiting" },
  { id: "accepted", label: "Accepted" },
];

function MatchedVendorsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const weddingId = params.get("wedding");

  const [wedding, setWedding] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [chatVendor, setChatVendor] = useState<any>(null);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    setLoading(true);
    const wid = weddingId || "latest";
    fetch(`${API}/api/services/matches?wedding_id=${wid}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setWedding(d.data?.wedding || null);
          setVendors(d.data?.vendors || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [weddingId]);

  const filtered = tab === "all" ? vendors :
    tab === "proposal" ? vendors.filter(v => v.proposal_status === "responded") :
    tab === "pending" ? vendors.filter(v => v.proposal_status === "pending") :
    vendors.filter(v => v.proposal_status === "accepted");

  const toggleCompare = (id: string) => {
    setCompareList(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center">
      <div className="animate-pulse text-center">
        <Sparkles className="w-10 h-10 mx-auto mb-3" style={{ color: "#FE6972" }} />
        <p className="text-sm text-gray-500">Finding your matches...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFF8F3] pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-20 pb-4 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-serif text-2xl font-bold text-gray-900 italic">Your Matched Vendors</h1>
          {wedding && (
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
              {wedding.wedding_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(wedding.wedding_date).toLocaleDateString()}</span>}
              {wedding.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{wedding.city}</span>}
              {wedding.guest_count > 0 && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{wedding.guest_count} guests</span>}
              {wedding.total_budget > 0 && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{Number(wedding.total_budget).toLocaleString()} EGP</span>}
            </div>
          )}
          <div className="flex items-center gap-2 mt-3 text-[10px]">
            {["Requests Sent", "Comparing", "Booking"].map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${i === 1 ? "" : "opacity-40"}`} style={{ background: "#FE6972" }}>{i+1}</span>
                <span className={i === 1 ? "font-bold text-gray-900" : "text-gray-400"}>{s}</span>
                {i < 2 && <span className="text-gray-300 mx-1">-</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-6">
        <div className="max-w-6xl mx-auto flex gap-1 py-2">
          {STATUS_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${tab === t.id ? "text-white" : "text-gray-500 hover:bg-gray-50"}`}
              style={tab === t.id ? { background: "#FE6972" } : {}}>
              {t.label}
            </button>
          ))}
          {compareList.length >= 2 && (
            <button onClick={() => setShowCompare(!showCompare)}
              className="ml-auto px-4 py-2 rounded-lg text-xs font-bold border flex items-center gap-1"
              style={{ color: "#D4AF37", borderColor: "#D4AF37" }}>
              Compare ({compareList.length})
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">{filtered.length} vendor{filtered.length !== 1 ? "s" : ""}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400"><Shield className="w-3.5 h-3.5" />Your info stays private</div>
            </div>

            {/* Compare */}
            {showCompare && compareList.length >= 2 && (
              <div className="bg-white rounded-2xl border border-[#D4AF37]/30 p-5 shadow-sm mb-4">
                <h3 className="font-serif text-lg font-bold text-gray-900 italic mb-4">Compare Vendors</h3>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-gray-400 border-b">
                    <th className="pb-2 pr-4">Feature</th>
                    {compareList.map(id => { const v = vendors.find(x => x.id === id); return <th key={id} className="pb-2 px-2 font-semibold text-gray-900">{v?.business_name}</th>; })}
                  </tr></thead>
                  <tbody>
                    {["price_min","rating","reviews_count","city","plan_type"].map(f => (
                      <tr key={f} className="border-b border-gray-50">
                        <td className="py-2 pr-4 text-gray-500 capitalize">{f.replace("_"," ")}</td>
                        {compareList.map(id => { const v: any = vendors.find(x => x.id === id); return <td key={id} className="py-2 px-2 font-medium text-gray-900">{f==="price_min" ? `${Number(v?.[f]||0).toLocaleString()} EGP` : String(v?.[f]||"-")}</td>; })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Vendor Cards */}
            {filtered.length === 0 ? (
              <div className="text-center py-16"><Clock className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-gray-500 text-sm">No vendors in this category yet</p></div>
            ) : filtered.map((v, i) => {
              const plan = PLAN_BADGE[v.plan_type] || PLAN_BADGE.LITE;
              const PlanIcon = plan.icon;
              return (
                <div key={v.id} className="bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold" style={{ background: i === 0 ? "#D4AF37" : "#FE6972" }}>#{i+1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate">{v.business_name}</h3>
                        {PlanIcon && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: plan.color }}><PlanIcon className="w-3 h-3" />{plan.label}</span>}
                        {i === 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "#D4AF37"+"15", color: "#D4AF37" }}>Best Match</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />{v.rating} ({v.reviews_count})</span>
                        {v.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{v.city}</span>}
                        <span className="font-bold text-gray-900">{v.price_min ? `${Number(v.price_min).toLocaleString()} EGP` : "Contact"}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-green-50 text-green-700"><Check className="w-3 h-3" />Available</span>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700"><DollarSign className="w-3 h-3" />Within budget</span>
                        {v.match_score && <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: "#FE6972"+"10", color: "#FE6972" }}><TrendingUp className="w-3 h-3" />{Math.round(v.match_score)}% match</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setChatVendor(v)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition hover:shadow-sm" style={{ color: "#FE6972", borderColor: "#FE6972" }}><MessageCircle className="w-3.5 h-3.5" />Chat</button>
                        <Link href={`/services/${v.id}`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 border border-gray-200"><Eye className="w-3.5 h-3.5" />Profile</Link>
                        <button onClick={() => toggleCompare(v.id)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${compareList.includes(v.id) ? "text-white" : "text-gray-500 border-gray-200"}`} style={compareList.includes(v.id) ? { background: "#D4AF37", borderColor: "#D4AF37" } : {}}>{compareList.includes(v.id) ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}Compare</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[300px] shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Your Wedding Plan</h3>
                {wedding && (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-semibold text-gray-900">{wedding.wedding_date ? new Date(wedding.wedding_date).toLocaleDateString() : "TBD"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">City</span><span className="font-semibold text-gray-900">{wedding.city || "TBD"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Guests</span><span className="font-semibold text-gray-900">{wedding.guest_count}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Budget</span><span className="font-semibold text-gray-900">{Number(wedding.total_budget || 0).toLocaleString()} EGP</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Matched</span><span className="font-bold" style={{ color: "#FE6972" }}>{vendors.length} vendors</span></div>
                  </div>
                )}
                <button onClick={() => router.push("/plan")} className="mt-4 w-full py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 flex items-center justify-center gap-1 hover:bg-gray-50"><Edit className="w-3.5 h-3.5" />Edit Plan</button>
              </div>
              <FinancingWidget totalAmount={Number(wedding?.total_budget || 30000)} weddingId={weddingId || undefined} />
              <div className="bg-gray-900 rounded-2xl p-5 text-center">
                <AlertCircle className="w-5 h-5 mx-auto mb-2" style={{ color: "#D4AF37" }} />
                <p className="text-white text-xs font-semibold mb-1">Limited availability!</p>
                <p className="text-white/50 text-[10px]">Peak season. Book early to secure vendors.</p>
              </div>
              <div className="rounded-2xl p-5 border" style={{ background: "#FE6972"+"08", borderColor: "#FE6972"+"15" }}>
                <p className="text-xs font-semibold text-gray-700 mb-2">Need more options?</p>
                <button onClick={() => router.push("/services")} className="w-full py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1" style={{ background: "#FE6972" }}><Plus className="w-3.5 h-3.5" />Browse All Vendors</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-200 px-4 py-3 flex gap-2 z-40 shadow-lg">
        <button className="flex-1 py-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1" style={{ color: "#FE6972", borderColor: "#FE6972" }}><MessageCircle className="w-4 h-4" />Chat</button>
        <button className="flex-1 py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1" style={{ background: "#FE6972" }}><Check className="w-4 h-4" />Accept Best</button>
      </div>

      {chatVendor && <ChatDialog vendor={chatVendor} isOpen={!!chatVendor} onClose={() => setChatVendor(null)} />}
    </div>
  );
}

export default function MatchedVendorsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <MatchedVendorsInner />
    </Suspense>
  );
}
