import { useState, useEffect } from "react";
import { Plus, Trash2, Save, X, GripVertical, Tag, ChevronDown, Type, Image, Hash, ToggleLeft, List, Palette, Link, AlignLeft } from "lucide-react";

const API = "/api/cms";

const FIELD_TYPES = [
  { value: "text", label: "Text", icon: Type },
  { value: "textarea", label: "Textarea", icon: AlignLeft },
  { value: "richtext", label: "Rich Text", icon: AlignLeft },
  { value: "image", label: "Image", icon: Image },
  { value: "number", label: "Number", icon: Hash },
  { value: "boolean", label: "Toggle", icon: ToggleLeft },
  { value: "select", label: "Select", icon: List },
  { value: "color", label: "Color", icon: Palette },
  { value: "url", label: "URL", icon: Link },
];

export default function SchemaBuilder({ componentId, componentName, onClose }) {
  const [fields, setFields] = useState([]);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("schema");

  useEffect(() => {
    async function load() {
      try {
        const [schemaRes, tagsRes] = await Promise.all([
          fetch(API + `/admin/components/${componentId}/schema`).then(r => r.ok ? r.json() : { data: [] }),
          fetch(API + `/admin/components/${componentId}/tags`).then(r => r.ok ? r.json() : { data: [] }),
        ]);
        setFields(schemaRes?.data || []);
        setTags(tagsRes?.data || []);
      } catch (e) { console.error("Load schema:", e); }
      finally { setLoading(false); }
    }
    if (componentId) load();
  }, [componentId]);

  function addField() {
    setFields(prev => [...prev, {
      field_name: "",
      field_type: "text",
      field_label_en: "",
      field_label_ar: "",
      placeholder: "",
      is_required: false,
      default_value: "",
      sort_order: prev.length,
    }]);
  }

  function updateField(index, key, value) {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, [key]: value } : f));
  }

  function removeField(index) {
    setFields(prev => prev.filter((_, i) => i !== index));
  }

  function moveField(index, direction) {
    setFields(prev => {
      const arr = [...prev];
      const target = index + direction;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr.map((f, i) => ({ ...f, sort_order: i }));
    });
  }

  function addTag() {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag("");
    }
  }

  function removeTag(tag) {
    setTags(prev => prev.filter(t => t !== tag));
  }

  async function saveAll() {
    setSaving(true);
    try {
      await Promise.all([
        fetch(API + `/admin/components/${componentId}/schema`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) }),
        fetch(API + `/admin/components/${componentId}/tags`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tags }) }),
      ]);
      alert("Schema and tags saved!");
      onClose?.();
    } catch (e) { alert("Save failed: " + e.message); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)", zIndex: 50, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, margin: 0 }}>{componentName}</h3>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Schema Builder & Tags</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={saveAll} disabled={saving} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "var(--coral, #FE6972)", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, opacity: saving ? 0.7 : 1 }}>
            <Save size={14} /> {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={onClose} style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" }}><X size={16} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "12px 20px", borderBottom: "1px solid #e2e8f0" }}>
        {[["schema", "Schema Fields"], ["tags", "Tags & Metadata"]].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: activeTab === id ? 600 : 400, background: activeTab === id ? "var(--coral, #FE6972)" : "#f1f5f9", color: activeTab === id ? "#fff" : "#64748b", cursor: "pointer" }}>{label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {loading ? <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading...</div> : activeTab === "schema" ? (
          <div>
            {fields.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", background: "#f8fafc", borderRadius: 12, border: "1px dashed #e2e8f0" }}>
                <Type size={28} style={{ color: "#cbd5e1", marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>No fields defined</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>Add fields to define this component's structure</div>
                <button onClick={addField} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--coral, #FE6972)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}><Plus size={14} /> Add First Field</button>
              </div>
            ) : (
              <>
                {fields.map((field, i) => {
                  const TypeIcon = FIELD_TYPES.find(t => t.value === field.field_type)?.icon || Type;
                  return (
                    <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <GripVertical size={14} style={{ color: "#cbd5e1", cursor: "grab" }} />
                        <TypeIcon size={16} style={{ color: "var(--coral, #FE6972)" }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>Field {i + 1}</span>
                        <div style={{ flex: 1 }} />
                        <button onClick={() => moveField(i, -1)} disabled={i === 0} style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid #e2e8f0", background: "#fff", cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.3 : 1, fontSize: 10 }}>Up</button>
                        <button onClick={() => moveField(i, 1)} disabled={i === fields.length - 1} style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid #e2e8f0", background: "#fff", cursor: i === fields.length - 1 ? "default" : "pointer", opacity: i === fields.length - 1 ? 0.3 : 1, fontSize: 10 }}>Down</button>
                        <button onClick={() => removeField(i)} style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)", cursor: "pointer", color: "#ef4444", fontSize: 10 }}><Trash2 size={12} /></button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 3 }}>Field Name *</label>
                          <input value={field.field_name} onChange={e => updateField(i, "field_name", e.target.value)} placeholder="e.g. title" style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 3 }}>Type</label>
                          <select value={field.field_type} onChange={e => updateField(i, "field_type", e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12, background: "#fff" }}>
                            {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 3 }}>Label (EN)</label>
                          <input value={field.field_label_en || ""} onChange={e => updateField(i, "field_label_en", e.target.value)} placeholder="English label" style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 3 }}>Label (AR)</label>
                          <input value={field.field_label_ar || ""} onChange={e => updateField(i, "field_label_ar", e.target.value)} placeholder="Arabic label" dir="rtl" style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }} />
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b", cursor: "pointer" }}>
                          <input type="checkbox" checked={field.is_required} onChange={e => updateField(i, "is_required", e.target.checked)} style={{ accentColor: "var(--coral, #FE6972)" }} />
                          Required
                        </label>
                        <input value={field.placeholder || ""} onChange={e => updateField(i, "placeholder", e.target.value)} placeholder="Placeholder text..." style={{ flex: 1, padding: "4px 8px", borderRadius: 4, border: "1px solid #e2e8f0", fontSize: 11 }} />
                      </div>
                    </div>
                  );
                })}
                <button onClick={addField} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "2px dashed #e2e8f0", background: "transparent", cursor: "pointer", fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}><Plus size={16} /> Add Field</button>
              </>
            )}
          </div>
        ) : (
          <div>
            {/* Tags Editor */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Tags</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {tags.map(tag => (
                  <span key={tag} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: "rgba(99,102,241,0.1)", color: "#6366f1", fontSize: 12, fontWeight: 600 }}>
                    <Tag size={11} />{tag}
                    <button onClick={() => removeTag(tag)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", padding: 0, marginLeft: 2 }}><X size={12} /></button>
                  </span>
                ))}
                {tags.length === 0 && <span style={{ fontSize: 12, color: "#94a3b8" }}>No tags yet</span>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()} placeholder="Add tag..." style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <button onClick={addTag} style={{ padding: "7px 14px", borderRadius: 6, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}><Plus size={14} /></button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                {["homepage", "marketing", "reusable", "hero", "layout", "content", "wedding", "vendor"].filter(s => !tags.includes(s)).map(s => (
                  <button key={s} onClick={() => setTags(prev => [...prev, s])} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 10, color: "#64748b" }}>+ {s}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
