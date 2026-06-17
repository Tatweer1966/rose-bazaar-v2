import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const LOGO_URL = "https://codewords-uploads.s3.amazonaws.com/runtime_v2/c48d595718ec4f9f88f3ed3836edc7b6a184f7988a8e4a49a2d04ab21bcd0650/rose_bazaar_logo_transparent.png";

export default function AdminLogin() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required"); return; }
    if (!password.trim()) { setError("Password is required"); return; }

    const result = await login(email, password);
    if (!result.success) setError(result.error || "Login failed");
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative orbs */}
      <div style={{
        position: "absolute", top: "-20%", right: "-10%",
        width: 500, height: 500,
        background: "radial-gradient(circle, rgba(254,105,114,0.08) 0%, transparent 70%)",
        borderRadius: "50%",
      }} />
      <div style={{
        position: "absolute", bottom: "-15%", left: "-10%",
        width: 400, height: 400,
        background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)",
        borderRadius: "50%",
      }} />

      <div style={{
        width: 400,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: "40px 36px",
        backdropFilter: "blur(20px)",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={LOGO_URL} alt="Rose Bazaar" style={{ width: 60, height: 60, objectFit: "contain", marginBottom: 12 }} />
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 24, fontWeight: 700,
            color: "#fff", margin: 0,
          }}>Rose Bazaar</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
            Admin Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>
              Email
            </label>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${error && !email ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 10, padding: "0 14px",
              transition: "border-color 200ms",
            }}>
              <Mail size={16} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@rosebazaar.com"
                autoComplete="email"
                style={{
                  flex: 1, padding: "12px 0",
                  background: "transparent", border: "none", outline: "none",
                  color: "#fff", fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 6, display: "block" }}>
              Password
            </label>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${error && !password ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 10, padding: "0 14px",
              transition: "border-color 200ms",
            }}>
              <Lock size={16} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                style={{
                  flex: 1, padding: "12px 0",
                  background: "transparent", border: "none", outline: "none",
                  color: "#fff", fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.3)", padding: 0,
              }} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" style={{
              fontSize: 13, color: "#ef4444",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 8, padding: "8px 12px",
              marginBottom: 16,
            }}>{error}</div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            width: "100%",
            padding: "13px 0",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, var(--coral) 0%, var(--coral-dark) 100%)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 200ms",
          }}>
            {loading && <Loader2 size={18} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
          Rose Bazaar CMS &copy; {new Date().getFullYear()}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
