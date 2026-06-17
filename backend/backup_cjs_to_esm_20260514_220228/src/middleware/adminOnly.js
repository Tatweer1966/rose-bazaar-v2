async function adminOnly(request, reply) {
  // For now, allow all authenticated users
  // TODO: Check cms_admins table when auth is fully wired
  if (!request.user) {
    return reply.status(403).send({ success: false, message: "Admin access required" });
  }
}

module.exports = { adminOnly };
