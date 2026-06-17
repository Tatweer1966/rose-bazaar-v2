import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import AdminLayout from "./components/AdminLayout";
import AdminLogin from "./pages/AdminLogin";
import DashboardHome from "./pages/DashboardHome";
import CmsAdminDashboard from "./pages/CmsAdminDashboard";
import PagesPage from "./pages/PagesPage";
import PageEditor from "./pages/PageEditor";
import BlockEditor from "./pages/BlockEditor";
import MediaManager from "./pages/MediaManager";
import VendorApprovalQueue from "./pages/VendorApprovalQueue";
import ListingManager from "./pages/ListingManager";
import FeeContractManager from "./pages/FeeContractManager";
import VendorCalendar from "./pages/VendorCalendar";
import LeadPipeline from "./pages/LeadPipeline";
import BrokerAnalytics from "./pages/BrokerAnalytics";
import FinancialReports from "./pages/FinancialReports";
import useCmsApi from "./hooks/useCmsApi";

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth();
  const cmsApi = useCmsApi();
  const [activePage, setActivePage] = useState("dashboard");
  const [lang, setLang] = useState("en");
  const [editingPage, setEditingPage] = useState(null);
  const [editingBlocks, setEditingBlocks] = useState(null);

  if (!isAuthenticated) return <AdminLogin />;

  function handleNavigate(page) {
    setActivePage(page);
    setEditingPage(null);
    setEditingBlocks(null);
  }

  function renderPage() {
    if (editingPage) return <PageEditor cmsApi={cmsApi} page={editingPage} onSaved={() => { setEditingPage(null); setActivePage("pages"); }} onCancel={() => setEditingPage(null)} />;
    if (editingBlocks) return <BlockEditor pageId={editingBlocks} onBack={() => setEditingBlocks(null)} />;

    switch (activePage) {
      case "dashboard":
        return <DashboardHome onNavigate={handleNavigate} />;
      case "pages":
        return <PagesPage cmsApi={cmsApi} onEditPage={setEditingPage} onEditBlocks={setEditingBlocks} />;
      case "blocks":
      case "components":
      case "settings":
        return <CmsAdminDashboard key={activePage} cmsApi={cmsApi} initialTab={activePage === "components" ? "components" : activePage === "blocks" ? "blocks" : "settings"} />;
      case "vendors":
      case "vendor-list":
        return <VendorApprovalQueue />;
      case "vendor-approvals":
        return <VendorApprovalQueue />;
      case "contracts":
        return <FeeContractManager />;
      case "calendar":
        return <VendorCalendar />;
      case "leads":
        return <LeadPipeline />;
      case "reports":
        return <FinancialReports />;
      case "analytics":
        return <BrokerAnalytics />;
      case "listings":
        return <ListingManager />;
      case "media":
        return <MediaManager />;
      case "users":
        return (
          <div style={{
            background: "var(--card-bg)", border: "1px solid var(--card-border)",
            borderRadius: "var(--radius-lg)", padding: 40, textAlign: "center",
          }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "var(--slate-900)", marginBottom: 8 }}>
              User Management
            </h2>
            <p style={{ color: "var(--slate-500)", fontSize: 14 }}>Coming soon</p>
          </div>
        );
      default:
        return <DashboardHome onNavigate={handleNavigate} />;
    }
  }

  return (
    <AdminLayout
      activePage={activePage}
      onNavigate={handleNavigate}
      user={user}
      onLogout={logout}
      lang={lang}
      onToggleLang={() => setLang(l => l === "en" ? "ar" : "en")}
    >
      {renderPage()}
    </AdminLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

