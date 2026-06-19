"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

export default function VendorLogin() {
  const router = useRouter();
  const [form,       setForm]       = useState({ email: "", password: "" });
  const [showPwd,    setShowPwd]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) { setError("Please enter your email and password."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(API + "/api/services/vendor/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success && data.data?.vendor?.id) {
        const v = data.data.vendor;
        localStorage.setItem("vendorId",    v.id.toString());
        localStorage.setItem("vendor_id",   v.id.toString());
        localStorage.setItem("vendorToken", data.data.token || "");
        router.push("/vendor/dashboard");
      } else {
        setError(data.message || data.error || "Invalid email or password. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)" }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#FE6972" }}>
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <span className="text-white font-bold text-xl" style={{ fontFamily: "'Playfair Display',serif" }}>Rose Bazaar</span>
        </Link>

        <div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Playfair Display',serif" }}>
            Grow Your<br />Wedding Business
          </h2>
          <p className="text-white/60 text-lg mb-8">Connect with thousands of couples planning their perfect wedding across Egypt.</p>
          <div className="space-y-4">
            {[
              { icon: "✓", text: "3 free listings every month" },
              { icon: "✓", text: "Real-time lead notifications" },
              { icon: "✓", text: "Admin-verified marketplace trust" },
              { icon: "✓", text: "Sponsored placement options" },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#FE6972", color: "#fff" }}>{item.icon}</div>
                <span className="text-white/70 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs">Rose Bazaar Vendor Portal © 2026</p>
      </div>

      {/* Right panel — login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FE6972" }}>
                <span className="text-white font-bold">R</span>
              </div>
              <span className="text-white font-bold text-lg" style={{ fontFamily: "'Playfair Display',serif" }}>Rose Bazaar</span>
            </Link>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display',serif" }}>Welcome Back</h1>
            <p className="text-white/40 text-sm mb-6">Sign in to your vendor account</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-white/60 text-xs font-semibold block mb-1.5">Email Address</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com" autoComplete="email"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>

              <div>
                <label className="text-white/60 text-xs font-semibold block mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPwd ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••" autoComplete="current-password"
                    className="w-full rounded-xl px-4 py-3 pr-10 text-sm text-white outline-none transition"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl p-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "#FE6972" }}>
                {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <LogIn className="w-4 h-4" />}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-center text-white/40 text-xs mb-3">Don't have an account?</p>
              <Link href="/vendor/register" className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition"
                style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}>
                Create Vendor Account
              </Link>
            </div>
          </div>

          <p className="text-center text-white/20 text-xs mt-6">
            <Link href="/" className="hover:text-white/40 transition">← Back to Rose Bazaar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
