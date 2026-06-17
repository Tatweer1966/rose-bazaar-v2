"use client";
import { useState } from "react";
export default function VendorLogin() {
  const [email, setEmail] = useState("");
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white" style={{fontFamily:"'Playfair Display',serif"}}>Vendor Portal</h1>
          <p className="text-white/50 text-sm mt-2">List your wedding services on Rose Bazaar</p>
        </div>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm mb-3 outline-none"/>
        <input type="password" placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm mb-4 outline-none"/>
        <button className="w-full bg-[#FE6972] text-white py-3 rounded-xl text-sm font-bold">Sign In</button>
        <p className="text-center text-white/30 text-xs mt-6">Rose Bazaar Vendor Portal &copy; 2026</p>
      </div>
    </div>
  );
}
