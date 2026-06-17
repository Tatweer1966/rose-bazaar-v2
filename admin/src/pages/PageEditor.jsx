import React, { useEffect, useState } from "react";

const initialForm = {
  id: null,
  slug: "",
  title: "",
  title_ar: "",
  meta_title: "",
  meta_title_ar: "",
  meta_description: "",
  meta_description_ar: "",
  layout: "default",
  status: "draft",
  publish_at: "",
  unpublish_at: "",
  change_note: "Manual update",
};

export default function PageEditor({ cmsApi, page, onSaved, onCancel }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!page) {
      setForm(initialForm);
      return;
    }

    setForm({
      id: page.id || null,
      slug: page.slug || "",
      title: page.title || "",
      title_ar: page.title_ar || "",
      meta_title: page.meta_title || "",
      meta_title_ar: page.meta_title_ar || "",
      meta_description: page.meta_description || "",
      meta_description_ar: page.meta_description_ar || "",
      layout: page.layout || "default",
      status: page.status || "draft",
      publish_at: page.publish_at ? toInputDateTime(page.publish_at) : "",
      unpublish_at: page.unpublish_at ? toInputDateTime(page.unpublish_at) : "",
      change_note: "Manual update",
    });
  }, [page]);

  function toInputDateTime(dateString) {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "";
    // datetime-local expects YYYY-MM-DDTHH:mm
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.slug || !form.title) {
      alert("Slug and Title are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        publish_at: form.publish_at || null,
        unpublish_at: form.unpublish_at || null,
      };
      await cmsApi.savePage(payload);
      alert("Page saved");
      onSaved?.();
    } catch (err) {
      console.error("savePage error", err);
      alert("Failed to save page");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded shadow p-4 mt-4">
      <h3 className="text-lg font-semibold mb-4">{form.id ? "Edit Page" : "Create Page"}</h3>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Slug *</label>
          <input
            className="w-full border rounded p-2"
            value={form.slug}
            onChange={(e) => handleChange("slug", e.target.value)}
            placeholder="/about"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Layout</label>
          <select
            className="w-full border rounded p-2"
            value={form.layout}
            onChange={(e) => handleChange("layout", e.target.value)}
          >
            <option value="default">default</option>
            <option value="full-width">full-width</option>
            <option value="sidebar">sidebar</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Title *</label>
          <input
            className="w-full border rounded p-2"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Title (AR)</label>
          <input
            className="w-full border rounded p-2"
            value={form.title_ar}
            onChange={(e) => handleChange("title_ar", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Meta Title</label>
          <input
            className="w-full border rounded p-2"
            value={form.meta_title}
            onChange={(e) => handleChange("meta_title", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Meta Title (AR)</label>
          <input
            className="w-full border rounded p-2"
            value={form.meta_title_ar}
            onChange={(e) => handleChange("meta_title_ar", e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Meta Description</label>
          <textarea
            className="w-full border rounded p-2"
            rows={3}
            value={form.meta_description}
            onChange={(e) => handleChange("meta_description", e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Meta Description (AR)</label>
          <textarea
            className="w-full border rounded p-2"
            rows={3}
            value={form.meta_description_ar}
            onChange={(e) => handleChange("meta_description_ar", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Status</label>
          <select
            className="w-full border rounded p-2"
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option value="draft">draft</option>
            <option value="review">review</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Change Note</label>
          <input
            className="w-full border rounded p-2"
            value={form.change_note}
            onChange={(e) => handleChange("change_note", e.target.value)}
            placeholder="e.g. Updated hero copy"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Publish At (optional)</label>
          <input
            type="datetime-local"
            className="w-full border rounded p-2"
            value={form.publish_at}
            onChange={(e) => handleChange("publish_at", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Unpublish At (optional)</label>
          <input
            type="datetime-local"
            className="w-full border rounded p-2"
            value={form.unpublish_at}
            onChange={(e) => handleChange("unpublish_at", e.target.value)}
          />
        </div>

        <div className="md:col-span-2 flex gap-2 mt-2">
          <button
            type="submit"
            className="px-4 py-2 rounded bg-rose-600 text-white"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Page"}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-200"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}