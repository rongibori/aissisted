import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import * as authService from "../services/auth.service.js";
import { changePassword, deleteAccount } from "../services/auth.service.js";

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post(
    "/auth/register",
    {
      config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };

      try {
        const user = await authService.createUser(email, password);
        const token = app.jwt.sign({ sub: user.id, email: user.email });
        reply.status(201).send({ data: { user, token } });
      } catch (err: any) {
        reply
          .status(err.status ?? 500)
          .send({ error: { message: err.message, code: err.code ?? "ERROR" } });
      }
    }
  );

  // POST /auth/login
  app.post(
    "/auth/login",
    {
      config: { rateLimit: { max: 10, timeWindow: "15 minutes" } },
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string" },
            password: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };

      try {
        const user = await authService.verifyCredentials(email, password);
        const token = app.jwt.sign({ sub: user.id, email: user.email });
        reply.send({ data: { user, token } });
      } catch (err: any) {
        reply
          .status(err.status ?? 500)
          .send({ error: { message: err.message, code: err.code ?? "ERROR" } });
      }
    }
  );

  // GET /auth/me
  app.get(
    "/auth/me",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      try {
        const { sub } = request.user as { sub: string };
        const user = await authService.getUserById(sub);
        reply.send({ data: { user } });
      } catch (err: any) {
        reply
          .status(err.status ?? 500)
          .send({ error: { message: err.message, code: err.code ?? "ERROR" } });
      }
    }
  );

  // DELETE /auth/account — permanently delete account (requires password confirmation)
  app.delete(
    "/auth/account",
    {
      preHandler: [requireAuth],
      config: { rateLimit: { max: 3, timeWindow: "1 hour" } },
      schema: {
        body: {
          type: "object",
          required: ["password"],
          properties: {
            password: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const { password } = request.body as { password: string };
      try {
        await deleteAccount(sub, password);
        reply.send({ data: { message: "Account deleted" } });
      } catch (err: any) {
        reply
          .status(err.status ?? 500)
          .send({ error: { message: err.message, code: err.code ?? "ERROR" } });
      }
    }
  );

  // POST /auth/change-password
  app.post(
    "/auth/change-password",
    {
      preHandler: [requireAuth],
      config: { rateLimit: { max: 5, timeWindow: "15 minutes" } },
      schema: {
        body: {
          type: "object",
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: { type: "string" },
            newPassword: { type: "string", minLength: 8 },
          },
        },
      },
    },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const { currentPassword, newPassword } = request.body as {
        currentPassword: string;
        newPassword: string;
      };
      try {
        await changePassword(sub, currentPassword, newPassword);
        reply.send({ data: { message: "Password changed successfully" } });
      } catch (err: any) {
        reply
          .status(err.status ?? 500)
          .send({ error: { message: err.message, code: err.code ?? "ERROR" } });
      }
    }
  );
}
