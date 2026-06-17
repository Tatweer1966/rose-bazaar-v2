async function routes(fastify, options) { fastify.get('/', async () => ({ module: 'auth', status: 'ready' })); }; export default routes;

