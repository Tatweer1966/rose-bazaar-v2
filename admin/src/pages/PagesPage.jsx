import { useState, useEffect } from "react";
import { Plus, Edit3, Eye, History, Globe, GlobeLock, Trash2 } from "lucide-react";
import DataTable from "../components/DataTable";

export default function PagesPage({ cmsApi }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPages(); }, []);

  async function loadPages() {
    setLoading(true);
    try {
      const res = await cmsApi.getPages();
      setPages(res?.data?.data || res?.data || []);
    } catch (e) {
      console.error("loadPages error", e);
      // Demo data
      setPages([
        { id: 1, slug: "/", title: "Home", title_ar: "الرئيسية", status: "published", updated_at: "2026-05-13T12:04:51Z" },
        { id: 2, slug: "/about", title: "About", title_ar: "عن روز بازار", status: "published", updated_at: "2026-05-14T18:45:03Z" },
        { id: 3, slug: "/shop", title: "Shop", title_ar: "المتجر", status: "published", updated_at: "2026-05-14T18:45:09Z" },
        { id: 4, slug: "/venues", title: "Venues", title_ar: "القاعات", status: "published", updated_at: "2026-05-14T18:45:07Z" },
        { id: 5, slug: "/services", title: "Services", title_ar: "الخدمات", status: "published", updated_at: "2026-05-14T18:45:06Z" },
        { id: 6, slug: "/vendors", title: "Vendors", title_ar: "مقدمي الخدمات", status: "published", updated_at: "2026-05-14T18:45:05Z" },
        { id: 7, slug: "/happy-hour", title: "Happy Hour", title_ar: "ساعة الحظ", status: "draft", updated_at: "2026-05-14T18:45:08Z" },
      ]);
    } finally { setLoading(false); }
  }

  async function togglePublish(page) {
    try {
      if (page.status === "published") await cmsApi.unpublishPage(page.id);
      else await cmsApi.publishPage(page.id);
      await loadPages();
    } catch (e) {
      // Demo: toggle locally
      setPages(prev => prev.map(p => p.id === page.id ? { ...p, status: p.status === "published" ? "draft" : "published" } : p));
    }
  }

  const columns = [
    { key: "slug", label: "Slug", render: v => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--slate-600, #475569)" }}>{v}</span> },
    { key: "title", label: "Title", render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600, color: "var(--slate-900, #0f172a)" }}>{v}</div>
        {row.title_ar && <div style={{ fontSize: 12, color: "var(--slate-400, #94a3b8)", direction: "rtl" }}>{row.title_ar}</div>}
      </div>
    )},
    { key: "status", label: "Status", render: v => (
      <span style={{
        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
        background: v === "published" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
        color: v === "published" ? "#22c55e" : "#f59e0b",
        display: "inline-flex", alignItems: "center", gap: 4,
      }}>
        {v === "published" ? <Globe size={11} /> : <GlobeLock size={11} />}
        {v === "published" ? "Published" : "Draft"}
      </span>
    )},
    { key: "updated_at", label: "Updated", render: v => v ? (
      <span style={{ fontSize: 12, color: "var(--slate-500, #64748b)" }}>
        {new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </span>
    ) : "—" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--slate-500, #64748b)" }}>{pages.length} pages</div>
        <button style={{
          display: "flex", alignItems: "center", gap: 6, padding: "9px 18px",
          borderRadius: "var(--radius-md, 10px)", background: "var(--coral, #FE6972)", color: "#fff",
          border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
        }}><Plus size={16} /> New Page</button>
      </div>

      {loading ? <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading pages...</div> : (
        <DataTable
          columns={columns}
          data={pages}
          pageSize={10}
          emptyMessage="No pages found"
          actions={row => [
            <button key="edit" style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--card-border, #e2e8f0)", background: "var(--card-bg, #fff)", color: "#6366f1", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Edit3 size={13} /> Edit</button>,
            <button key="versions" style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--card-border, #e2e8f0)", background: "var(--card-bg, #fff)", color: "var(--slate-600, #475569)", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><History size={13} /></button>,
            <button key="publish" onClick={() => togglePublish(row)} style={{
              padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
              background: row.status === "published" ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)",
              color: row.status === "published" ? "#f59e0b" : "#22c55e",
            }}>{row.status === "published" ? "Unpublish" : "Publish"}</button>,
          ]}
        />
      )}
    </div>
  );
}
