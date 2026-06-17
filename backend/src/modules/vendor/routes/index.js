async function routes(fastify, options) { fastify.get('/', async () => ({ module: 'vendor', status: 'ready' })); }; export default routes;

