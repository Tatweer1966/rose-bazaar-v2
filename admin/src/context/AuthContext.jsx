import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("rb_admin_token"));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rb_admin_user")); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  // Persist token
  useEffect(() => {
    if (token) localStorage.setItem("rb_admin_token", token);
    else localStorage.removeItem("rb_admin_token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("rb_admin_user", JSON.stringify(user));
    else localStorage.removeItem("rb_admin_user");
  }, [user]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch("/api/cms/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Login failed");
      setToken(data.token);
      setUser(data.user || { email, role: data.role || "admin" });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("rb_admin_token");
    localStorage.removeItem("rb_admin_user");
  }, []);

  // Auto-check token validity on mount
  useEffect(() => {
    if (!token) return;
    fetch("/api/cms/auth/me", {
      headers: { Authorization: "Bearer " + token },
    }).then(res => {
      if (!res.ok) logout();
      else res.json().then(data => {
        if (data.user) setUser(data.user);
      }).catch(() => {});
    }).catch(() => {
      // If auth endpoint doesn't exist yet, keep token (backward compat)
    });
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
