const settingsCtrl = require('../controllers/settings');
const pagesCtrl = require('../controllers/pages');
const blocksCtrl = require('../controllers/blocks');
const componentsCtrl = require('../controllers/components');
const { authenticate, requireAdmin } = require('../../../middleware/auth');

async function routes(fastify, options) {
  // â”€â”€ Public (frontend fetches) â”€â”€
  fastify.get('/settings/:key', settingsCtrl.getByKey);
  fastify.get('/pages/by-slug', pagesCtrl.getBySlug);
  fastify.get('/components', componentsCtrl.list);

  // â”€â”€ Admin (requires auth) â”€â”€
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
}

module.exports = routes;


