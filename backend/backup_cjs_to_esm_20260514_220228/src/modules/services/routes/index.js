async function routes(fastify, options) { fastify.get('/', async () => ({ module: 'services', status: 'ready' })); }; module.exports = routes;
