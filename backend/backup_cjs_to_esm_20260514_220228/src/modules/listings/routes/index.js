async function routes(fastify, options) { fastify.get('/', async () => ({ module: 'listings', status: 'ready' })); }; module.exports = routes;
