import type { FastifyRequest, FastifyReply } from "fastify";
import jwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import { config } from "../config.js";

export async function registerJwt(app: FastifyInstance) {
  await app.register(jwt, {
    secret: config.jwtSecret,
    sign: { expiresIn: "7d" },
  });
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({
      error: { message: "Unauthorized", code: "UNAUTHORIZED" },
    });
  }
}
