import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const COLORS = {
  success: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.3)", icon: "#22c55e" },
  error: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", icon: "#ef4444" },
  info: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.3)", icon: "#6366f1" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: "fixed", top: 20, right: 20, zIndex: 9999,
        display: "flex", flexDirection: "column", gap: 10, maxWidth: 360,
      }}>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const Icon = ICONS[toast.type] || Info;
  const colors = COLORS[toast.type] || COLORS.info;

  return (
    <div className="toast-enter" style={{
      background: "var(--card-bg)",
      border: `1px solid ${colors.border}`,
      borderRadius: "var(--radius-md)",
      padding: "12px 16px",
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      minWidth: 280,
    }}>
      <Icon size={18} style={{ color: colors.icon, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, color: "var(--slate-700)", fontFamily: "'DM Sans', sans-serif" }}>
        {toast.message}
      </span>
      <button onClick={() => onRemove(toast.id)} style={{
        background: "none", border: "none", cursor: "pointer", color: "var(--slate-400)", padding: 2,
      }} aria-label="Dismiss"><X size={14} /></button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
