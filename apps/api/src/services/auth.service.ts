import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@aissisted/db";
import { schema } from "@aissisted/db";
import { eq } from "@aissisted/db";

export async function createUser(email: string, password: string) {
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .get();

  if (existing) {
    throw Object.assign(new Error("Email already registered"), {
      code: "EMAIL_TAKEN",
      status: 409,
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();
  const id = randomUUID();

  await db.insert(schema.users).values({
    id,
    email: email.toLowerCase(),
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  return { id, email: email.toLowerCase(), createdAt: now };
}

export async function verifyCredentials(email: string, password: string) {
  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .get();

  if (!user) {
    throw Object.assign(new Error("Invalid credentials"), {
      code: "INVALID_CREDENTIALS",
      status: 401,
    });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Invalid credentials"), {
      code: "INVALID_CREDENTIALS",
      status: 401,
    });
  }

  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get();

  if (!user) {
    throw Object.assign(new Error("User not found"), { code: "NOT_FOUND", status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Current password is incorrect"), {
      code: "INVALID_CREDENTIALS",
      status: 401,
    });
  }

  if (newPassword.length < 8) {
    throw Object.assign(new Error("New password must be at least 8 characters"), {
      code: "WEAK_PASSWORD",
      status: 400,
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(schema.users)
    .set({ passwordHash, updatedAt: new Date().toISOString() })
    .where(eq(schema.users.id, userId));
}

export async function deleteAccount(userId: string, password: string) {
  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get();

  if (!user) {
    throw Object.assign(new Error("User not found"), { code: "NOT_FOUND", status: 404 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Password is incorrect"), {
      code: "INVALID_CREDENTIALS",
      status: 401,
    });
  }

  // CASCADE deletes handle all child records (profile, biomarkers, protocols, etc.)
  await db.delete(schema.users).where(eq(schema.users.id, userId));
}

export async function getUserById(id: string) {
  const user = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .get();

  if (!user) {
    throw Object.assign(new Error("User not found"), {
      code: "NOT_FOUND",
      status: 404,
    });
  }

  return user;
}
