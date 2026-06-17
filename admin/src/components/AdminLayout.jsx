import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  pages: "Pages",
  blocks: "Blocks",
  components: "Components",
  media: "Media Library",
  settings: "Settings",
  users: "Users",
  vendors: "Vendors",
  "vendor-list": "All Vendors",
  "vendor-approvals": "Pending Approvals",
  listings: "Listings",
  contracts: "Fee Contracts",
  calendar: "Vendor Calendar",
  leads: "Lead Pipeline",
  reports: "Financial Reports",
  analytics: "Broker Analytics",
};

const PAGE_BREADCRUMBS = {
  dashboard: ["Admin"],
  pages: ["Admin", "Content", "Pages"],
  blocks: ["Admin", "Content", "Blocks"],
  components: ["Admin", "Content", "Components"],
  media: ["Admin", "Media"],
  settings: ["Admin", "Settings"],
  users: ["Admin", "Users"],
  vendors: ["Admin", "Vendors"],
  "vendor-list": ["Admin", "Vendors", "All"],
  "vendor-approvals": ["Admin", "Vendors", "Approvals"],
  listings: ["Admin", "Listings"],
  contracts: ["Admin", "Contracts"],
  calendar: ["Admin", "Calendar"],
  leads: ["Admin", "Leads"],
  reports: ["Admin", "Reports"],
  analytics: ["Admin", "Analytics"],
};

export default function AdminLayout({ activePage, onNavigate, children, user, onLogout, lang, onToggleLang }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        user={user}
        onLogout={onLogout}
      />
      <div style={{
        marginLeft: collapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)",
        flex: 1,
        transition: "margin-left var(--transition-normal)",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}>
        <TopBar
          title={PAGE_TITLES[activePage] || "Dashboard"}
          breadcrumbs={PAGE_BREADCRUMBS[activePage] || ["Admin"]}
          lang={lang}
          onToggleLang={onToggleLang}
        />
        <main style={{
          flex: 1,
          padding: 24,
          maxWidth: 1400,
          width: "100%",
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
