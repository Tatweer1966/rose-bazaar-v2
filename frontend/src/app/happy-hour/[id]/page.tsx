"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Clock, MapPin, Star, Heart, ChevronLeft, Share2, Shield, Check,
  Phone, MessageCircle, Calendar, Users, Sparkles, Timer, Flame,
  Wine, Coffee, UtensilsCrossed, Sun, Moon, Tag, Crown, Zap,
  ChevronDown, Send, Mail, ArrowRight
} from "lucide-react";

const API = "http://localhost:9000";
const TYPE_ICONS: Record<string, any> = { Lounge: Wine, "Beach Club": Sun, Cafe: Coffee, "Fine Dining": UtensilsCrossed, Rooftop: Moon };

function getTimeRemaining(endTime: string) {
  const now = new Date();
  const [h, m] = (endTime || "23:59").split(":").map(Number);
  const end = new Date(); end.setHours(h, m, 0);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return null;
  return { hrs: Math.floor(diff / 3600000), mins: Math.floor((diff % 3600000) / 60000) };
}

export default function DealDetails() {
  const { id } = useParams();
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${API}/api/services/happy-hour/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setDeal(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const TODAY = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];
  const isLive = deal?.days?.includes(TODAY) && (() => {
    const now = new Date();
    const ct = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = (deal.start_time || "00:00").split(":").map(Number);
    const [eh, em] = (deal.end_time || "23:59").split(":").map(Number);
    return ct >= sh * 60 + sm && ct <= eh * 60 + em;
  })();
  const remaining = isLive ? getTimeRemaining(deal?.end_time) : null;
  const TypeIcon = TYPE_ICONS[deal?.restaurant_type] || UtensilsCrossed;
  const fmtDiscount = () => deal?.discount_type === "percentage" ? `${deal.discount_value}% OFF` : deal?.discount_type === "bogo" ? "BUY 1 GET 1 FREE" : deal?.discount_type === "fixed" ? `${deal.discount_value} EGP OFF` : "SPECIAL OFFER";
  const fakeBookings = deal ? Math.floor((deal.reviews_count || 10) * 0.15) + 5 : 0;

  if (loading) return <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center"><div className="animate-pulse"><UtensilsCrossed className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-400">Loading deal...</p></div></div>;
  if (!deal) return <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center"><p className="text-gray-500">Deal not found</p><Link href="/happy-hour" className="text-orange-600 text-sm font-semibold mt-2 block">Back to Happy Hour</Link></div>;

  return (
    <div className="min-h-screen bg-[#FFF8F3] pb-20 lg:pb-0">
      {/* Hero Image */}
      <section className="relative h-[45vh] min-h-[350px] overflow-hidden">
        <img src={deal.cover_image || "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200"} alt={deal.business_name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        <Link href="/happy-hour" className="absolute top-24 left-6 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md"><ChevronLeft className="w-5 h-5 text-gray-700" /></Link>
        <div className="absolute top-24 right-6 flex gap-2">
          <button onClick={() => setSaved(!saved)} className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md"><Heart className={`w-5 h-5 ${saved ? "fill-red-500 text-red-500" : "text-gray-700"}`} /></button>
          <button className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md"><Share2 className="w-5 h-5 text-gray-700" /></button>
        </div>

        {isLive && <div className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white animate-pulse" style={{ background: "#ef4444" }}><span className="w-2 h-2 rounded-full bg-white" />LIVE NOW</div>}

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: "#f97316" }}>{fmtDiscount()}</span>
              <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-white"><TypeIcon className="w-3.5 h-3.5" />{deal.restaurant_type}</span>
              {deal.is_featured && <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: "#D4AF37" }}>Featured</span>}
            </div>
            <h1 className="font-serif text-3xl font-bold text-white italic mb-1">{deal.business_name}</h1>
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />{deal.rating} ({deal.reviews_count})</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{deal.city}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left */}
          <div className="flex-1 space-y-6">
            {/* Offer Details */}
            <div className="bg-white rounded-2xl border border-orange-200 p-6 shadow-sm" style={{ background: "linear-gradient(135deg, #fff7ed, #fff)" }}>
              <h2 className="font-serif text-xl font-bold text-gray-900 italic mb-3">The Deal</h2>
              <p className="text-lg font-bold text-orange-800 mb-3">{deal.offer_description || deal.description}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-orange-700"><Clock className="w-4 h-4" /><span className="font-semibold">{deal.start_time?.substring(0,5)} - {deal.end_time?.substring(0,5)}</span></div>
                <div className="flex items-center gap-2 text-sm text-orange-700"><Calendar className="w-4 h-4" /><span className="font-semibold">{(deal.days || []).join(", ")}</span></div>
              </div>
              {isLive && remaining && (
                <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm font-bold"><Timer className="w-4 h-4" />Ends in {remaining.hrs}h {remaining.mins}m</div>
              )}
              <div className="mt-3 flex items-center gap-2 text-sm text-orange-600"><Flame className="w-4 h-4" /><span className="font-semibold">{fakeBookings} people booked today</span></div>
            </div>

            {/* Menu Types */}
            {deal.menu_types?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-serif text-lg font-bold text-gray-900 italic mb-3">What You Get</h2>
                <div className="flex flex-wrap gap-2">
                  {deal.menu_types.map((m: string) => (
                    <span key={m} className="px-4 py-2 rounded-xl bg-orange-50 text-orange-800 text-sm font-semibold flex items-center gap-2">
                      {m === "Food" ? <UtensilsCrossed className="w-4 h-4" /> : m === "Drinks" ? <Coffee className="w-4 h-4" /> : <Tag className="w-4 h-4" />}{m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* About */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-serif text-lg font-bold text-gray-900 italic mb-3">About {deal.business_name}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{deal.description || "A wonderful dining experience awaits you."}</p>
              {deal.city && <p className="text-xs text-gray-400 mt-3 flex items-center gap-1"><MapPin className="w-3 h-3" />{deal.city}</p>}
            </div>

            {/* Wedding Cross-sell */}
            <div className="rounded-2xl p-6 text-center" style={{ background: "linear-gradient(135deg, #FE6972, #d44a54)" }}>
              <Sparkles className="w-6 h-6 text-white mx-auto mb-2" />
              <h3 className="font-serif text-lg font-bold text-white italic mb-1">Love this place?</h3>
              <p className="text-white/70 text-xs mb-4">Turn your favorite spot into your wedding venue</p>
              <Link href="/plan" className="inline-flex items-center gap-2 bg-white px-6 py-2.5 rounded-full text-xs font-bold" style={{ color: "#FE6972" }}>
                <Sparkles className="w-3.5 h-3.5" />Plan My Wedding Here
              </Link>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-[320px] shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">

              {/* Booking Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="text-center mb-4">
                  <div className="inline-block px-4 py-1.5 rounded-full text-sm font-bold text-white mb-2" style={{ background: "#f97316" }}>{fmtDiscount()}</div>
                  {deal.price_min && <p className="text-xs text-gray-400">Starting from {Number(deal.price_min).toLocaleString()} EGP</p>}
                </div>

                {!booked ? (
                  <>
                    <button onClick={() => setShowBooking(!showBooking)} className="w-full py-3 rounded-xl text-sm font-bold text-white shadow-lg flex items-center justify-center gap-2 transition" style={{ background: "#f97316" }}>
                      <Calendar className="w-4 h-4" />Book This Deal
                    </button>
                    
                    {showBooking && (
                      <div className="mt-3 space-y-2">
                        <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
                        <div className="flex gap-2">
                          <input type="number" placeholder="Guests" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
                          <input type="time" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
                        </div>
                        <input type="text" placeholder="Your name" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
                        <input type="tel" placeholder="Phone number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
                        <button onClick={() => setBooked(true)} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: "#f97316" }}>Confirm Booking</button>
                      </div>
                    )}

                    <button className="w-full py-3 rounded-xl text-sm font-bold border mt-2 flex items-center justify-center gap-2 transition" style={{ color: "#f97316", borderColor: "#f97316" }}>
                      <MessageCircle className="w-4 h-4" />Contact Venue
                    </button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 rounded-full bg-green-100 mx-auto mb-3 flex items-center justify-center"><Check className="w-7 h-7 text-green-600" /></div>
                    <p className="font-bold text-gray-900 text-sm">Booking Confirmed!</p>
                    <p className="text-xs text-gray-500 mt-1">The venue will contact you shortly</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  {isLive && <div className="flex items-center gap-2 text-xs text-red-600 font-semibold"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />Live Now</div>}
                  <div className="flex items-center gap-2 text-xs text-gray-500"><Shield className="w-3.5 h-3.5" />Verified Venue</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500"><Star className="w-3.5 h-3.5" />{deal.rating} rating ({deal.reviews_count} reviews)</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500"><Flame className="w-3.5 h-3.5" />{fakeBookings} bookings today</div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Info</h3>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400" />{deal.city}</div>
                  <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-gray-400" />{deal.start_time?.substring(0,5)} - {deal.end_time?.substring(0,5)}</div>
                  <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-gray-400" />{(deal.days || []).join(", ")}</div>
                  <div className="flex items-center gap-2"><TypeIcon className="w-3.5 h-3.5 text-gray-400" />{deal.restaurant_type}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-200 px-4 py-3 flex gap-2 z-40 shadow-lg">
        <button className="flex-1 py-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1" style={{ color: "#f97316", borderColor: "#f97316" }}><MessageCircle className="w-4 h-4" />Contact</button>
        <button onClick={() => setShowBooking(true)} className="flex-1 py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1" style={{ background: "#f97316" }}><Calendar className="w-4 h-4" />Book Deal</button>
      </div>
    </div>
  );
}
