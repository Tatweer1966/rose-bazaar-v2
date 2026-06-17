"use client";
import React from 'react';
import { useLang } from "@/components/LangContext";
import { useState, createContext, useContext } from "react";
import Link from "next/link";
import { Search, Calendar, MapPin, Star, ArrowRight, ChevronRight, Heart, Camera, Building2, Utensils, Music, Palette, Shirt, Package, Sparkles, Quote, Check, Users, Award, Mail, Globe } from "lucide-react";

// ═══ BILINGUAL CONTENT ═══
const T = {
  hero: {
    badge: { en: "The Premier Wedding Marketplace", ar: "سوق الأعراس الأول" },
    title1: { en: "Where Love Blossoms", ar: "حيث يزدهر الحب" },
    title2: { en: "& Dreams Come True", ar: "والأحلام تتحقق" },
    subtitle: { en: "Find the perfect vendors for your special day. Trusted by thousands of couples across Egypt.", ar: "اعثر على أفضل مقدمي الخدمات ليومك المميز. موثوق من آلاف الأزواج في مصر." },
    search_placeholder: { en: "What service?", ar: "ما الخدمة؟" },
    search_btn: { en: "Search", ar: "بحث" },
    popular: { en: "Popular:", ar: "الأكثر بحثاً:" },
    tabs: { services: { en: "Services", ar: "خدمات" }, venues: { en: "Venues", ar: "قاعات" }, shop: { en: "Shop", ar: "متجر" } },
  },
  planner: {
    title: { en: "Plan Your Wedding in 3 Simple Steps", ar: "خطط لزفافك في 3 خطوات بسيطة" },
    subtitle: { en: "Tell us your needs and get matched with perfect vendors", ar: "أخبرنا باحتياجاتك واحصل على أفضل مقدمي الخدمات" },
    steps: [
      { title: { en: "Wedding Date & Budget", ar: "تاريخ الزفاف والميزانية" }, desc: { en: "Set your date and budget range", ar: "حدد تاريخك ونطاق ميزانيتك" } },
      { title: { en: "Services Needed", ar: "الخدمات المطلوبة" }, desc: { en: "Choose what you need", ar: "اختر ما تحتاجه" } },
      { title: { en: "Get Matched", ar: "احصل على عروض" }, desc: { en: "Receive vendor proposals", ar: "استقبل عروض مقدمي الخدمات" } },
    ],
    cta: { en: "Start Planning", ar: "ابدأ التخطيط" },
  },
  categories: {
    title: { en: "Explore Categories", ar: "استكشف الفئات" },
    subtitle: { en: "Everything you need for your perfect wedding", ar: "كل ما تحتاجه لزفافك المثالي" },
    items: [
      { name: { en: "Photography", ar: "تصوير" }, icon: "Camera", count: 45, slug: "photography", color: "#FE6972" },
      { name: { en: "Venues", ar: "قاعات" }, icon: "Building2", count: 32, slug: "venues", color: "#D4AF37" },
      { name: { en: "Catering", ar: "ضيافة" }, icon: "Utensils", count: 28, slug: "catering", color: "#6366f1" },
      { name: { en: "Planning", ar: "تنظيم" }, icon: "Sparkles", count: 18, slug: "planning", color: "#22c55e" },
      { name: { en: "Fashion", ar: "أزياء" }, icon: "Shirt", count: 55, slug: "attire", color: "#f59e0b" },
      { name: { en: "Decorations", ar: "ديكور" }, icon: "Palette", count: 38, slug: "decorations", color: "#ec4899" },
      { name: { en: "Entertainment", ar: "ترفيه" }, icon: "Music", count: 22, slug: "entertainment", color: "#8b5cf6" },
      { name: { en: "Rentals", ar: "تأجير" }, icon: "Package", count: 15, slug: "rentals", color: "#14b8a6" },
    ],
    vendors_label: { en: "vendors", ar: "مورد" },
  },
  featured: {
    title: { en: "Featured Vendors", ar: "مقدمو خدمات مميزون" },
    subtitle: { en: "Handpicked top-rated wedding professionals", ar: "أفضل محترفي الزفاف المختارين بعناية" },
    view_all: { en: "View All", ar: "عرض الكل" },
    verified: { en: "Verified", ar: "موثق" },
  },
  packages: {
    title: { en: "Wedding Packages", ar: "باقات الزفاف" },
    subtitle: { en: "All-inclusive packages for every budget", ar: "باقات شاملة لكل ميزانية" },
    popular: { en: "Most Popular", ar: "الأكثر شعبية" },
    view: { en: "View Package", ar: "عرض الباقة" },
    items: [
      { name: { en: "Budget Wedding", ar: "زفاف اقتصادي" }, price: "10,000", includes: [{ en: "Basic Venue", ar: "قاعة أساسية" }, { en: "Photography (4hrs)", ar: "تصوير (4 ساعات)" }, { en: "Simple Decor", ar: "ديكور بسيط" }], color: "#6366f1" },
      { name: { en: "Standard Wedding", ar: "زفاف قياسي" }, price: "30,000", includes: [{ en: "Premium Venue", ar: "قاعة فاخرة" }, { en: "Full Day Photo", ar: "تصوير يوم كامل" }, { en: "Catering (100)", ar: "ضيافة (100 شخص)" }, { en: "Decor & Flowers", ar: "ديكور وزهور" }], color: "#FE6972", popular: true },
      { name: { en: "Luxury Wedding", ar: "زفاف فاخر" }, price: "100,000", includes: [{ en: "5-Star Venue", ar: "قاعة 5 نجوم" }, { en: "Photo + Video", ar: "تصوير + فيديو" }, { en: "Premium Catering", ar: "ضيافة فاخرة" }, { en: "Full Planning", ar: "تنظيم كامل" }, { en: "Entertainment", ar: "ترفيه" }], color: "#D4AF37" },
    ],
  },
  quotes: {
    title: { en: "Get Free Quotes from Trusted Vendors", ar: "احصل على عروض أسعار مجانية من موردين موثوقين" },
    subtitle: { en: "Tell us your needs and receive personalized offers", ar: "أخبرنا باحتياجاتك واستقبل عروض مخصصة" },
    btn: { en: "Get Free Quotes", ar: "احصل على عروض مجانية" },
    budget: { en: "Budget Range", ar: "نطاق الميزانية" },
    services: { en: "Services Needed", ar: "الخدمات المطلوبة" },
  },
  testimonials: {
    title: { en: "Loved by Couples", ar: "محبوب من الأزواج" },
    items: [
      { name: { en: "Ahmed & Sara", ar: "أحمد وسارة" }, text: { en: "Found our dream venue in minutes! Rose Bazaar made wedding planning so easy.", ar: "وجدنا قاعة أحلامنا في دقائق! روز بازار جعل تخطيط الزفاف سهلاً جداً." } },
      { name: { en: "Khalid & Noura", ar: "خالد ونورة" }, text: { en: "The vendor matching was incredible. We saved thousands.", ar: "مطابقة مقدمي الخدمات كانت رائعة. وفرنا آلاف الجنيهات." } },
      { name: { en: "Omar & Layla", ar: "عمر وليلى" }, text: { en: "Best wedding marketplace in Egypt.", ar: "أفضل سوق للأعراس في مصر." } },
    ],
  },
  how: {
    title: { en: "How It Works", ar: "كيف يعمل" },
    steps: [
      { title: { en: "Search Vendors", ar: "ابحث عن موردين" }, desc: { en: "Browse our marketplace", ar: "تصفح سوقنا" } },
      { title: { en: "Request Quotes", ar: "اطلب عروض أسعار" }, desc: { en: "Get personalized offers", ar: "احصل على عروض مخصصة" } },
      { title: { en: "Book Your Wedding", ar: "احجز زفافك" }, desc: { en: "Secure your dream team", ar: "احجز فريق أحلامك" } },
    ],
  },
  stats: [
    { value: "50,000+", label: { en: "Vendors", ar: "مورد" } },
    { value: "200,000+", label: { en: "Weddings Planned", ar: "حفل زفاف" } },
    { value: "4.8", label: { en: "Average Rating", ar: "متوسط التقييم" } },
    { value: "#1", label: { en: "In Egypt", ar: "في مصر" } },
  ],
  vendor_cta: {
    title: { en: "Grow Your Business With Us", ar: "نمّ عملك معنا" },
    subtitle: { en: "Join thousands of vendors getting bookings on Rose Bazaar", ar: "انضم لآلاف الموردين الذين يحصلون على حجوزات عبر روز بازار" },
    btn: { en: "List Your Service", ar: "سجل خدمتك" },
    features: [
      { en: "Free trial", ar: "تجربة مجانية" },
      { en: "3 free listings", ar: "3 إعلانات مجانية" },
      { en: "Reach thousands of couples", ar: "تواصل مع آلاف الأزواج" },
      { en: "Easy dashboard", ar: "لوحة تحكم سهلة" },
    ],
  },
  footer: {
    desc: { en: "Egypt's premier wedding marketplace. Connecting couples with the best vendors.", ar: "سوق الأعراس الأول في مصر. نربط الأزواج بأفضل مقدمي الخدمات." },
    explore: { en: "Explore", ar: "استكشف" },
    for_vendors: { en: "For Vendors", ar: "للموردين" },
    connect: { en: "Connect", ar: "تواصل" },
  },
};

const ICONS = { Camera, Building2, Utensils, Sparkles, Shirt, Palette, Music, Package };

const VENDORS = [
  { name: "Grand Plaza Hall", category: { en: "Venues", ar: "قاعات" }, rating: 4.9, reviews: 128, price: "15,000+ EGP", image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400", badge: { en: "Top Vendor", ar: "مورد متميز" }, verified: true },
  { name: "Lens of Love", category: { en: "Photography", ar: "تصوير" }, rating: 4.8, reviews: 95, price: "3,500+ EGP", image: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400", badge: { en: "Featured", ar: "مميز" }, verified: true },
  { name: "Bloom & Petal", category: { en: "Flowers", ar: "زهور" }, rating: 4.7, reviews: 72, price: "450+ EGP", image: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400", badge: { en: "Featured", ar: "مميز" }, verified: true },
  { name: "Elegance Planners", category: { en: "Planning", ar: "تنظيم" }, rating: 4.9, reviews: 64, price: "25,000+ EGP", image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400", badge: { en: "Top Vendor", ar: "مورد متميز" }, verified: true },
];

export default function Home() {
  const { lang } = useLang();
  const [slide, setSlide] = useState(0);
  React.useEffect(() => { const t = setInterval(() => setSlide(s => (s + 1) % 6), 4000); return () => clearInterval(t); }, []);
  const [tab, setTab] = useState("services");
  const dir = lang === "ar" ? "rtl" : "ltr";
  const font = lang === "ar" ? "'Noto Naskh Arabic', 'Playfair Display', serif" : "'Playfair Display', serif";

  return (
    <div className="bg-[#FFF8F0]" dir={dir}>

      {/* HERO with Video + Animations */}
      <section className="relative text-white overflow-hidden min-h-[85vh] flex items-center">
        {/* Image Slideshow */}
        {["/rose7.png","/rose8.png","/rose9.png","/rose10.png","/rose11.png","/rose12.png"].map((src,i)=>(
          <img key={src} src={src} alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i===slide?"opacity-100":"opacity-0"}`}/>
        ))}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-black/45"/>
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl animate-pulse"/>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"/>
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-[#D4AF37] rounded-full animate-ping"/>
        <div className="absolute top-2/3 left-1/3 w-1.5 h-1.5 bg-white/60 rounded-full animate-ping" style={{animationDelay:"1s"}}/>
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-[#D4AF37]/80 rounded-full animate-ping" style={{animationDelay:"2s"}}/>
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
          <div className="inline-block bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-white/20" style={{animation:"fadeInUp 0.8s ease-out"}}>
            <Sparkles className="w-3.5 h-3.5 inline mr-1.5"/>{T.hero.badge[lang]}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight" style={{animation:"fadeInUp 1s ease-out", fontFamily:font}}>
            {T.hero.title1[lang]}<br/><span className="text-[#D4AF37]">{T.hero.title2[lang]}</span>
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto" style={{animation:"fadeInUp 1.2s ease-out"}}>{T.hero.subtitle[lang]}</p>

          <div className="max-w-3xl mx-auto">
            <div className="flex gap-1 mb-3 justify-center">
              {(["services","venues","shop"] as const).map(t=>(
                <button key={t} onClick={()=>setTab(t)} className={`px-5 py-2 rounded-t-lg text-sm font-semibold capitalize ${tab===t?"bg-white text-[#FE6972]":"bg-white/10 text-white/80"}`}>{T.hero.tabs[t][lang]}</button>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-3 shadow-xl flex flex-wrap gap-2">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 flex-1 min-w-[150px]">
                <Search className="w-4 h-4 text-gray-400"/>
                <input placeholder={T.hero.search_placeholder[lang]} className="bg-transparent outline-none text-sm text-gray-700 w-full"/>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 flex-1 min-w-[120px]">
                <MapPin className="w-4 h-4 text-gray-400"/>
                <select className="bg-transparent outline-none text-sm text-gray-700 w-full">
                  <option>{lang==="ar"?"القاهرة":"Cairo"}</option>
                  <option>{lang==="ar"?"الإسكندرية":"Alexandria"}</option>
                  <option>{lang==="ar"?"الجيزة":"Giza"}</option>
                </select>
              </div>
              <button className="bg-[#FE6972] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
                <Search className="w-4 h-4"/>{T.hero.search_btn[lang]}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PLANNER */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3" style={{fontFamily:font}}>{T.planner.title[lang]}</h2>
          <p className="text-gray-500 mb-10">{T.planner.subtitle[lang]}</p>
          <div className="grid md:grid-cols-3 gap-6">
            {T.planner.steps.map((s,i)=>(
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold" style={{background:["#FE6972","#D4AF37","#22c55e"][i]}}>{i+1}</div>
                <h3 className="font-semibold text-lg">{s.title[lang]}</h3>
                <p className="text-gray-500 text-sm mt-2">{s.desc[lang]}</p>
              </div>
            ))}
          </div>
          <button className="mt-8 bg-[#FE6972] text-white px-8 py-3.5 rounded-xl text-sm font-bold inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4"/>{T.planner.cta[lang]}
          </button>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-14 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2" style={{fontFamily:font}}>{T.categories.title[lang]}</h2>
          <p className="text-gray-500 text-center mb-10">{T.categories.subtitle[lang]}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {T.categories.items.map(c=>{
              const Icon = ICONS[c.icon as keyof typeof ICONS] || Package;
              return (
                <Link key={c.slug} href="/services" className="group bg-gray-50 hover:bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg text-center">
                  <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{background:c.color+"15"}}>
                    <Icon className="w-6 h-6" style={{color:c.color}}/>
                  </div>
                  <h3 className="font-semibold text-sm">{c.name[lang]}</h3>
                  <p className="text-xs text-gray-400 mt-1">{c.count} {T.categories.vendors_label[lang]}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED VENDORS */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold" style={{fontFamily:font}}>{T.featured.title[lang]}</h2>
              <p className="text-gray-500 mt-1">{T.featured.subtitle[lang]}</p>
            </div>
            <Link href="/vendors" className="text-[#FE6972] text-sm font-semibold flex items-center gap-1">{T.featured.view_all[lang]} <ArrowRight className="w-4 h-4"/></Link>
          </div>
          <div className="grid md:grid-cols-4 gap-5">
            {VENDORS.map(v=>(
              <div key={v.name} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl">
                <div className="relative h-48 overflow-hidden">
                  <img src={v.image} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                  <span className="absolute top-3 left-3 bg-[#D4AF37] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{v.badge[lang]}</span>
                  {v.verified&&<span className="absolute top-3 right-3 bg-white/90 text-[10px] font-semibold px-2 py-1 rounded-full text-green-600 flex items-center gap-1"><Check className="w-3 h-3"/>{T.featured.verified[lang]}</span>}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{v.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{v.category[lang]}</p>
                  <div className="flex justify-between">
                    <span className="text-sm font-bold">{v.price}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500"><Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]"/>{v.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section className="py-16 px-6 bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3" style={{fontFamily:font}}>{T.packages.title[lang]}</h2>
          <p className="text-white/60 mb-10">{T.packages.subtitle[lang]}</p>
          <div className="grid md:grid-cols-3 gap-6">
            {T.packages.items.map(p=>(
              <div key={p.name.en} className={`rounded-2xl p-6 border ${p.popular?"bg-white text-gray-900 border-[#FE6972] shadow-xl scale-105":"bg-white/5 border-white/10"}`}>
                {p.popular&&<div className="text-[#FE6972] text-xs font-bold mb-2">{T.packages.popular[lang]}</div>}
                <h3 className="text-xl font-bold">{p.name[lang]}</h3>
                <div className="text-3xl font-bold my-4">{p.price} <span className="text-sm font-normal opacity-60">EGP</span></div>
                <ul className="text-sm space-y-2 mb-6 text-start">{p.includes.map(i=><li key={i.en} className="flex items-center gap-2"><Check className="w-4 h-4 shrink-0" style={{color:p.color}}/>{i[lang]}</li>)}</ul>
                <button className={`w-full py-2.5 rounded-xl text-sm font-bold ${p.popular?"bg-[#FE6972] text-white":"bg-white/10"}`}>{T.packages.view[lang]}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GET QUOTES */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#FE6972] to-[#d44a54] rounded-3xl p-10 md:p-14 text-white text-center shadow-2xl">
          <h2 className="text-3xl font-bold mb-3" style={{fontFamily:font}}>{T.quotes.title[lang]}</h2>
          <p className="text-white/80 mb-8">{T.quotes.subtitle[lang]}</p>
          <button className="bg-white text-[#FE6972] px-10 py-3.5 rounded-xl text-sm font-bold inline-flex items-center gap-2">
            <Mail className="w-4 h-4"/>{T.quotes.btn[lang]}
          </button>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-10" style={{fontFamily:font}}>{T.testimonials.title[lang]}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {T.testimonials.items.map(t=>(
              <div key={t.name.en} className="bg-[#FFF8F0] rounded-2xl p-6 border border-[#FE6972]/10">
                <Quote className="w-8 h-8 text-[#FE6972]/20 mb-3"/>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">\"{t.text[lang]}\"</p>
                <div className="flex items-center gap-1 mb-2 justify-center">{[...Array(5)].map((_,i)=><Star key={i} className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]"/>)}</div>
                <p className="font-semibold text-gray-900 text-sm">{t.name[lang]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-10" style={{fontFamily:font}}>{T.how.title[lang]}</h2>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 justify-center">
            {T.how.steps.map((s,i)=>(
              <div key={i} className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#FE6972] text-white flex items-center justify-center font-bold text-lg">{i+1}</div>
                  <h4 className="font-semibold mt-3 text-sm">{s.title[lang]}</h4>
                  <p className="text-xs text-gray-500 mt-1">{s.desc[lang]}</p>
                </div>
                {i<2&&<ChevronRight className="w-6 h-6 text-gray-300 hidden md:block"/>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 px-6 bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {T.stats.map(s=>(
            <div key={s.label.en}>
              <div className="text-2xl md:text-3xl font-bold">{s.value}</div>
              <div className="text-white/50 text-sm mt-1">{s.label[lang]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* VENDOR CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#D4AF37] to-[#b8962e] rounded-3xl p-10 md:p-14 text-white text-center">
          <h2 className="text-3xl font-bold mb-3" style={{fontFamily:font}}>{T.vendor_cta.title[lang]}</h2>
          <p className="text-white/80 mb-6">{T.vendor_cta.subtitle[lang]}</p>
          <div className="flex flex-wrap gap-4 justify-center mb-8 text-sm">
            {T.vendor_cta.features.map(f=>(
              <span key={f.en} className="bg-white/15 px-4 py-2 rounded-full flex items-center gap-2"><Check className="w-3.5 h-3.5"/>{f[lang]}</span>
            ))}
          </div>
          <Link href="/vendor/login" className="inline-flex items-center gap-2 bg-white text-[#D4AF37] px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg">
            {T.vendor_cta.btn[lang]} <ArrowRight className="w-4 h-4"/>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-14 px-6 border-t-4 border-[#FE6972] bg-white">
        <div className="max-w-6xl mx-auto mb-8 flex justify-center">
          <img src="/logo.png" alt="Rose Bazaar" width={60} height={60} />
        </div>
        <div className="max-w-6xl mx-auto grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4" style={{fontFamily:font}}>Rose Bazaar</h3>
            <p className="text-white/50 text-sm">{T.footer.desc[lang]}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm text-[#FE6972]">{T.footer.explore[lang]}</h4>
            <ul className="space-y-2 text-sm text-[#FE6972]/60">
              <li><Link href="/services">{lang==="ar"?"الخدمات":"Services"}</Link></li>
              <li><Link href="/venues">{lang==="ar"?"القاعات":"Venues"}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm text-[#FE6972]">{T.footer.for_vendors[lang]}</h4>
            <ul className="space-y-2 text-sm text-[#FE6972]/60">
              <li><Link href="/vendor/login">{T.vendor_cta.btn[lang]}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm text-[#FE6972]">{T.footer.connect[lang]}</h4>
            <ul className="space-y-2 text-sm text-[#FE6972]/60"><li>Facebook</li><li>Instagram</li><li>TikTok</li></ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-pink-100 text-xs text-[#FE6972]/40">
          <p>&copy; 2026 Rose Bazaar</p>
        </div>
      </footer>
    </div>
  );
}

