
// ═══ AI CONTENT GENERATION ═══
export async function generateContent(request, reply) {
  const { component_type, field_name, prompt, language } = request.body;
  try {
    // Simple AI-like content generation (template-based for now)
    // In production, connect to OpenAI/Gemini API
    const templates = {
      hero: {
        title: { en: "Your Perfect Wedding Starts Here", ar: "زفافك المثالي يبدأ هنا" },
        subtitle: { en: "Discover the finest wedding vendors in Egypt", ar: "اكتشف أفضل مقدمي خدمات الزفاف في مصر" },
      },
      cta_banner: {
        text: { en: "List Your Wedding Service Today", ar: "سجل خدمة زفافك اليوم" },
        button: { en: "Get Started Free", ar: "ابدأ مجاناً" },
      },
      testimonials: {
        quote: { en: "Rose Bazaar made our wedding planning effortless. We found the perfect venue and photographer!", ar: "روز بازار جعل تخطيط حفل زفافنا سهلاً. وجدنا المكان المثالي والمصور!" },
      },
      text_block: {
        content: { en: "Welcome to Rose Bazaar, Egypt's premier wedding marketplace. We connect couples with verified wedding vendors, offering everything from stunning venues to exquisite floral arrangements.", ar: "مرحباً بكم في روز بازار، أول سوق للأعراس في مصر. نربط الأزواج بمقدمي خدمات الزفاف المعتمدين." },
      },
    };
    const generated = templates[component_type]?.[field_name]?.[language || "en"] || "Generated content for " + field_name;
    return reply.send({ content: generated, language: language || "en", model: "template-v1" });
  } catch (err) { return reply.code(500).send({ error: "Generation failed" }); }
}

export async function generateBulkContent(request, reply) {
  const { component_type, language } = request.body;
  try {
    const fields = await request.server.db.query(
      "SELECT field_name, field_type, field_label_en FROM cms_component_schemas WHERE component_type_id = (SELECT id FROM cms_component_types WHERE slug = $1) ORDER BY sort_order",
      [component_type]
    );
    const generated = {};
    for (const f of fields.rows) {
      if (f.field_type === "text" || f.field_type === "textarea" || f.field_type === "richtext") {
        generated[f.field_name] = language === "ar"
          ? "محتوى تجريبي لـ " + (f.field_label_en || f.field_name)
          : "Sample content for " + (f.field_label_en || f.field_name);
      }
    }
    return reply.send({ data: generated, language, fields_filled: Object.keys(generated).length });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

// ═══ DEPENDENCY MANAGEMENT ═══
export async function getComponentDependencies(request, reply) {
  const { component_type_id } = request.params;
  try {
    // Find all pages using this component
    const pages = await request.server.db.query(
      "SELECT DISTINCT p.id, p.title, p.slug, p.status FROM cms_page_blocks pb JOIN cms_pages p ON pb.page_id = p.id WHERE pb.component_type_id = $1",
      [component_type_id]
    );
    // Find global components using this type
    const globals = await request.server.db.query(
      "SELECT id, name FROM cms_global_components WHERE component_type_id = $1",
      [component_type_id]
    );
    // Find variants
    const variants = await request.server.db.query(
      "SELECT id, variant_name FROM cms_component_variants WHERE component_type_id = $1",
      [component_type_id]
    );
    const total = pages.rows.length + globals.rows.length + variants.rows.length;
    return reply.send({
      total_dependencies: total,
      can_safely_delete: total === 0,
      pages: pages.rows,
      global_components: globals.rows,
      variants: variants.rows,
      warning: total > 0 ? "This component is used in " + total + " places. Editing may affect live content." : null,
    });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

// ═══ EXTERNAL DATA SOURCES ═══
export async function listExternalSources(request, reply) {
  try {
    // Return configured external data connections
    // In production, store these in DB
    const sources = [
      { id: 1, name: "Featured Vendors API", type: "internal", url: "/api/cms/listings?featured=true", status: "active", last_sync: new Date().toISOString() },
      { id: 2, name: "Vendor Categories", type: "internal", url: "/api/cms/components", status: "active", last_sync: new Date().toISOString() },
      { id: 3, name: "Lead Statistics", type: "internal", url: "/api/cms/admin/kpis/monetization", status: "active", last_sync: new Date().toISOString() },
    ];
    return reply.send({ data: sources });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

export async function fetchExternalData(request, reply) {
  const { source_url } = request.body;
  try {
    // For internal sources, just proxy the request
    // For external, would use httpx/fetch
    return reply.send({ data: null, message: "External data fetching available for internal APIs. Connect external URLs in production." });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

// ═══ DRAG & DROP — Block reordering + page builder state ═══
export async function reorderBlocks(request, reply) {
  const { page_id } = request.params;
  const { block_order } = request.body;
  try {
    for (let i = 0; i < block_order.length; i++) {
      await request.server.db.query(
        "UPDATE cms_page_blocks SET sort_order = $1 WHERE id = $2 AND page_id = $3",
        [i, block_order[i], page_id]
      );
    }
    return reply.send({ success: true, reordered: block_order.length });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

export async function getPageBuilderState(request, reply) {
  const { page_id } = request.params;
  try {
    const page = await request.server.db.query("SELECT * FROM cms_pages WHERE id = $1", [page_id]);
    const blocks = await request.server.db.query(
      "SELECT pb.*, ct.name as component_name, ct.slug as component_slug, ct.preview_html FROM cms_page_blocks pb LEFT JOIN cms_component_types ct ON pb.component_type_id = ct.id WHERE pb.page_id = $1 ORDER BY pb.sort_order",
      [page_id]
    );
    const components = await request.server.db.query("SELECT id, name, slug, preview_html, category FROM cms_component_types WHERE is_active = true ORDER BY category, name");
    return reply.send({
      page: page.rows[0],
      blocks: blocks.rows,
      available_components: components.rows,
    });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}
