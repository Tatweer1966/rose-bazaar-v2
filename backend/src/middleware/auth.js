async function authenticate(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ success: false, message: 'Unauthorized' });
  }
}

async function requireAdmin(request, reply) {
  try {
    await request.jwtVerify();
    if (request.user.role !== 'admin' && request.user.role !== 'super_admin') {
      reply.status(403).send({ success: false, message: 'Admin access required' });
    }
  } catch (err) {
    reply.status(401).send({ success: false, message: 'Unauthorized' });
  }
}

export { authenticate, requireAdmin };

