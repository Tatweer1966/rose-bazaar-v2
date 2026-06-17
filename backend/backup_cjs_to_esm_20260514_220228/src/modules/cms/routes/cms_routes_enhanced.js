const publicCtrl = require("../controllers/cms.public.controller");
const adminCtrl = require("../controllers/cms.admin.controller");
const { authenticate } = require("../../../middleware/auth");
const { adminOnly } = require("../../../middleware/adminOnly");

async function routes(fastify, options) {
  const pool = fastify.db;
  
  // Helper: wrap Express-style handler for Fastify
  function wrap(handler) {
    return async (request, reply) => {
      const req = request;
      req.body = request.body || {};
      req.params = request.params || {};
      req.query = request.query || {};
      req.user = request.user || {};
      const res = {
        json: (data) => reply.send(data),
        status: (code) => ({ json: (data) => reply.status(code).send(data) }),
      };
      return handler(req, res);
    };
  }

  // ── Public routes ──
  fastify.post("/public/settings", wrap(publicCtrl.getPublicSettings));
  fastify.post("/public/page/:slug", wrap(publicCtrl.getPublicPageBySlug));
  
  // Also keep GET versions for frontend
  fastify.get("/settings/:key", wrap(async (req, res) => {
    const { key } = req.params;
    const { rows } = await pool.query("SELECT key, value FROM cms_site_settings WHERE key = $1", [key]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Setting not found" });
    return res.json({ success: true, data: rows[0] });
  }));
  fastify.get("/components", wrap(adminCtrl.getComponentTypes));

  // ── Admin routes (auth required) ──
  const adminPre = { preHandler: [authenticate] };
  
  // Settings
  fastify.get("/admin/settings", adminPre, wrap(adminCtrl.getSettings));
  fastify.post("/admin/settings/update", adminPre, wrap(adminCtrl.updateSetting));
  fastify.put("/admin/settings/:key", adminPre, wrap(async (req, res) => {
    req.body.key = req.params.key;
    return adminCtrl.updateSetting(req, res);
  }));

  // Pages
  fastify.get("/admin/pages", adminPre, wrap(adminCtrl.getPages));
  fastify.post("/admin/pages", adminPre, wrap(adminCtrl.savePage));
  fastify.get("/admin/pages/:id", adminPre, wrap(adminCtrl.getPageById));
  fastify.put("/admin/pages/:id", adminPre, wrap(adminCtrl.savePage));
  fastify.post("/admin/pages/:id/publish", adminPre, wrap(adminCtrl.publishPage));
  fastify.post("/admin/pages/:id/unpublish", adminPre, wrap(adminCtrl.unpublishPage));

  // Blocks
  fastify.get("/admin/pages/:pageId/blocks", adminPre, wrap(async (req, res) => {
    req.body.page_id = req.params.pageId;
    return adminCtrl.getPageBlocks(req, res);
  }));
  fastify.post("/admin/pages/:pageId/blocks", adminPre, wrap(async (req, res) => {
    req.body.page_id = req.params.pageId;
    return adminCtrl.savePageBlock(req, res);
  }));
  fastify.put("/admin/blocks/:id", adminPre, wrap(adminCtrl.savePageBlock));
  fastify.delete("/admin/blocks/:id", adminPre, wrap(adminCtrl.deletePageBlock));
  fastify.put("/admin/pages/:pageId/blocks/reorder", adminPre, wrap(async (req, res) => {
    req.body.page_id = req.params.pageId;
    req.body.blocks = req.body.order || req.body.blocks;
    return adminCtrl.reorderPageBlocks(req, res);
  }));

  // Components
  fastify.get("/admin/components", adminPre, wrap(adminCtrl.getComponentTypes));
  fastify.post("/admin/component-types", adminPre, wrap(adminCtrl.getComponentTypes));

  // Versions
  fastify.post("/admin/versions", adminPre, wrap(adminCtrl.getPageVersions));
  fastify.post("/admin/version/:id/restore", adminPre, wrap(adminCtrl.restoreVersion));
}

module.exports = routes;
