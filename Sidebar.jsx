import { useState } from "react";
import {
  LayoutDashboard, FileText, Image, Settings, Users, LogOut,
  ChevronLeft, ChevronRight, ChevronDown, Blocks, Globe, Clock,
  Package, DollarSign, BarChart3, ShoppingBag, Building2,
  Flame, Megaphone, Shield, AlertTriangle, Star, List,
  MessageSquare, Calendar, Receipt
} from "lucide-react";

const LOGO_URL = "https://codewords-uploads.s3.amazonaws.com/runtime_v2/c48d595718ec4f9f88f3ed3836edc7b6a184f7988a8e4a49a2d04ab21bcd0650/rose_bazaar_logo_transparent.png";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },

  // VENDORS
  {
    id: "vendors-group", label: "Vendors", labelAr: "الموردون", icon: Users,
    children: [
      { id: "vendor-approvals", label: "Pending Approvals", labelAr: "طلبات الانتظار", icon: Clock       },
      { id: "vendor-list",      label: "All Vendors",       labelAr: "كل الموردين",    icon: Users       },
    ]
  },

  // LISTINGS
  {
    id: "listings-group", label: "Listings", labelAr: "القوائم", icon: Package,
    children: [
      { id: "listings",          label: "Shop Products",   labelAr: "منتجات المتجر",  icon: ShoppingBag },
      { id: "services-listings", label: "Wedding Services",labelAr: "خدمات الزفاف",   icon: Star        },
      { id: "venues-listings",   label: "Wedding Venues",  labelAr: "قاعات الزفاف",   icon: Building2   },
      { id: "happyhour-listings",label: "Happy Hour",      labelAr: "الساعة السعيدة", icon: Flame       },
    ]
  },

  // MODERATION
  {
    id: "moderation-group", label: "Moderation", labelAr: "الإشراف", icon: Shield,
    children: [
      { id: "listings",         label: "Pending Listings", labelAr: "قوائم معلقة",   icon: Clock        },
      { id: "reported",         label: "Reported Content", labelAr: "محتوى مبلّغ",   icon: AlertTriangle},
    ]
  },

  // ADVERTISING
  {
    id: "advertising-group", label: "Advertising", labelAr: "الإعلانات", icon: Megaphone,
    children: [
      { id: "sponsored",        label: "Sponsored Placements", labelAr: "إعلانات مدفوعة", icon: Megaphone },
      { id: "contracts",        label: "Subscriptions",        labelAr: "الاشتراكات",      icon: Receipt   },
    ]
  },

  // OPERATIONS
  { id: "leads",     label: "Lead Pipeline", labelAr: "خط العملاء",  icon: MessageSquare },
  { id: "calendar",  label: "Calendar",      labelAr: "التقويم",      icon: Calendar      },
  { id: "reports",   label: "Reports",       labelAr: "التقارير",     icon: DollarSign    },
  { id: "analytics", label: "Analytics",     labelAr: "التحليلات",    icon: BarChart3     },

  // CMS
  {
    id: "content", label: "Content", labelAr: "المحتوى", icon: FileText,
    children: [
      { id: "pages",      label: "Pages",      labelAr: "الصفحات",   icon: FileText },
      { id: "blocks",     label: "Blocks",     labelAr: "المكونات",  icon: Blocks   },
      { id: "components", label: "Components", labelAr: "أنواع المكونات", icon: Blocks },
    ]
  },

  { id: "media",    label: "Media",    labelAr: "الوسائط",   icon: Image    },
  { id: "settings", label: "Settings", labelAr: "الإعدادات", icon: Settings },
  { id: "users",    label: "Users",    labelAr: "المستخدمين",icon: Users    },
];

export default function Sidebar({ activePage, onNavigate, collapsed, onToggleCollapse, user, onLogout }) {
  const [expandedGroups, setExpandedGroups] = useState(["vendors-group", "listings-group", "moderation-group", "advertising-group"]);

  const toggleGroup = (id) => {
    setExpandedGroups(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const isActive = (id) => activePage === id;

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
      <div style={{ padding: collapsed ? "20px 12px" : "20px 20px", borderBottom: "1px solid var(--sidebar-border)", display: "flex", alignItems: "center", gap: 12, minHeight: 72 }}>
        <img src={LOGO_URL} alt="Rose Bazaar" style={{ width: 38, height: 38, objectFit: "contain", flexShrink: 0 }} />
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>Rose Bazaar</div>
            <div style={{ fontSize: 11, color: "var(--slate-500)", whiteSpace: "nowrap" }}>Admin Portal</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const hasChildren = item.children?.length > 0;
          const isExpanded = expandedGroups.includes(item.id);
          const isChildActive = hasChildren && item.children.some(c => isActive(c.id));

          return (
            <div key={item.id} style={{ marginBottom: 1 }}>
              <button
                onClick={() => hasChildren ? toggleGroup(item.id) : onNavigate(item.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: collapsed ? "9px 16px" : "9px 10px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: (isActive(item.id) || isChildActive) ? "var(--sidebar-active)" : "transparent",
                  color: (isActive(item.id) || isChildActive) ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: (isActive(item.id) || isChildActive) ? 600 : 400,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all var(--transition-fast)",
                  justifyContent: collapsed ? "center" : "flex-start",
                  position: "relative",
                }}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                    {hasChildren && (
                      <ChevronDown size={14} style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform var(--transition-fast)", opacity: 0.5 }} />
                    )}
                  </>
                )}
                {(isActive(item.id) || isChildActive) && (
                  <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, borderRadius: 2, background: "var(--coral)" }} />
                )}
              </button>

              {/* Children */}
              {hasChildren && isExpanded && !collapsed && (
                <div style={{ marginLeft: 18, marginTop: 1, marginBottom: 2, borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: 8 }}>
                  {item.children.map(child => {
                    const ChildIcon = child.icon;
                    return (
                      <button key={child.id} onClick={() => onNavigate(child.id)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "7px 10px",
                          borderRadius: "var(--radius-sm)",
                          border: "none",
                          background: isActive(child.id) ? "var(--sidebar-active)" : "transparent",
                          color: isActive(child.id) ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: isActive(child.id) ? 600 : 400,
                          fontFamily: "'DM Sans', sans-serif",
                          transition: "all var(--transition-fast)",
                        }}>
                        <ChildIcon size={14} style={{ flexShrink: 0 }} />
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

      {/* User + Collapse */}
      <div style={{ borderTop: "1px solid var(--sidebar-border)", padding: "10px 8px" }}>
        {!collapsed && user && (
          <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--coral), var(--gold))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              {(user.name || user.email || "A").charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ fontSize: 13, color: "#fff", fontWeight: 500, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{user.name || user.email || "Admin"}</div>
              <div style={{ fontSize: 11, color: "var(--slate-500)", textTransform: "capitalize" }}>{user.role?.replace("_", " ") || "Admin"}</div>
            </div>
          </div>
        )}
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--radius-md)", border: "none", background: "transparent", color: "var(--slate-500)", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", transition: "all var(--transition-fast)", justifyContent: collapsed ? "center" : "flex-start" }}>
          <LogOut size={17} />{!collapsed && "Logout"}
        </button>
        <button onClick={onToggleCollapse} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "7px", borderRadius: "var(--radius-md)", border: "none", background: "var(--sidebar-hover)", color: "var(--slate-500)", cursor: "pointer", marginTop: 4 }}>
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>
    </aside>
  );
}
