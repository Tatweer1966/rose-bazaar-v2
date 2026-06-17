"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Menu, X } from "lucide-react";

const API = "http://localhost:9000";

interface NavLink { href: string; label: string; label_ar?: string; has_mega?: boolean; highlight?: boolean; }
interface NavData { links: NavLink[]; cta_text: string; cta_text_ar: string; cta_href: string; }

export default function Navbar() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [nav, setNav] = useState<NavData | null>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch(`${API}/api/cms/settings/navbar`)
      .then(r => r.json())
      .then(d => { if (d.success) setNav(d.data.value); })
      .catch(() => {});
  }, []);

  const showSolid = scrolled || !isHome;
  const links = nav?.links || [];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${showSolid ? "bg-white shadow-md !important !important" : "bg-transparent"}`} style={{"--pink":"#FE6972"} as any}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo.png" alt="Rose Bazaar" width={34} height={34} className="shrink-0" />
            <span className="font-serif font-bold text-lg tracking-tight transition-colors" style={{ color: showSolid ? "#FE6972" : "white" }}>Rose Bazaar</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link key={link.href} href={link.href}
                className="px-3.5 py-2 rounded-lg text-sm font-medium transition" style={{ color: link.highlight ? "#D4AF37" : "#FE6972" }}>
                {lang === "ar" ? (link.label_ar || link.label) : link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <button onClick={() => setLang(l => l === "en" ? "ar" : "en")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition border" style={{ color: showSolid ? "#FE6972" : "rgba(255,255,255,0.9)", borderColor: showSolid ? "rgba(254,105,114,0.2)" : "rgba(255,255,255,0.25)" }}>
              <Globe className="w-3.5 h-3.5" />
              {lang === "en" ? "????" : "EN"}
            </button>
            {nav && (
              <Link href={nav.cta_href || "/vendor/login"}
                className="hidden sm:block bg-[#FE6972] hover:bg-[#e55560] text-white px-5 py-2 rounded-full text-xs font-bold transition shadow-sm">
                {lang === "ar" ? nav.cta_text_ar : nav.cta_text}
              </Link>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-1">
              {mobileOpen
                ? <X className={`w-5 h-5 ${showSolid ? "text-pink-500" : "text-white"}`} />
                : <Menu className={`w-5 h-5 ${showSolid ? "text-pink-500" : "text-white"}`} />
              }
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className={`md:hidden border-t px-4 py-3 ${showSolid ? "bg-white border-gray-100" : "bg-gray-900/95 backdrop-blur-lg border-white/10"}`}>
          {links.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
              className={`block py-2.5 text-sm font-medium border-b last:border-0 ${showSolid ? "text-[#FE6972] border-gray-50" : "text-white/90 border-white/5"}`}>
              {lang === "ar" ? (link.label_ar || link.label) : link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
