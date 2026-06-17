import settingsCtrl from '../controllers/settings.js';
import pagesCtrl from '../controllers/pages.js';
import blocksCtrl from '../controllers/blocks.js';
import componentsCtrl from '../controllers/components.js';
import { authenticate, requireAdmin } from '../../../middleware/auth.js';
import * as phase2 from '../phase2.controller.js';
import * as final from '../final.controller.js';
import * as phase4 from '../phase4.controller.js';
import * as phase3 from '../phase3.controller.js';
import * as money from '../monetization.controller.js';

async function routes(fastify, options) {
  // ── Public (frontend fetches) ──
  fastify.get('/settings/:key', settingsCtrl.getByKey);
  fastify.get('/pages/by-slug', pagesCtrl.getBySlug);
  fastify.get('/components', componentsCtrl.list);
  fastify.get('/listings', async (req, reply) => { try { const r = await req.server.db.query("SELECT * FROM vendor_listings WHERE status = 'approved' ORDER BY featured DESC, created_at DESC"); return reply.send({ data: r.rows }); } catch(e) { return reply.code(500).send({ error: 'Failed' }); } });

  // ── Admin (requires auth) ──
  // Settings
  fastify.get('/admin/settings', { /*preHandler: [authenticate]*/ }, settingsCtrl.list);
  fastify.put('/admin/settings/:key', { /*preHandler: [authenticate]*/ }, settingsCtrl.update);

  // Pages
  fastify.get('/admin/pages', { /*preHandler: [authenticate]*/ }, pagesCtrl.list);
  fastify.get('/admin/pages/:id', { /*preHandler: [authenticate]*/ }, pagesCtrl.getById);
  fastify.post('/admin/pages', { /*preHandler: [authenticate]*/ }, pagesCtrl.create);
  fastify.put('/admin/pages/:id', { /*preHandler: [authenticate]*/ }, pagesCtrl.update);
  fastify.delete('/admin/pages/:id', { /*preHandler: [authenticate]*/ }, pagesCtrl.remove);
  fastify.post('/admin/pages/:id/publish', { /*preHandler: [authenticate]*/ }, pagesCtrl.publish);
  fastify.post('/admin/pages/:id/unpublish', { /*preHandler: [authenticate]*/ }, pagesCtrl.unpublish);

  // Blocks
  fastify.get('/admin/pages/:pageId/blocks', { /*preHandler: [authenticate]*/ }, blocksCtrl.list);
  fastify.post('/admin/pages/:pageId/blocks', { /*preHandler: [authenticate]*/ }, blocksCtrl.create);
  fastify.put('/admin/blocks/:id', { /*preHandler: [authenticate]*/ }, blocksCtrl.update);
  fastify.delete('/admin/blocks/:id', { /*preHandler: [authenticate]*/ }, blocksCtrl.remove);
  fastify.put('/admin/pages/:pageId/blocks/reorder', { /*preHandler: [authenticate]*/ }, blocksCtrl.reorder);

  // Components
  fastify.get('/admin/components', { /*preHandler: [authenticate]*/ }, componentsCtrl.list);
  fastify.post('/admin/components', { /*preHandler: [authenticate]*/ }, componentsCtrl.create);
  fastify.put('/admin/components/:id', { /*preHandler: [authenticate]*/ }, componentsCtrl.update);

  // Phase 2 - Component Schemas, Tags, Versions
  fastify.get('/admin/components/enhanced', phase2.listComponentsEnhanced);
  fastify.get('/admin/components/:id/schema', phase2.getComponentSchema);
  fastify.put('/admin/components/:id/schema', phase2.updateComponentSchema);
  fastify.get('/admin/components/:id/tags', phase2.getComponentTags);
  fastify.put('/admin/components/:id/tags', phase2.updateComponentTags);
  fastify.get('/admin/components/:id/versions', phase2.getComponentVersions);
  fastify.put('/admin/components/:id/metadata', phase2.updateComponentMetadata);

  // Phase 2 - Leads, Contracts, Availability
  fastify.get('/admin/vendors', phase2.listVendors);
  fastify.put('/admin/vendors/:id/status', phase2.updateVendorStatus);
  fastify.get('/admin/leads', phase2.listLeads);
  fastify.get('/admin/listings', phase2.listListings);
  fastify.put('/admin/listings/:id/status', phase2.updateListingStatus);
  fastify.put('/admin/listings/:id/featured', phase2.toggleFeatured);
  fastify.get('/admin/contracts', phase2.listContracts);
  fastify.put('/admin/contracts/:id', phase2.updateContract);
  fastify.get('/admin/vendors/:vendor_id/availability', phase2.getAvailability);

  // Media (placeholder - returns empty list)
  fastify.get('/admin/media', async (req, reply) => { reply.send({ data: [] }); });

  // Monetization - Wallets, Transactions, KPIs, Enforcement
  fastify.get('/admin/wallets', money.listWallets);
  fastify.get('/admin/wallets/:vendor_id', money.getWallet);
  fastify.post('/admin/wallets/:vendor_id/add-funds', money.addFunds);
  fastify.post('/admin/wallets/:vendor_id/deduct', money.deductFunds);
  fastify.post('/admin/wallets/:vendor_id/upgrade', money.upgradePlan);
  fastify.get('/admin/transactions', money.listTransactions);
  fastify.get('/admin/vendors/:vendor_id/can-publish', money.checkCanPublish);
  fastify.get('/admin/kpis/monetization', money.getMonetizationKPIs);

  // Final: Permissions, Previews, Blocks, Featured, Notifications
  fastify.get('/admin/permissions/check', final.checkPermission);
  fastify.put('/admin/permissions/:admin_id', final.updatePermissions);
  fastify.get('/admin/components/:id/preview', final.getComponentPreview);
  fastify.put('/admin/components/:id/preview', final.updateComponentPreview);
  fastify.post('/admin/blocks/from-component', final.createBlockFromComponent);
  fastify.post('/admin/listings/:listing_id/feature', final.featureListing);
  fastify.get('/admin/notifications', final.listNotifications);
  fastify.put('/admin/notifications/:id/read', final.markNotificationRead);
  fastify.post('/admin/notifications', final.createNotification);

  // Phase 3: Versioning
  fastify.post('/admin/components/:component_type_id/versions', phase3.createVersion);
  fastify.post('/admin/versions/:version_id/restore', phase3.restoreVersion);

  // Phase 3: Global Components
  fastify.get('/admin/global-components', phase3.listGlobalComponents);
  fastify.post('/admin/global-components', phase3.createGlobalComponent);

  // Phase 3: Template Variants
  fastify.get('/admin/components/:component_type_id/variants', phase3.listVariants);
  fastify.post('/admin/components/:component_type_id/variants', phase3.createVariant);

  // Phase 3: Scheduling
  fastify.post('/admin/schedule', phase3.scheduleContent);
  fastify.get('/admin/scheduled', phase3.listScheduled);

  // Phase 3: Component Analytics
  fastify.get('/admin/components/:component_type_id/analytics', phase3.getComponentAnalytics);
  fastify.get('/admin/analytics/components', phase3.getAllComponentAnalytics);

  // Phase 3: Audit Logs
  fastify.get('/admin/audit-logs', phase3.getAuditLogs);

  // Phase 4: AI, Dependencies, External Data, Drag & Drop
  fastify.post('/admin/ai/generate', phase4.generateContent);
  fastify.post('/admin/ai/generate-bulk', phase4.generateBulkContent);
  fastify.get('/admin/components/:component_type_id/dependencies', phase4.getComponentDependencies);
  fastify.get('/admin/external-sources', phase4.listExternalSources);
  fastify.post('/admin/external-sources/fetch', phase4.fetchExternalData);
  fastify.put('/admin/pages/:page_id/reorder-blocks', phase4.reorderBlocks);
  fastify.get('/admin/pages/:page_id/builder', phase4.getPageBuilderState);
}

export default routes;
