const { loginAdmin, getMe, changePassword } = require("./auth.controller.js");

async function authRoutes(fastify) {
  fastify.post("/api/cms/auth/login", loginAdmin);
  fastify.get("/api/cms/auth/me", getMe);
  fastify.post("/api/cms/auth/change-password", changePassword);
}

module.exports = authRoutes;
