async function routes(fastify, options) { fastify.get('/', async () => ({ module: 'media', status: 'ready' })); }; module.exports = routes;
