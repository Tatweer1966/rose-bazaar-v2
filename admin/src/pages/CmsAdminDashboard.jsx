import React, { useEffect, useMemo, useState } from "react";
import { Settings, FileText, Blocks as BlocksIcon, Layers, ChevronDown, Save, Loader2, Plus, Trash2, ChevronUp, ChevronDown as Down, GripVertical, LayoutGrid, Eye } from "lucide-react";

const LABELS = {
  en: {
    cmsAdmin: "CMS Admin Dashboard", language: "Language", english: "English", arabic: "Arabic",
    settings: "Settings", pages: "Pages", blocks: "Blocks", components: "Component Types",
    save: "Save", saving: "Saving...", add: "Add", remove: "Remove", up: "Up", down: "Down",
    general: "General", seo: "SEO", social: "Social", navbar: "Navbar", footer: "Footer",
    siteName: "Site Name", siteNameAr: "Site Name (AR)", tagline: "Tagline", taglineAr: "Tagline (AR)",
    supportEmail: "Support Email", supportPhone: "Support Phone",
    primaryColor: "Primary Color", secondaryColor: "Secondary Color",
    metaTitle: "Meta Title", metaTitleAr: "Meta Title (AR)",
    metaDescription: "Meta Description", metaDescriptionAr: "Meta Description (AR)",
    facebook: "Facebook", instagram: "Instagram", twitter: "Twitter",
    tiktok: "TikTok", youtube: "YouTube", whatsapp: "WhatsApp",
    navLinks: "Navbar Links", ctaText: "CTA Text", ctaTextAr: "CTA Text (AR)", ctaHref: "CTA Link",
    label: "Label", labelAr: "Label (AR)", href: "Href", hasMega: "Has Mega Menu", highlight: "Highlight",
    footerColumns: "Footer Columns", columnTitle: "Column Title", columnTitleAr: "Column Title (AR)",
    copyright: "Copyright", copyrightAr: "Copyright (AR)",
    blockType: "Block Type", visible: "Visible", sortOrder: "Sort Order",
    noBlocks: "No blocks — select a page from Pages tab first",
    componentPalette: "Available Components", description: "Description",
    addBlock: "Add Block to Page", selectComponent: "Select Component",
    successSaved: "Saved successfully", failedLoad: "Failed to load", failedSave: "Failed to save",
    roseBazaar: "Rose Bazaar", adminPanel: "Admin Panel",
  },
  ar: {
    cmsAdmin: "لوحة إدارة نظام المحتوى", language: "اللغة", english: "الإنجليزية", arabic: "العربية",
    settings: "الإعدادات", pages: "الصفحات", blocks: "البلوكات", components: "أنواع المكونات",
    save: "حفظ", saving: "جارٍ الحفظ...", add: "إضافة", remove: "حذف", up: "أعلى", down: "أسفل",
    general: "عام", seo: "تحسين محركات البحث", social: "السوشيال", navbar: "شريط التنقل", footer: "الفوتر",
    siteName: "اسم الموقع", siteNameAr: "اسم الموقع (عربي)", tagline: "الشعار", taglineAr: "الشعار (عربي)",
    supportEmail: "بريد الدعم", supportPhone: "هاتف الدعم",
    primaryColor: "اللون الأساسي", secondaryColor: "اللون الثانوي",
    metaTitle: "عنوان ميتا", metaTitleAr: "عنوان ميتا (عربي)",
    metaDescription: "وصف ميتا", metaDescriptionAr: "وصف ميتا (عربي)",
    facebook: "فيسبوك", instagram: "إنستجرام", twitter: "تويتر",
    tiktok: "تيك توك", youtube: "يوتيوب", whatsapp: "واتساب",
    navLinks: "روابط النافبار", ctaText: "نص الزر", ctaTextAr: "نص الزر (عربي)", ctaHref: "رابط الزر",
    label: "العنوان", labelAr: "العنوان (عربي)", href: "الرابط", hasMega: "قائمة ميجا", highlight: "تمييز",
    footerColumns: "أعمدة الفوتر", columnTitle: "عنوان العمود", columnTitleAr: "عنوان العمود (عربي)",
    copyright: "حقوق النشر", copyrightAr: "حقوق النشر (عربي)",
    blockType: "نوع البلوك", visible: "ظاهر", sortOrder: "الترتيب",
    noBlocks: "لا توجد بلوكات — اختر صفحة من تبويب الصفحات أولاً",
    componentPalette: "المكونات المتاحة", description: "الوصف",
    addBlock: "إضافة بلوك للصفحة", selectComponent: "اختر مكون",
    successSaved: "تم الحفظ بنجاح", failedLoad: "فشل تحميل البيانات", failedSave: "فشل الحفظ",
    roseBazaar: "روز بازار", adminPanel: "لوحة الإدارة",
  },
};

export default function CmsAdminDashboard({ cmsApi, initialTab }) {
  const [lang, setLang] = useState("en");
  const L = LABELS[lang];
  const [activeTab, setActiveTab] = useState(initialTab || "settings");

  // Settings state
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pages & blocks
  const [pages, setPages] = useState([]);
  const [components, setComponents] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [compSearch, setCompSearch] = useState("");
  const [compFilter, setCompFilter] = useState("all");

  const TABS = [
    { id: "settings", label: L.settings, icon: Settings },
    { id: "pages", label: L.pages, icon: FileText },
    { id: "blocks", label: L.blocks, icon: BlocksIcon },
    { id: "components", label: L.components, icon: Layers },
  ];

  // Load data
  useEffect(() => {
    async function bootstrap() {
      try {
        const [settingsRes, pagesRes, compRes] = await Promise.all([
          cmsApi.getAdminSettings().catch(() => ({ data: [] })),
          cmsApi.getPages().catch(() => ({ data: [] })),
          cmsApi.get("/admin/components/enhanced").catch(() => []),
        ]);
        const sData = settingsRes?.data?.data || settingsRes?.data || [];
        const grouped = {};
        (Array.isArray(sData) ? sData : []).forEach(s => {
          const group = s.key?.split("_")[0] || "general";
          if (!grouped[group]) grouped[group] = {};
          grouped[group] = { ...grouped[group], ...((typeof s.value === "object") ? s.value : { [s.key]: s.value }) };
        });
        setSettings(grouped);
        setPages(pagesRes?.data?.data || pagesRes?.data || []);
        setComponents(Array.isArray(compRes) ? compRes : compRes?.data || []);
      } catch (err) {
        console.error(L.failedLoad, err);
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  // Load blocks when page selected
  useEffect(() => {
    if (!selectedPageId) { setBlocks([]); return; }
    async function loadBlocks() {
      setBlocksLoading(true);
      try {
        const res = await cmsApi.getBlocks(selectedPageId);
        setBlocks(res?.data?.data || res?.data || []);
      } catch { setBlocks([]); }
      finally { setBlocksLoading(false); }
    }
    loadBlocks();
  }, [selectedPageId]);

  // Settings helpers
  function updateField(group, field, value) {
    setSettings(prev => ({ ...prev, [group]: { ...prev[group], [field]: value } }));
    setHasChanges(true);
  }

  async function saveSetting() {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await cmsApi.updateAdminSetting(key, value);
      }
      setHasChanges(false);
      alert(L.successSaved);
    } catch { alert(L.failedSave); }
    finally { setSaving(false); }
  }

  function renderInput(group, field, label, type = "text") {
    const val = settings[group]?.[field] || "";
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--slate-500, #64748b)", display: "block", marginBottom: 5 }}>{label}</label>
        {type === "textarea" ? (
          <textarea value={val} onChange={e => updateField(group, field, e.target.value)} rows={3}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--card-border, #e2e8f0)", fontSize: 13, resize: "vertical", background: "var(--card-bg, #fff)", color: "#334155", fontFamily: "'DM Sans', sans-serif" }} />
        ) : type === "color" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="color" value={val || "#000000"} onChange={e => updateField(group, field, e.target.value)} style={{ width: 36, height: 36, border: "none", cursor: "pointer", borderRadius: 6 }} />
            <input type="text" value={val} onChange={e => updateField(group, field, e.target.value)}
              style={{ width: 100, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--card-border, #e2e8f0)", fontSize: 12, fontFamily: "monospace", background: "var(--card-bg, #fff)" }} />
          </div>
        ) : (
          <input type={type} value={val} onChange={e => updateField(group, field, e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--card-border, #e2e8f0)", fontSize: 13, background: "var(--card-bg, #fff)", color: "#334155", fontFamily: "'DM Sans', sans-serif" }} />
        )}
      </div>
    );
  }

  // ═══ RENDER ═══
  return (
    <div>
      {/* Header bar with tabs + language */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 4, background: "var(--card-bg, #fff)", border: "1px solid var(--card-border, #e2e8f0)", borderRadius: 12, padding: 4 }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
                border: "none", background: active ? "var(--coral, #FE6972)" : "transparent",
                color: active ? "#fff" : "#64748b", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400,
                transition: "all 150ms", fontFamily: "'DM Sans', sans-serif",
              }}>
                <Icon size={15} />{tab.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setLang(l => l === "en" ? "ar" : "en")} style={{
            padding: "6px 14px", borderRadius: 8, border: "1px solid var(--card-border, #e2e8f0)",
            background: "var(--card-bg, #fff)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#64748b",
          }}>{lang === "en" ? "عربي" : "EN"}</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite", marginBottom: 8 }} />
          <div>Loading...</div>
        </div>
      ) : (
        <>
          {/* ═══ SETTINGS TAB ═══ */}
          {activeTab === "settings" && (
            <div>
              {["general", "seo", "social", "navbar", "footer"].map(group => (
                <div key={group} style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--card-border, #e2e8f0)", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, marginBottom: 16, textTransform: "capitalize", color: "#0f172a" }}>{L[group] || group}</h3>
                  {group === "general" && (<>{renderInput("general","site_name",L.siteName)}{renderInput("general","site_name_ar",L.siteNameAr)}{renderInput("general","tagline",L.tagline)}{renderInput("general","tagline_ar",L.taglineAr)}{renderInput("general","support_email",L.supportEmail,"email")}{renderInput("general","support_phone",L.supportPhone,"tel")}{renderInput("general","primary_color",L.primaryColor,"color")}{renderInput("general","secondary_color",L.secondaryColor,"color")}</>)}
                  {group === "seo" && (<>{renderInput("seo","meta_title",L.metaTitle)}{renderInput("seo","meta_title_ar",L.metaTitleAr)}{renderInput("seo","meta_description",L.metaDescription,"textarea")}{renderInput("seo","meta_description_ar",L.metaDescriptionAr,"textarea")}</>)}
                  {group === "social" && (<>{renderInput("social","facebook",L.facebook,"url")}{renderInput("social","instagram",L.instagram,"url")}{renderInput("social","twitter",L.twitter,"url")}{renderInput("social","tiktok",L.tiktok,"url")}{renderInput("social","youtube",L.youtube,"url")}{renderInput("social","whatsapp",L.whatsapp,"tel")}</>)}
                  {group === "navbar" && (<div style={{ fontSize: 13, color: "#64748b" }}>Navbar links are managed via the JSON editor in the CMS settings API.</div>)}
                  {group === "footer" && (<div style={{ fontSize: 13, color: "#64748b" }}>Footer columns are managed via the JSON editor in the CMS settings API.</div>)}
                </div>
              ))}
            </div>
          )}

          {/* ═══ BLOCKS TAB — with inline page selector ═══ */}
          {activeTab === "blocks" && (
            <div>
              {/* Page selector */}
              <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--card-border, #e2e8f0)", borderRadius: 14, padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", whiteSpace: "nowrap" }}>Select Page:</label>
                <select value={selectedPageId || ""} onChange={e => setSelectedPageId(e.target.value ? parseInt(e.target.value) : null)} style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--card-border, #e2e8f0)",
                  fontSize: 13, background: "var(--card-bg, #fff)", color: "#334155", maxWidth: 300,
                }}>
                  <option value="">— Choose a page —</option>
                  {pages.map(p => <option key={p.id} value={p.id}>{p.title || p.title_en || p.slug} ({p.slug})</option>)}
                </select>
                {selectedPageId && (
                  <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--coral, #FE6972)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    <Plus size={15} /> {L.addBlock || "Add Block"}
                  </button>
                )}
              </div>

              {/* Blocks content */}
              {!selectedPageId ? (
                <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--card-border, #e2e8f0)", borderRadius: 14, padding: "60px 40px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(99,102,241,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <BlocksIcon size={28} style={{ color: "#6366f1" }} />
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#0f172a", marginBottom: 8 }}>{L.noBlocks || "No Blocks Yet"}</h3>
                  <p style={{ fontSize: 14, color: "#94a3b8", maxWidth: 360, margin: "0 auto 20px", lineHeight: 1.6 }}>
                    Select a page from the dropdown above to start building with blocks.
                  </p>
                  <button onClick={() => { const sel = document.querySelector("select"); if (sel) sel.focus(); }} style={{
                    padding: "10px 24px", borderRadius: 8, border: "1px solid var(--card-border, #e2e8f0)",
                    background: "var(--card-bg, #fff)", color: "#6366f1", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  }}>Select a Page</button>
                </div>
              ) : blocksLoading ? (
                <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>Loading blocks...</div>
              ) : blocks.length === 0 ? (
                <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--card-border, #e2e8f0)", borderRadius: 14, padding: "50px 40px", textAlign: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(254,105,114,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                    <LayoutGrid size={24} style={{ color: "var(--coral, #FE6972)" }} />
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, marginBottom: 6 }}>Page Has No Blocks</h3>
                  <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>Start building by adding your first block.</p>
                  <button style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "var(--coral, #FE6972)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Plus size={16} /> Add Your First Block
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {blocks.map((block, i) => (
                    <div key={block.id || i} style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--card-border, #e2e8f0)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
                      <GripVertical size={16} style={{ color: "#cbd5e1", cursor: "grab" }} />
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(254,105,114,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--coral, #FE6972)" }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{block.component_type || "Block"}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>Sort: {block.sort_order} · {block.is_visible ? "Visible" : "Hidden"}</div>
                      </div>
                      <button style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--card-border, #e2e8f0)", background: "transparent", cursor: "pointer", fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}><Eye size={12} /> Preview</button>
                      <button style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "transparent", cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ COMPONENTS TAB — Enhanced with preview, grouping, search ═══ */}
          {activeTab === "components" && (() => {
            const COMPONENT_CATEGORIES = {
              layout: { label: "Layout", color: "#6366f1", components: ["hero", "categories_grid", "stats_bar"] },
              content: { label: "Content", color: "#22c55e", components: ["text_block", "image_gallery"] },
              marketing: { label: "Marketing", color: "var(--coral, #FE6972)", components: ["cta_banner", "testimonials", "vendor_cards"] },
            };
            const PREVIEWS = {
              hero: { icon: "▣", desc: "Full-width banner with title, subtitle, and CTA" },
              categories_grid: { icon: "▦", desc: "Grid of category cards with images" },
              vendor_cards: { icon: "▤", desc: "Featured vendor cards with ratings" },
              cta_banner: { icon: "▶", desc: "Call-to-action banner with button" },
              text_block: { icon: "≡", desc: "Rich text content block" },
              image_gallery: { icon: "▥", desc: "Masonry or grid image gallery" },
              testimonials: { icon: "❝", desc: "Customer testimonial cards" },
              stats_bar: { icon: "∴", desc: "Key statistics in a horizontal bar" },
            };

            
            

            const filteredComps = components.filter(c => {
              const slug = c.slug || "";
              const name = (c.name_en || "").toLowerCase();
              const matchesSearch = !compSearch || name.includes(compSearch.toLowerCase()) || slug.includes(compSearch.toLowerCase());
              if (!matchesSearch) return false;
              if (compFilter === "all") return true;
              const cat = COMPONENT_CATEGORIES[compFilter];
              return cat && cat.components.includes(slug);
            });

            const grouped = {};
            filteredComps.forEach(c => {
              let catKey = "other";
              for (const [key, cat] of Object.entries(COMPONENT_CATEGORIES)) {
                if (cat.components.includes(c.slug)) { catKey = key; break; }
              }
              if (!grouped[catKey]) grouped[catKey] = [];
              grouped[catKey].push(c);
            });

            return (
              <div>
                {/* Toolbar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 10, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--card-bg, #fff)", border: "1px solid var(--card-border, #e2e8f0)", borderRadius: 8, padding: "7px 12px", width: 220 }}>
                      <span style={{ color: "#94a3b8", fontSize: 14 }}>🔍</span>
                      <input value={compSearch} onChange={e => setCompSearch(e.target.value)} placeholder="Search components..." style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, width: "100%", color: "#334155", fontFamily: "'DM Sans', sans-serif" }} />
                    </div>
                    <div style={{ display: "flex", gap: 4, background: "var(--card-bg, #fff)", border: "1px solid var(--card-border, #e2e8f0)", borderRadius: 8, padding: 3 }}>
                      {[["all","All"],["layout","Layout"],["content","Content"],["marketing","Marketing"]].map(([key,label]) => (
                        <button key={key} onClick={() => setCompFilter(key)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: compFilter === key ? 600 : 400, background: compFilter === key ? "var(--coral, #FE6972)" : "transparent", color: compFilter === key ? "#fff" : "#64748b", cursor: "pointer" }}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--coral, #FE6972)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    <Plus size={15} /> New Component
                  </button>
                </div>

                {/* Grouped Components */}
                {Object.entries(grouped).map(([catKey, comps]) => {
                  const cat = COMPONENT_CATEGORIES[catKey] || { label: "Other", color: "#64748b" };
                  return (
                    <div key={catKey} style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 4, height: 16, borderRadius: 2, background: cat.color }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>{cat.label} Components</span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>({comps.length})</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                        {comps.map((comp, i) => {
                          const preview = PREVIEWS[comp.slug] || { icon: "○", desc: comp.description || "Component block" };
                          return (
                            <div key={comp.id || i} style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--card-border, #e2e8f0)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 200ms", cursor: "pointer" }}>
                              {/* Preview area */}
                              <div style={{ height: 80, background: `linear-gradient(135deg, ${cat.color}08, ${cat.color}15)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: cat.color, borderBottom: "1px solid var(--card-border, #e2e8f0)" }}>
                                {preview.icon}
                              </div>
                              {/* Info */}
                              <div style={{ padding: 14 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{comp.name_en || comp.slug}</span>
                                </div>
                                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{comp.name_ar}</div>
                                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4, marginBottom: 10 }}>{preview.desc}</div>
                                {/* Actions */}
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "1px solid var(--card-border, #e2e8f0)", background: "var(--card-bg, #fff)", color: "#6366f1", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Preview</button>
                                  <button style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "none", background: cat.color, color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Use</button>
                                  <button style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--card-border, #e2e8f0)", background: "var(--card-bg, #fff)", color: "#64748b", cursor: "pointer", fontSize: 11 }}>Edit</button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {filteredComps.length === 0 && (
                  <div style={{ padding: 60, textAlign: "center", color: "#94a3b8", background: "var(--card-bg, #fff)", border: "1px solid var(--card-border, #e2e8f0)", borderRadius: 14 }}>
                    <Layers size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                    <div>{compSearch ? "No components match your search" : "No component types found"}</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ═══ PAGES TAB — handled by PagesPage in App.jsx ═══ */}
          {activeTab === "pages" && (
            <div style={{ background: "var(--card-bg, #fff)", border: "1px solid var(--card-border, #e2e8f0)", borderRadius: 14, padding: 20, textAlign: "center", color: "#64748b" }}>
              <FileText size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p>Pages are managed in the dedicated Pages section in the sidebar.</p>
            </div>
          )}

          {/* ═══ CONTEXTUAL SAVE BAR ═══ */}
          {hasChanges && activeTab === "settings" && (
            <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "#fff", padding: "12px 24px", borderRadius: 12, display: "flex", alignItems: "center", gap: 16, boxShadow: "0 8px 30px rgba(0,0,0,0.2)", zIndex: 50, animation: "fadeIn 200ms ease-out" }}>
              <span style={{ fontSize: 13 }}>You have unsaved changes</span>
              <button onClick={saveSetting} disabled={saving} style={{
                padding: "8px 20px", borderRadius: 8, border: "none", background: "var(--coral, #FE6972)", color: "#fff",
                cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> {L.saving}</> : <><Save size={14} /> {L.save}</>}
              </button>
              <button onClick={() => setHasChanges(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>Dismiss</button>
            </div>
          )}
        </>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
