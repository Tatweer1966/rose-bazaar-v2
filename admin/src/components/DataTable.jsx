import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function DataTable({ columns, data = [], pageSize = 10, onRowClick, actions, bulkActions, emptyMessage = "No data found" }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(new Set());

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      columns.some(col => String(row[col.key] || "").toLowerCase().includes(q))
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      const va = a[sortCol] ?? "";
      const vb = b[sortCol] ?? "";
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function toggleSort(key) {
    if (sortCol === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(key); setSortDir("asc"); }
  }

  function toggleAll() {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map(r => r.id)));
  }

  function toggleRow(id) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-md)", padding: "7px 12px", width: 260 }}>
          <Search size={15} style={{ color: "var(--slate-400)" }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search..." style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, width: "100%", color: "var(--slate-700)", fontFamily: "'DM Sans', sans-serif" }} />
        </div>
        {bulkActions && selected.size > 0 && (
          <div style={{ display: "flex", gap: 6 }}>
            {bulkActions.map(ba => (
              <button key={ba.label} onClick={() => { ba.onClick([...selected]); setSelected(new Set()); }} style={{ padding: "6px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--card-border)", background: ba.color || "var(--card-bg)", color: ba.textColor || "var(--slate-700)", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                {ba.label} ({selected.size})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--card-shadow)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", background: "var(--slate-50)" }}>
                {bulkActions && (
                  <th style={{ padding: "10px 12px", width: 40 }}>
                    <input type="checkbox" checked={selected.size === paged.length && paged.length > 0} onChange={toggleAll} style={{ cursor: "pointer" }} />
                  </th>
                )}
                {columns.map(col => (
                  <th key={col.key} onClick={() => col.sortable !== false && toggleSort(col.key)} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "var(--slate-700)", cursor: col.sortable !== false ? "pointer" : "default", whiteSpace: "nowrap", userSelect: "none" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {col.label}
                      {col.sortable !== false && (sortCol === col.key ? (sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronsUpDown size={14} style={{ opacity: 0.3 }} />)}
                    </span>
                  </th>
                ))}
                {actions && <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "var(--slate-700)" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={columns.length + (bulkActions ? 1 : 0) + (actions ? 1 : 0)} style={{ padding: 40, textAlign: "center", color: "var(--slate-400)" }}>{emptyMessage}</td></tr>
              ) : paged.map((row, i) => (
                <tr key={row.id || i} onClick={() => onRowClick?.(row)} style={{ borderBottom: i < paged.length - 1 ? "1px solid var(--card-border)" : "none", cursor: onRowClick ? "pointer" : "default", transition: "background 150ms" }}>
                  {bulkActions && (
                    <td style={{ padding: "10px 12px" }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} style={{ cursor: "pointer" }} />
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key} style={{ padding: "10px 14px", color: "var(--slate-700)" }}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
                    </td>
                  ))}
                  {actions && (
                    <td style={{ padding: "10px 14px", textAlign: "right" }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--slate-500)" }}>
            <span>Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}</span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid var(--card-border)", background: "var(--card-bg)", cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.4 : 1, color: "var(--slate-600)" }}><ChevronLeft size={14} /></button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid var(--card-border)", background: "var(--card-bg)", cursor: page >= totalPages - 1 ? "default" : "pointer", opacity: page >= totalPages - 1 ? 0.4 : 1, color: "var(--slate-600)" }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
