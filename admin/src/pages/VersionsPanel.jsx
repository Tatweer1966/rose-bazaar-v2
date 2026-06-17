import React, { useEffect, useState } from "react";

export default function VersionsPanel({ cmsApi, page, onRestored, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState(null);
  const [versionsSupported, setVersionsSupported] = useState(true);

  async function loadVersions() {
    if (!page?.id) {
      setVersions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await cmsApi.getVersions(page.id);
      setVersions(res?.data?.data || []);
      setVersionsSupported(true);
    } catch (e) {
      const status = e?.response?.status;

      // Endpoint not implemented yet -> graceful fallback
      if (status === 404) {
        setVersions([]);
        setVersionsSupported(false);
        return;
      }

      console.error("loadVersions error", e);
      setVersions([]);
      setVersionsSupported(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page?.id]);

  async function restore(versionId) {
    const ok = window.confirm("Restore this version? This will create a new snapshot.");
    if (!ok) return;

    setRestoringId(versionId);
    try {
      await cmsApi.restoreVersion(versionId);
      alert("Version restored");
      await loadVersions();
      onRestored?.();
    } catch (e) {
      const status = e?.response?.status;
      if (status === 404) {
        setVersionsSupported(false);
        alert("Restore endpoint is not available yet.");
      } else {
        console.error("restoreVersion error", e);
        alert("Failed to restore version");
      }
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div className="bg-white rounded shadow p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Versions — {page?.slug || "-"}</h3>
        <button onClick={onClose} className="px-3 py-1 rounded bg-gray-200">
          Close
        </button>
      </div>

      {loading ? (
        <div>Loading versions...</div>
      ) : !versionsSupported ? (
        <div className="p-4 text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded">
          Versions feature is not available yet on backend.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-3">Version</th>
                <th className="p-3">Note</th>
                <th className="p-3">Created By</th>
                <th className="p-3">Created At</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id} className="border-b">
                  <td className="p-3">#{v.version_no}</td>
                  <td className="p-3">{v.change_note || "-"}</td>
                  <td className="p-3">{v.created_by || "-"}</td>
                  <td className="p-3">
                    {v.created_at ? new Date(v.created_at).toLocaleString() : "-"}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => restore(v.id)}
                      className="px-2 py-1 rounded bg-indigo-600 text-white disabled:opacity-60"
                      disabled={restoringId === v.id}
                    >
                      {restoringId === v.id ? "Restoring..." : "Restore"}
                    </button>
                  </td>
                </tr>
              ))}

              {versions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    No versions available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}