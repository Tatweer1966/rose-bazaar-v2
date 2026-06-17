import { useMemo } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function useCmsApi() {
  const { token } = useAuth();

  const client = useMemo(() => {
    const c = axios.create({
      baseURL: "/api/cms",
      timeout: 20000,
      headers: { "Content-Type": "application/json" },
    });

    c.interceptors.request.use((config) => {
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    return c;
  }, [token]);

  return {
    // Direct fetch helpers for new components
    get: (path) => client.get(path).then(r => r.data),
    post: (path, data) => client.post(path, data).then(r => r.data),

    // public
    getPublicSettings: (keys = ["general", "seo", "social", "navbar", "footer"]) =>
      client.post("/public/settings", { keys }),
    getPublicPage: (slug) => {
      const clean = String(slug || "").replace(/^\/+/, "");
      return client.post(`/public/page/${clean}`, {});
    },

    // admin - READ
    getAdminSettings: () => client.get("/admin/settings"),
    getPages: () => client.get("/admin/pages"),
    getComponentTypes: () => client.get("/components"),

    // admin - WRITE
    updateAdminSetting: (key, value) => client.post("/admin/settings/update", { key, value }),
    savePage: (payload) => client.post("/admin/page/save", payload),
    publishPage: (id) => client.post(`/admin/pages/${id}/publish`, {}),
    unpublishPage: (id) => client.post(`/admin/pages/${id}/unpublish`, {}),

    // blocks
    getBlocks: (page_id) => client.post("/admin/page/blocks", { page_id }),
    saveBlock: (payload) => client.post("/admin/page/block/save", payload),
    deleteBlock: (id) => client.delete(`/admin/blocks/${id}`),
    reorderBlocks: (page_id, blocks) => client.post("/admin/page/blocks/reorder", { page_id, blocks }),

    // versions
    getVersions: (page_id) =>
      client.post("/admin/versions", { page_id })
        .catch(() => client.post("/admin/page/versions", { page_id }))
        .catch(() => client.get(`/admin/pages/${page_id}/versions`)),
    restoreVersion: (id) =>
      client.post(`/admin/version/${id}/restore`, {})
        .catch(() => client.post(`/admin/versions/${id}/restore`, {})),
  };
}
