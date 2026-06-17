// â•â•â• Component Schema CRUD â•â•â•
export async function getComponentSchema(request, reply) {
  const { id } = request.params;
  try {
    const result = await request.server.db.query(
      "SELECT * FROM cms_component_schemas WHERE component_type_id = $1 ORDER BY sort_order",
      [id]
    );
    return reply.send({ data: result.rows });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: "Failed to load schema" });
  }
}

export async function updateComponentSchema(request, reply) {
  const { id } = request.params;
  const { fields } = request.body;
  try {
    await request.server.db.query("DELETE FROM cms_component_schemas WHERE component_type_id = $1", [id]);
    for (const field of fields) {
      await request.server.db.query(
        `INSERT INTO cms_component_schemas (component_type_id, field_name, field_type, field_label_en, field_label_ar, placeholder, is_required, default_value, options, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, field.field_name, field.field_type, field.field_label_en, field.field_label_ar, field.placeholder, field.is_required, field.default_value, JSON.stringify(field.options || null), field.sort_order || 0]
      );
    }
    await request.server.db.query(
      "INSERT INTO cms_component_versions (component_type_id, schema_snapshot, change_note) VALUES ($1, $2, $3)",
      [id, JSON.stringify(fields), "Schema updated"]
    );
    return reply.send({ success: true });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: "Failed to update schema" });
  }
}

// â•â•â• Component Tags â•â•â•
export async function getComponentTags(request, reply) {
  const { id } = request.params;
  try {
    const result = await request.server.db.query(
      "SELECT tag FROM cms_component_tags WHERE component_type_id = $1",
      [id]
    );
    return reply.send({ data: result.rows.map(r => r.tag) });
  } catch (err) {
    return reply.code(500).send({ error: "Failed to load tags" });
  }
}

export async function updateComponentTags(request, reply) {
  const { id } = request.params;
  const { tags } = request.body;
  try {
    await request.server.db.query("DELETE FROM cms_component_tags WHERE component_type_id = $1", [id]);
    for (const tag of tags) {
      await request.server.db.query(
        "INSERT INTO cms_component_tags (component_type_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [id, tag]
      );
    }
    return reply.send({ success: true });
  } catch (err) {
    return reply.code(500).send({ error: "Failed to update tags" });
  }
}

// â•â•â• Component Versions â•â•â•
export async function getComponentVersions(request, reply) {
  const { id } = request.params;
  try {
    const result = await request.server.db.query(
      "SELECT v.*, a.name as changed_by_name FROM cms_component_versions v LEFT JOIN cms_admins a ON v.changed_by = a.id WHERE v.component_type_id = $1 ORDER BY v.created_at DESC",
      [id]
    );
    return reply.send({ data: result.rows });
  } catch (err) {
    return reply.code(500).send({ error: "Failed to load versions" });
  }
}

// â•â•â• Enhanced Components List (with metadata) â•â•â•
export async function listComponentsEnhanced(request, reply) {
  try {
    const result = await request.server.db.query(`
      SELECT ct.*,
        (SELECT COUNT(*) FROM cms_page_blocks pb WHERE pb.component_type_id = ct.id) as usage_count,
        (SELECT array_agg(tag) FROM cms_component_tags t WHERE t.component_type_id = ct.id) as tags,
        (SELECT COUNT(*) FROM cms_component_schemas s WHERE s.component_type_id = ct.id) as field_count
      FROM cms_component_types ct
      ORDER BY ct.category, ct.name
    `);
    return reply.send({ data: result.rows });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: "Failed to load components" });
  }
}

// â•â•â• Update Component Metadata â•â•â•
export async function updateComponentMetadata(request, reply) {
  const { id } = request.params;
  const { category, description_en, description_ar, status, is_global } = request.body;
  try {
    await request.server.db.query(
      `UPDATE cms_component_types SET
        category = COALESCE($2, category),
        description_en = COALESCE($3, description_en),
        description_ar = COALESCE($4, description_ar),
        status = COALESCE($5, status),
        is_global = COALESCE($6, is_global),
        updated_at = NOW()
      WHERE id = $1`,
      [id, category, description_en, description_ar, status, is_global]
    );
    return reply.send({ success: true });
  } catch (err) {
    return reply.code(500).send({ error: "Failed to update component" });
  }
}

// â•â•â• Leads CRUD â•â•â•
export async function listLeads(request, reply) {
  try {
    const result = await request.server.db.query("SELECT * FROM leads ORDER BY created_at DESC");
    return reply.send({ data: result.rows });
  } catch (err) {
    return reply.code(500).send({ error: "Failed to load leads" });
  }
}

// â•â•â• Vendor Contracts â•â•â•
export async function listContracts(request, reply) {
  try {
    const result = await request.server.db.query("SELECT * FROM vendor_contracts ORDER BY created_at DESC");
    return reply.send({ data: result.rows });
  } catch (err) {
    return reply.code(500).send({ error: "Failed to load contracts" });
  }
}

export async function updateContract(request, reply) {
  const { id } = request.params;
  const { fee_model, rate, currency, free_listings } = request.body;
  try {
    await request.server.db.query(
      "UPDATE vendor_contracts SET fee_model = COALESCE($2, fee_model), rate = COALESCE($3, rate), currency = COALESCE($4, currency), free_listings = COALESCE($5, free_listings), updated_at = NOW() WHERE id = $1",
      [id, fee_model, rate, currency, free_listings]
    );
    return reply.send({ success: true });
  } catch (err) {
    return reply.code(500).send({ error: "Failed to update contract" });
  }
}

// â•â•â• Vendor Availability â•â•â•
export async function getAvailability(request, reply) {
  const { vendor_id } = request.params;
  try {
    const result = await request.server.db.query(
      "SELECT * FROM vendor_availability WHERE vendor_id = $1 ORDER BY date",
      [vendor_id]
    );
    return reply.send({ data: result.rows });
  } catch (err) {
    return reply.code(500).send({ error: "Failed to load availability" });
  }
}

// â•â•â• Vendor list for admin â•â•â•
export async function listVendors(request, reply) {
  try {
    const result = await request.server.db.query(
      `SELECT vp.*, sc.name as category_name
       FROM vendor_profiles vp
       LEFT JOIN service_categories sc ON sc.id = vp.category_id
       ORDER BY vp.created_at DESC`
    );
    const vendors = result.rows.map(row => ({
      ...row,
      status: row.registration_status === 'approved' ? 'approved'
            : row.registration_status === 'rejected' ? 'rejected'
            : row.registration_status === 'submitted' ? 'pending'
            : 'pending'
    }));
    return reply.send({ data: vendors });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Failed to load vendors' });
  }
}

export async function updateVendorStatus(request, reply) {
  const { id } = request.params;
  const { status } = request.body;
  try {
    const regStatus = status === 'approved' ? 'approved'
                    : status === 'rejected' ? 'rejected'
                    : 'submitted';
    const isActive = status === 'approved';
    await request.server.db.query(
      `UPDATE vendor_profiles SET
        registration_status = $1,
        is_active = $2,
        is_verified = $2,
        approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE approved_at END,
        updated_at = NOW()
       WHERE id = $3`,
      [regStatus, isActive, id]
    );
    return reply.send({ success: true });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Failed to update vendor' });
  }
}

export async function listListings(request, reply) {
  try {
    const result = await request.server.db.query(
      "SELECT * FROM vendor_listings ORDER BY CASE status WHEN 'pending_review' THEN 0 WHEN 'needs_changes' THEN 1 WHEN 'approved' THEN 2 WHEN 'rejected' THEN 3 ELSE 4 END, created_at DESC"
    );
    return reply.send({ data: result.rows });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: "Failed to load listings" });
  }
}

export async function updateListingStatus(request, reply) {
  const { id } = request.params;
  const { status, rejection_reason, admin_note } = request.body;
  try {
    await request.server.db.query(
      "UPDATE vendor_listings SET status = $1, rejection_reason = $2, admin_note = $3, updated_at = NOW() WHERE id = $4",
      [status, rejection_reason || null, admin_note || null, id]
    );
    return reply.send({ success: true });
  } catch (err) {
    return reply.code(500).send({ error: "Failed to update listing" });
  }
}

export async function toggleFeatured(request, reply) {
  const { id } = request.params;
  try {
    await request.server.db.query(
      "UPDATE vendor_listings SET featured = NOT featured, updated_at = NOW() WHERE id = $1",
      [id]
    );
    return reply.send({ success: true });
  } catch (err) {
    return reply.code(500).send({ error: "Failed to toggle featured" });
  }
}

