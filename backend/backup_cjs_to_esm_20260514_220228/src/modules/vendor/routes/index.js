async function routes(fastify, options) { fastify.get('/', async () => ({ module: 'vendor', status: 'ready' })); }; module.exports = routes;
