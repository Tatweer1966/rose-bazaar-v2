async function routes(fastify, options) { fastify.get('/', async () => ({ module: 'venues', status: 'ready' })); }; module.exports = routes;
