import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Save, ArrowLeft, Code, Eye } from "lucide-react";
import useCmsApi from "../hooks/useCmsApi";

export default function BlockEditor({ pageId, onBack }) {
  const { get, post } = useCmsApi();
  const [blocks, setBlocks] = useState([]);
  const [componentTypes, setComponentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showJson, setShowJson] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const [blocksRes, typesRes] = await Promise.all([
          get(`/admin/pages/${pageId}/blocks`),
          get("/public/component-types"),
        ]);
        setBlocks(blocksRes?.data || blocksRes || []);
        setComponentTypes(typesRes?.data || typesRes || []);
      } catch (e) {
        console.error("BlockEditor load error:", e);
      } finally {
        setLoading(false);
      }
    }
    if (pageId) load();
  }, [pageId]);

  function addBlock(typeId) {
    const type = componentTypes.find(t => t.id === typeId);
    setBlocks(prev => [...prev, {
      id: "new_" + Date.now(),
      component_type_id: typeId,
      component_type: type?.slug || "unknown",
      sort_order: prev.length,
      props_en: {},
      props_ar: {},
      is_visible: true,
      _isNew: true,
    }]);
  }

  function removeBlock(index) {
    setBlocks(prev => prev.filter((_, i) => i !== index));
  }

  function moveBlock(index, direction) {
    setBlocks(prev => {
      const arr = [...prev];
      const target = index + direction;
      if (target < 0 || target >= arr.length) return arr;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr.map((b, i) => ({ ...b, sort_order: i }));
    });
  }

  function updateBlockProps(index, lang, value) {
    setBlocks(prev => prev.map((b, i) => {
      if (i !== index) return b;
      try {
        const parsed = JSON.parse(value);
        return { ...b, [lang === "ar" ? "props_ar" : "props_en"]: parsed };
      } catch {
        return b;
      }
    }));
  }

  async function saveBlocks() {
    setSaving(true);
    try {
      await post(`/admin/pages/${pageId}/blocks`, { blocks });
      alert("Blocks saved!");
    } catch (e) {
      console.error("Save error:", e);
      alert("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--slate-400)" }}>Loading blocks...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "1px solid var(--card-border)",
          borderRadius: "var(--radius-md)", padding: "8px 14px",
          cursor: "pointer", fontSize: 13, color: "var(--slate-600)",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <ArrowLeft size={16} /> Back to Pages
        </button>
        <button onClick={saveBlocks} disabled={saving} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "var(--coral)", color: "#fff", border: "none",
          borderRadius: "var(--radius-md)", padding: "9px 18px",
          cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.7 : 1,
        }}>
          <Save size={16} /> {saving ? "Saving..." : "Save Blocks"}
        </button>
      </div>

      {/* Blocks List */}
      {blocks.length === 0 ? (
        <div style={{
          background: "var(--card-bg)", border: "1px solid var(--card-border)",
          borderRadius: "var(--radius-lg)", padding: 40, textAlign: "center",
        }}>
          <p style={{ color: "var(--slate-500)", marginBottom: 16 }}>No blocks yet. Add one below.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {blocks.map((block, i) => (
            <div key={block.id} style={{
              background: "var(--card-bg)", border: "1px solid var(--card-border)",
              borderRadius: "var(--radius-lg)", overflow: "hidden",
              boxShadow: "var(--card-shadow)",
            }}>
              {/* Block Header */}
              <div style={{
                padding: "12px 16px", borderBottom: "1px solid var(--card-border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "var(--slate-50)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: "var(--coral)",
                    background: "rgba(254,105,114,0.1)", padding: "2px 8px",
                    borderRadius: 4, fontFamily: "'DM Sans', sans-serif",
                  }}>#{i + 1}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--slate-900)" }}>
                    {block.component_type || "Block"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setShowJson(p => ({ ...p, [i]: !p[i] }))} style={{
                    width: 30, height: 30, borderRadius: 6, border: "1px solid var(--card-border)",
                    background: "var(--card-bg)", cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    color: showJson[i] ? "var(--coral)" : "var(--slate-500)",
                  }} title="Toggle JSON" aria-label="Toggle JSON editor">
                    <Code size={14} />
                  </button>
                  <button onClick={() => moveBlock(i, -1)} disabled={i === 0} style={{
                    width: 30, height: 30, borderRadius: 6, border: "1px solid var(--card-border)",
                    background: "var(--card-bg)", cursor: i === 0 ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--slate-500)", opacity: i === 0 ? 0.3 : 1,
                  }} aria-label="Move up"><ChevronUp size={14} /></button>
                  <button onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} style={{
                    width: 30, height: 30, borderRadius: 6, border: "1px solid var(--card-border)",
                    background: "var(--card-bg)", cursor: i === blocks.length - 1 ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--slate-500)", opacity: i === blocks.length - 1 ? 0.3 : 1,
                  }} aria-label="Move down"><ChevronDown size={14} /></button>
                  <button onClick={() => removeBlock(i)} style={{
                    width: 30, height: 30, borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)",
                    background: "rgba(239,68,68,0.05)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#ef4444",
                  }} aria-label="Remove block"><Trash2 size={14} /></button>
                </div>
              </div>

              {/* JSON Editor */}
              {showJson[i] && (
                <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--slate-500)", marginBottom: 4, display: "block" }}>
                      Props EN
                    </label>
                    <textarea
                      value={JSON.stringify(block.props_en || {}, null, 2)}
                      onChange={e => updateBlockProps(i, "en", e.target.value)}
                      style={{
                        width: "100%", minHeight: 120, padding: 10, borderRadius: 8,
                        border: "1px solid var(--card-border)", fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12, resize: "vertical", background: "var(--slate-50)",
                        color: "var(--slate-700)", outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--slate-500)", marginBottom: 4, display: "block" }}>
                      Props AR
                    </label>
                    <textarea
                      value={JSON.stringify(block.props_ar || {}, null, 2)}
                      onChange={e => updateBlockProps(i, "ar", e.target.value)}
                      style={{
                        width: "100%", minHeight: 120, padding: 10, borderRadius: 8,
                        border: "1px solid var(--card-border)", fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 12, resize: "vertical", background: "var(--slate-50)",
                        color: "var(--slate-700)", outline: "none",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Block */}
      <div style={{
        background: "var(--card-bg)", border: "1px solid var(--card-border)",
        borderRadius: "var(--radius-lg)", padding: 16,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--slate-700)", marginBottom: 10 }}>Add Block</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {componentTypes.map(type => (
            <button key={type.id} onClick={() => addBlock(type.id)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: "var(--radius-sm)",
              border: "1px solid var(--card-border)", background: "var(--card-bg)",
              cursor: "pointer", fontSize: 12, color: "var(--slate-600)",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 150ms",
            }}>
              <Plus size={14} /> {type.name_en || type.slug}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
