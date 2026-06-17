import React, { useEffect, useMemo, useState } from "react";
import PagesPage from "./PagesPage";

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

const defaultSettings = {
  general: {}, seo: {}, social: {},
  navbar: { links: [], cta_text: "", cta_text_ar: "", cta_href: "" },
  footer: { columns: [], copyright: "", copyright_ar: "" },
};

const Input = ({ label, ...props }) => (
  <div>
    {label && <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>}
    <input {...props} className={`w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FE6972] focus:ring-1 focus:ring-[#FE6972]/20 transition ${props.className||""}`} />
  </div>
);
const Textarea = ({ label, ...props }) => (
  <div>
    {label && <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>}
    <textarea {...props} rows={3} className={`w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#FE6972] focus:ring-1 focus:ring-[#FE6972]/20 transition resize-vertical ${props.className||""}`} />
  </div>
);
const Btn = ({ children, primary, danger, small, ...props }) => (
  <button {...props} className={`${small?"px-2 py-1":"px-4 py-2"} rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 ${
    danger?"bg-red-50 text-red-600 hover:bg-red-100":primary?"bg-gradient-to-r from-[#FE6972] to-[#FF8A8A] text-white shadow-md hover:shadow-lg":"bg-gray-100 text-gray-700 hover:bg-gray-200"
  } ${props.className||""}`}>{children}</button>
);

export default function CmsAdminDashboard({ cmsApi }) {
  const [lang, setLang] = useState("en");
  const t = useMemo(() => LABELS[lang], [lang]);
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [activeTab, setActiveTab] = useState("settings");
  const [settingsTab, setSettingsTab] = useState("general");
  const [settings, setSettings] = useState(defaultSettings);
  const [componentTypes, setComponentTypes] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [pageBlocks, setPageBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { bootstrap(); }, []);

  async function bootstrap() {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        cmsApi.getAdminSettings(),
        cmsApi.getComponentTypes(),
      ]);
      const sRows = sRes?.data?.data || [];
      const sObj = { ...defaultSettings };
      for (const row of sRows) sObj[row.key] = row.value || {};
      setSettings(sObj);
      setComponentTypes(cRes?.data?.data || []);
    } catch (e) { console.error(e); alert(t.failedLoad); }
    finally { setLoading(false); }
  }

  async function saveSetting() {
    try { setSaving(true); await cmsApi.updateAdminSetting(settingsTab, settings[settingsTab]||{}); alert(t.successSaved); }
    catch (e) { alert(t.failedSave); } finally { setSaving(false); }
  }

  function updateField(group, field, value) {
    setSettings(prev => ({ ...prev, [group]: { ...(prev[group]||{}), [field]: value } }));
  }
  function updateNavLink(idx, field, value) {
    setSettings(prev => {
      const links = [...(prev.navbar?.links||[])];
      links[idx] = { ...(links[idx]||{}), [field]: value };
      return { ...prev, navbar: { ...(prev.navbar||{}), links } };
    });
  }

  async function loadBlocks(pageId) {
    setSelectedPageId(pageId);
    try { const res = await cmsApi.getBlocks(pageId); setPageBlocks(res?.data?.data || []); }
    catch(e) { console.error(e); }
  }
  function moveBlock(i, dir) {
    setPageBlocks(prev => {
      const arr=[...prev]; const target=dir==="up"?i-1:i+1;
      if(target<0||target>=arr.length)return prev;
      [arr[i],arr[target]]=[arr[target],arr[i]];
      return arr.map((b,idx)=>({...b,sort_order:idx+1}));
    });
  }
  async function saveBlockOrder() {
    if (!selectedPageId) return;
    try { setSaving(true);
      await cmsApi.reorderBlocks(selectedPageId, pageBlocks.map((b,i)=>({id:b.id,sort_order:i+1,is_visible:b.is_visible})));
      alert(t.successSaved);
    } catch(e) { alert(t.failedSave); } finally { setSaving(false); }
  }
  async function addBlock(componentTypeId) {
    if (!selectedPageId) return;
    try { await cmsApi.saveBlock({ page_id: selectedPageId, component_type_id: componentTypeId, data: {} });
      await loadBlocks(selectedPageId);
    } catch(e) { alert(t.failedSave); }
  }
  async function removeBlock(blockId) {
    try { await cmsApi.deleteBlock(blockId); await loadBlocks(selectedPageId); } catch(e) { alert(t.failedSave); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><div className="w-10 h-10 border-[3px] border-[#FE6972] border-t-transparent rounded-full animate-spin mx-auto mb-3"/><p className="text-gray-400">Loading CMS...</p></div></div>;

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-rose-50/50 via-white to-pink-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FE6972] to-[#FF8A8A] text-white px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg font-bold">R</div>
            <div><h1 className="text-lg font-bold">{t.roseBazaar}</h1><p className="text-white/70 text-xs">{t.adminPanel}</p></div>
          </div>
          <button onClick={()=>setLang(l=>l==="en"?"ar":"en")} className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs font-semibold hover:bg-white/30 transition cursor-pointer">
            {lang==="en"?"عربي":"EN"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit mb-6">
          {["settings","pages","blocks","components"].map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab===tab?"bg-[#FE6972] text-white shadow-md":"text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
              {t[tab]}
            </button>
          ))}
        </div>

        {/* SETTINGS */}
        {activeTab==="settings" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex gap-1 p-3 bg-gray-50 border-b border-gray-100">
              {["general","seo","social","navbar","footer"].map(tab=>(
                <button key={tab} onClick={()=>setSettingsTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${settingsTab===tab?"bg-[#D4AF37] text-white":"text-gray-500 hover:bg-gray-100"}`}>
                  {t[tab]}
                </button>
              ))}
            </div>
            <div className="p-6">
              {settingsTab==="general" && <div className="grid md:grid-cols-2 gap-4">
                <Input label={t.siteName} value={settings.general?.site_name||""} onChange={e=>updateField("general","site_name",e.target.value)}/>
                <Input label={t.siteNameAr} dir="rtl" value={settings.general?.site_name_ar||""} onChange={e=>updateField("general","site_name_ar",e.target.value)}/>
                <Input label={t.tagline} value={settings.general?.tagline||""} onChange={e=>updateField("general","tagline",e.target.value)}/>
                <Input label={t.taglineAr} dir="rtl" value={settings.general?.tagline_ar||""} onChange={e=>updateField("general","tagline_ar",e.target.value)}/>
                <Input label={t.supportEmail} value={settings.general?.support_email||""} onChange={e=>updateField("general","support_email",e.target.value)}/>
                <Input label={t.supportPhone} value={settings.general?.support_phone||""} onChange={e=>updateField("general","support_phone",e.target.value)}/>
                <Input label={t.primaryColor} type="color" value={settings.general?.primary_color||"#FE6972"} onChange={e=>updateField("general","primary_color",e.target.value)}/>
                <Input label={t.secondaryColor} type="color" value={settings.general?.secondary_color||"#D4AF37"} onChange={e=>updateField("general","secondary_color",e.target.value)}/>
              </div>}
              {settingsTab==="seo" && <div className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label={t.metaTitle} value={settings.seo?.meta_title||""} onChange={e=>updateField("seo","meta_title",e.target.value)}/>
                  <Input label={t.metaTitleAr} dir="rtl" value={settings.seo?.meta_title_ar||""} onChange={e=>updateField("seo","meta_title_ar",e.target.value)}/>
                </div>
                <Textarea label={t.metaDescription} value={settings.seo?.meta_description||""} onChange={e=>updateField("seo","meta_description",e.target.value)}/>
                <Textarea label={t.metaDescriptionAr} dir="rtl" value={settings.seo?.meta_description_ar||""} onChange={e=>updateField("seo","meta_description_ar",e.target.value)}/>
              </div>}
              {settingsTab==="social" && <div className="grid md:grid-cols-2 gap-4">
                {["facebook","instagram","twitter","tiktok","youtube","whatsapp"].map(k=>(
                  <Input key={k} label={t[k]} value={settings.social?.[k]||""} onChange={e=>updateField("social",k,e.target.value)}/>
                ))}
              </div>}
              {settingsTab==="navbar" && <div className="space-y-5">
                <h3 className="text-sm font-bold text-[#FE6972] uppercase tracking-wider">{t.navLinks}</h3>
                {(settings.navbar?.links||[]).map((link,idx)=>(
                  <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <Input label={t.label} value={link.label||""} onChange={e=>updateNavLink(idx,"label",e.target.value)}/>
                      <Input label={t.labelAr} dir="rtl" value={link.label_ar||""} onChange={e=>updateNavLink(idx,"label_ar",e.target.value)}/>
                    </div>
                    <Input label={t.href} value={link.href||""} onChange={e=>updateNavLink(idx,"href",e.target.value)}/>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!link.has_mega} onChange={e=>updateNavLink(idx,"has_mega",e.target.checked)}/>{t.hasMega}</label>
                      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!link.highlight} onChange={e=>updateNavLink(idx,"highlight",e.target.checked)}/>{t.highlight}</label>
                      <Btn small danger onClick={()=>{setSettings(prev=>{const links=[...(prev.navbar?.links||[])];links.splice(idx,1);return{...prev,navbar:{...prev.navbar,links}};})}}>{t.remove}</Btn>
                    </div>
                  </div>
                ))}
                <Btn onClick={()=>setSettings(prev=>({...prev,navbar:{...prev.navbar,links:[...(prev.navbar?.links||[]),{label:"",label_ar:"",href:"",has_mega:false,highlight:false}]}}))}>{t.add}</Btn>
                <div className="grid md:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                  <Input label={t.ctaText} value={settings.navbar?.cta_text||""} onChange={e=>updateField("navbar","cta_text",e.target.value)}/>
                  <Input label={t.ctaTextAr} dir="rtl" value={settings.navbar?.cta_text_ar||""} onChange={e=>updateField("navbar","cta_text_ar",e.target.value)}/>
                  <Input label={t.ctaHref} value={settings.navbar?.cta_href||""} onChange={e=>updateField("navbar","cta_href",e.target.value)}/>
                </div>
              </div>}
              {settingsTab==="footer" && <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label={t.copyright} value={settings.footer?.copyright||""} onChange={e=>updateField("footer","copyright",e.target.value)}/>
                  <Input label={t.copyrightAr} dir="rtl" value={settings.footer?.copyright_ar||""} onChange={e=>updateField("footer","copyright_ar",e.target.value)}/>
                </div>
                <h3 className="text-sm font-bold text-[#FE6972] uppercase tracking-wider">{t.footerColumns}</h3>
                {(settings.footer?.columns||[]).map((col,idx)=>(
                  <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 grid md:grid-cols-2 gap-3">
                    <Input label={t.columnTitle} value={col.title||""} onChange={e=>{const cols=[...(settings.footer?.columns||[])];cols[idx]={...cols[idx],title:e.target.value};setSettings(prev=>({...prev,footer:{...prev.footer,columns:cols}}));}}/>
                    <Input label={t.columnTitleAr} dir="rtl" value={col.title_ar||""} onChange={e=>{const cols=[...(settings.footer?.columns||[])];cols[idx]={...cols[idx],title_ar:e.target.value};setSettings(prev=>({...prev,footer:{...prev.footer,columns:cols}}));}}/>
                  </div>
                ))}
                <Btn onClick={()=>setSettings(prev=>({...prev,footer:{...prev.footer,columns:[...(prev.footer?.columns||[]),{title:"",title_ar:"",links:[]}]}}))}>{t.add}</Btn>
              </div>}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Btn primary onClick={saveSetting} disabled={saving}>{saving?t.saving:t.save}</Btn>
              </div>
            </div>
          </div>
        )}

        {/* PAGES — uses PagesPage component */}
        {activeTab==="pages" && <PagesPage cmsApi={cmsApi} />}

        {/* BLOCKS */}
        {activeTab==="blocks" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">{t.blocks} {selectedPageId && <span className="text-xs text-gray-400 ml-2">(Page #{selectedPageId})</span>}</h3>
                <Btn primary onClick={saveBlockOrder} disabled={saving||!selectedPageId}>{saving?t.saving:t.save}</Btn>
              </div>
              {!pageBlocks.length ? <p className="text-gray-400 text-sm">{t.noBlocks}</p> : (
                <div className="space-y-2">
                  {pageBlocks.map((b,i)=>(
                    <div key={b.id||i} className="border border-gray-100 rounded-xl p-4 flex items-center justify-between bg-gray-50/50 hover:border-[#FE6972]/30 transition">
                      <div>
                        <div className="font-semibold text-sm">{b.component_name||b.component_slug||`Type #${b.component_type_id}`}</div>
                        <div className="text-xs text-gray-400">{t.sortOrder}: {b.sort_order}</div>
                      </div>
                      <div className="flex gap-2">
                        <Btn small onClick={()=>moveBlock(i,"up")}>{t.up}</Btn>
                        <Btn small onClick={()=>moveBlock(i,"down")}>{t.down}</Btn>
                        <Btn small danger onClick={()=>removeBlock(b.id)}>{t.remove}</Btn>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedPageId && componentTypes.length>0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h4 className="font-bold text-sm text-gray-800 mb-3">{t.addBlock}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {componentTypes.map(ct=>(
                    <button key={ct.id} onClick={()=>addBlock(ct.id)}
                      className="p-3 rounded-xl border border-gray-100 hover:border-[#FE6972] hover:bg-rose-50/30 transition text-start cursor-pointer">
                      <div className="text-sm font-semibold">{ct.name}</div>
                      <div className="text-xs text-gray-400">{ct.name_ar||ct.slug}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPONENTS */}
        {activeTab==="components" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4">{t.componentPalette}</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {componentTypes.map(ct=>(
                <div key={ct.id||ct.slug} className="border border-gray-100 rounded-xl p-4 hover:border-[#FE6972]/30 hover:shadow-md transition">
                  <div className="w-10 h-10 rounded-xl bg-[#FE6972]/10 flex items-center justify-center text-[#FE6972] text-lg mb-3">{ct.icon?ct.icon[0]:"B"}</div>
                  <div className="font-bold text-sm">{ct.name}</div>
                  <div className="text-xs text-gray-400">{ct.name_ar||"-"}</div>
                  <div className="text-xs text-gray-300 mt-1 font-mono">{ct.slug}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
