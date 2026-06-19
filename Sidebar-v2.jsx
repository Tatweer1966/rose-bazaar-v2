import { useState } from "react";
import {
  LayoutDashboard, FileText, Image, Settings, Users, LogOut,
  ChevronLeft, ChevronRight, ChevronDown, Blocks,
  ShoppingBag, Building2, Flame, Star, Megaphone,
  Shield, AlertTriangle, MessageSquare, Calendar,
  DollarSign, BarChart3, Receipt, Clock, Package
} from "lucide-react";

const LOGO_URL = "https://codewords-uploads.s3.amazonaws.com/runtime_v2/c48d595718ec4f9f88f3ed3836edc7b6a184f7988a8e4a49a2d04ab21bcd0650/rose_bazaar_logo_transparent.png";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },

  // VENDORS
  {
    id: "vendors-group", label: "Vendors", icon: Users,
    children: [
      { id: "vendor-approvals", label: "Pending Approvals", icon: Clock      },
      { id: "vendor-list",      label: "All Vendors",       icon: Users      },
    ]
  },

  // MARKETPLACE (was "Listings")
  {
    id: "marketplace-group", label: "Marketplace", icon: Package,
    children: [
      { id: "marketplace-products", label: "Products",        icon: ShoppingBag },
      { id: "marketplace-services", label: "Services",        icon: Star        },
      { id: "marketplace-venues",   label: "Venues",          icon: Building2   },
      { id: "marketplace-happyhour",label: "Happy Hour",      icon: Flame       },
    ]
  },

  // MODERATION
  {
    id: "moderation-group", label: "Moderation", icon: Shield,
    children: [
      { id: "listings",         label: "Pending Review",   icon: Clock         },
      { id: "reported",         label: "Reported Content", icon: AlertTriangle  },
    ]
  },

  // ADVERTISING
  {
    id: "advertising-group", label: "Advertising", icon: Megaphone,
    children: [
      { id: "sponsored",  label: "Sponsored Placements", icon: Megaphone },
      { id: "contracts",  label: "Subscriptions",        icon: Receipt   },
    ]
  },

  // OPERATIONS
  { id: "leads",     label: "Lead Pipeline", icon: MessageSquare },
  { id: "calendar",  label: "Calendar",      icon: Calendar      },
  { id: "reports",   label: "Reports",       icon: DollarSign    },
  { id: "analytics", label: "Analytics",     icon: BarChart3     },

  // CMS
  {
    id: "content", label: "Content", icon: FileText,
    children: [
      { id: "pages",      label: "Pages",      icon: FileText },
      { id: "blocks",     label: "Blocks",     icon: Blocks   },
    ]
  },

  { id: "media",    label: "Media",    icon: Image    },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "users",    label: "Users",    icon: Users    },
];

export default function Sidebar({ activePage, onNavigate, collapsed, onToggleCollapse, user, onLogout }) {
  const [expanded, setExpanded] = useState([
    "vendors-group","marketplace-group","moderation-group","advertising-group"
  ]);

  const toggle = id => setExpanded(p => p.includes(id) ? p.filter(g => g !== id) : [...p, id]);
  const isActive = id => activePage === id;
  const isChildActive = children => children?.some(c => isActive(c.id));

  return (
    <aside style={{
      width: collapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)",
      background: "var(--sidebar-bg)",
      height: "100vh",
      position: "fixed",
      left: 0, top: 0,
      display: "flex",
      flexDirection: "column",
      transition: "width var(--transition-normal)",
      zIndex: 40,
      borderRight: "1px solid var(--sidebar-border)",
      overflow: "hidden",
    }}>
      {/* Brand */}
      <div style={{ padding: collapsed ? "18px 12px" : "18px 18px", borderBottom: "1px solid var(--sidebar-border)", display: "flex", alignItems: "center", gap: 10, minHeight: 68 }}>
        <img src={LOGO_URL} alt="Rose Bazaar" style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }} />
        {!collapsed && (
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>Rose Bazaar</div>
            <div style={{ fontSize: 10, color: "var(--slate-500)", whiteSpace: "nowrap" }}>Admin Portal</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 6px", overflowY: "auto" }}>
        {NAV.map(item => {
          const Icon = item.icon;
          const hasChildren = !!item.children?.length;
          const isExp = expanded.includes(item.id);
          const childActive = isChildActive(item.children);
          const active = isActive(item.id) || childActive;

          return (
            <div key={item.id} style={{ marginBottom: 1 }}>
              <button
                onClick={() => hasChildren ? toggle(item.id) : onNavigate(item.id)}
                title={collapsed ? item.label : undefined}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  gap: 9, padding: collapsed ? "9px 14px" : "8px 10px",
                  borderRadius: 8, border: "none",
                  background: active ? "var(--sidebar-active)" : "transparent",
                  color: active ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
                  cursor: "pointer", fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 150ms",
                  justifyContent: collapsed ? "center" : "flex-start",
                  position: "relative",
                }}>
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1, textAlign: "left", fontSize: 13 }}>{item.label}</span>
                    {hasChildren && (
                      <ChevronDown size={12} style={{ transform: isExp ? "rotate(180deg)" : "rotate(0)", transition: "transform 150ms", opacity: 0.5 }} />
                    )}
                  </>
                )}
                {active && (
                  <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 16, borderRadius: 2, background: "var(--coral)" }} />
                )}
              </button>

              {hasChildren && isExp && !collapsed && (
                <div style={{ marginLeft: 16, marginTop: 1, marginBottom: 3, borderLeft: "1px solid rgba(255,255,255,0.07)", paddingLeft: 8 }}>
                  {item.children.map(child => {
                    const CIcon = child.icon;
                    const cActive = isActive(child.id);
                    return (
                      <button key={child.id} onClick={() => onNavigate(child.id)}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 7,
                          padding: "7px 10px", borderRadius: 6, border: "none",
                          background: cActive ? "var(--sidebar-active)" : "transparent",
                          color: cActive ? "var(--sidebar-text-active)" : "rgba(255,255,255,0.55)",
                          cursor: "pointer", fontSize: 12,
                          fontWeight: cActive ? 600 : 400,
                          fontFamily: "'DM Sans', sans-serif",
                          transition: "all 150ms",
                        }}>
                        <CIcon size={13} style={{ flexShrink: 0 }} />
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--sidebar-border)", padding: "8px 6px" }}>
        {!collapsed && user && (
          <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,var(--coral),var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {(user.name || user.email || "A").charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ fontSize: 12, color: "#fff", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name || user.email || "Admin"}</div>
              <div style={{ fontSize: 10, color: "var(--slate-500)", textTransform: "capitalize" }}>{user.role?.replace("_"," ") || "Admin"}</div>
            </div>
          </div>
        )}
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, border: "none", background: "transparent", color: "var(--slate-500)", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans',sans-serif", justifyContent: collapsed ? "center" : "flex-start" }}>
          <LogOut size={15} />{!collapsed && "Logout"}
        </button>
        <button onClick={onToggleCollapse} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 6, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.05)", color: "var(--slate-500)", cursor: "pointer", marginTop: 2 }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
