import { Search, Bell, Globe, Sun, Moon } from "lucide-react";
import { useState } from "react";

export default function TopBar({ title, breadcrumbs = [], lang = "en", onToggleLang }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header style={{
      height: 64,
      background: "var(--card-bg)",
      borderBottom: "1px solid var(--card-border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      position: "sticky",
      top: 0,
      zIndex: 30,
    }}>
      {/* Left: Breadcrumbs + Title */}
      <div>
        {breadcrumbs.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} style={{ fontSize: 12, color: "var(--slate-400)" }}>
                {crumb}
                {i < breadcrumbs.length - 1 && <span style={{ margin: "0 4px" }}>/</span>}
              </span>
            ))}
          </div>
        )}
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20,
          fontWeight: 600,
          color: "var(--slate-900)",
          margin: 0,
        }}>{title}</h1>
      </div>

      {/* Right: Search + Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Search */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--slate-50)",
          border: "1px solid var(--card-border)",
          borderRadius: "var(--radius-md)",
          padding: "7px 12px",
          width: 220,
          transition: "all var(--transition-fast)",
        }}>
          <Search size={16} style={{ color: "var(--slate-400)", flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 13,
              color: "var(--slate-700)",
              width: "100%",
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>

        {/* Language Toggle */}
        <button
          onClick={onToggleLang}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--card-border)",
            background: "var(--card-bg)",
            color: "var(--slate-600)",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif",
            transition: "all var(--transition-fast)",
          }}
          aria-label={`Switch to ${lang === "en" ? "Arabic" : "English"}`}
        >
          <Globe size={15} />
          {lang === "en" ? "AR" : "EN"}
        </button>

        {/* Notifications */}
        <button
          onClick={() => setShowNotifs(!showNotifs)}
          style={{
            width: 38, height: 38,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--card-border)",
            background: "var(--card-bg)",
            color: "var(--slate-600)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            transition: "all var(--transition-fast)",
          }}
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span style={{
            position: "absolute",
            top: 6, right: 6,
            width: 7, height: 7,
            borderRadius: "50%",
            background: "var(--coral)",
          }} />
        </button>
      </div>
    </header>
  );
}
