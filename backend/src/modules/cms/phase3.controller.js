
// ═══ COMPONENT VERSIONING ═══
export async function createVersion(request, reply) {
  const { component_type_id } = request.params;
  const { change_note } = request.body;
  try {
    const comp = await request.server.db.query("SELECT * FROM cms_component_types WHERE id = $1", [component_type_id]);
    const schemas = await request.server.db.query("SELECT * FROM cms_component_schemas WHERE component_type_id = $1 ORDER BY sort_order", [component_type_id]);
    const maxVer = await request.server.db.query("SELECT COALESCE(MAX(version_number), 0) + 1 as next FROM cms_component_versions WHERE component_type_id = $1", [component_type_id]);
    const result = await request.server.db.query(
      "INSERT INTO cms_component_versions (component_type_id, version_number, schema_snapshot, change_note, is_active) VALUES ($1, $2, $3, $4, true) RETURNING *",
      [component_type_id, maxVer.rows[0].next, JSON.stringify({ component: comp.rows[0], schemas: schemas.rows }), change_note || "New version"]
    );
    await request.server.db.query("UPDATE cms_component_versions SET is_active = false WHERE component_type_id = $1 AND id != $2", [component_type_id, result.rows[0].id]);
    return reply.send({ data: result.rows[0] });
  } catch (err) { request.log.error(err); return reply.code(500).send({ error: "Failed" }); }
}

export async function restoreVersion(request, reply) {
  const { version_id } = request.params;
  try {
    const ver = await request.server.db.query("SELECT * FROM cms_component_versions WHERE id = $1", [version_id]);
    if (!ver.rows[0]) return reply.code(404).send({ error: "Version not found" });
    const snapshot = ver.rows[0].schema_snapshot;
    if (snapshot?.schemas) {
      await request.server.db.query("DELETE FROM cms_component_schemas WHERE component_type_id = $1", [ver.rows[0].component_type_id]);
      for (const s of snapshot.schemas) {
        await request.server.db.query(
          "INSERT INTO cms_component_schemas (component_type_id, field_name, field_type, field_label_en, field_label_ar, is_required, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7)",
          [ver.rows[0].component_type_id, s.field_name, s.field_type, s.field_label_en, s.field_label_ar, s.is_required, s.sort_order]
        );
      }
    }
    await request.server.db.query("UPDATE cms_component_versions SET is_active = true WHERE id = $1", [version_id]);
    await request.server.db.query("UPDATE cms_component_versions SET is_active = false WHERE component_type_id = $1 AND id != $2", [ver.rows[0].component_type_id, version_id]);
    return reply.send({ success: true, restored_version: ver.rows[0].version_number });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

// ═══ GLOBAL COMPONENTS ═══
export async function listGlobalComponents(request, reply) {
  try {
    const result = await request.server.db.query("SELECT g.*, c.name as type_name, c.slug as type_slug FROM cms_global_components g LEFT JOIN cms_component_types c ON g.component_type_id = c.id ORDER BY g.created_at DESC");
    return reply.send({ data: result.rows });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

export async function createGlobalComponent(request, reply) {
  const { component_type_id, name, name_ar, props_en, props_ar } = request.body;
  try {
    const result = await request.server.db.query(
      "INSERT INTO cms_global_components (component_type_id, name, name_ar, props_en, props_ar) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [component_type_id, name, name_ar, JSON.stringify(props_en || {}), JSON.stringify(props_ar || {})]
    );
    return reply.send({ data: result.rows[0] });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

// ═══ TEMPLATE VARIANTS ═══
export async function listVariants(request, reply) {
  const { component_type_id } = request.params;
  try {
    const result = await request.server.db.query("SELECT * FROM cms_component_variants WHERE component_type_id = $1 ORDER BY is_default DESC, created_at", [component_type_id]);
    return reply.send({ data: result.rows });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

export async function createVariant(request, reply) {
  const { component_type_id } = request.params;
  const { variant_name, variant_name_ar, description, preview_html, default_props, is_default } = request.body;
  try {
    if (is_default) await request.server.db.query("UPDATE cms_component_variants SET is_default = false WHERE component_type_id = $1", [component_type_id]);
    const result = await request.server.db.query(
      "INSERT INTO cms_component_variants (component_type_id, variant_name, variant_name_ar, description, preview_html, default_props, is_default) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [component_type_id, variant_name, variant_name_ar, description, preview_html, JSON.stringify(default_props || {}), is_default || false]
    );
    return reply.send({ data: result.rows[0] });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

// ═══ SCHEDULING ═══
export async function scheduleContent(request, reply) {
  const { entity_type, entity_id, action, scheduled_at } = request.body;
  try {
    const result = await request.server.db.query(
      "INSERT INTO cms_scheduled_content (entity_type, entity_id, action, scheduled_at) VALUES ($1,$2,$3,$4) RETURNING *",
      [entity_type, entity_id, action, scheduled_at]
    );
    return reply.send({ data: result.rows[0] });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

export async function listScheduled(request, reply) {
  try {
    const result = await request.server.db.query("SELECT * FROM cms_scheduled_content WHERE executed = false ORDER BY scheduled_at");
    return reply.send({ data: result.rows });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

// ═══ COMPONENT ANALYTICS ═══
export async function getComponentAnalytics(request, reply) {
  const { component_type_id } = request.params;
  try {
    const result = await request.server.db.query(
      "SELECT date, event, SUM(count) as total FROM cms_component_analytics WHERE component_type_id = $1 GROUP BY date, event ORDER BY date DESC LIMIT 30",
      [component_type_id]
    );
    const summary = await request.server.db.query(
      "SELECT event, SUM(count) as total FROM cms_component_analytics WHERE component_type_id = $1 GROUP BY event",
      [component_type_id]
    );
    return reply.send({ daily: result.rows, summary: summary.rows });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

export async function getAllComponentAnalytics(request, reply) {
  try {
    const result = await request.server.db.query(
      "SELECT ct.name, ct.slug, a.event, SUM(a.count) as total FROM cms_component_analytics a JOIN cms_component_types ct ON a.component_type_id = ct.id GROUP BY ct.name, ct.slug, a.event ORDER BY total DESC"
    );
    return reply.send({ data: result.rows });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

// ═══ AUDIT LOGS ═══
export async function getAuditLogs(request, reply) {
  const limit = request.query.limit || 50;
  try {
    const result = await request.server.db.query(
      "SELECT al.*, a.name as admin_name, a.email as admin_email FROM cms_audit_log al LEFT JOIN cms_admins a ON al.admin_id = a.id ORDER BY al.created_at DESC LIMIT $1",
      [limit]
    );
    return reply.send({ data: result.rows });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}
