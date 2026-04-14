import { randomUUID } from "crypto";
import { db, schema, eq } from "@aissisted/db";

export async function getProfile(userId: string) {
  const profile = await db
    .select()
    .from(schema.healthProfiles)
    .where(eq(schema.healthProfiles.userId, userId))
    .get();

  if (!profile) return null;

  return {
    ...profile,
    goals: JSON.parse(profile.goals),
    conditions: JSON.parse(profile.conditions),
    medications: JSON.parse(profile.medications),
    supplements: JSON.parse(profile.supplements),
  };
}

export async function upsertProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    sex?: "male" | "female" | "other";
    goals?: string[];
    conditions?: string[];
    medications?: string[];
    supplements?: string[];
  }
) {
  const now = new Date().toISOString();
  const existing = await db
    .select()
    .from(schema.healthProfiles)
    .where(eq(schema.healthProfiles.userId, userId))
    .get();

  if (existing) {
    await db
      .update(schema.healthProfiles)
      .set({
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.dateOfBirth !== undefined && {
          dateOfBirth: data.dateOfBirth,
        }),
        ...(data.sex !== undefined && { sex: data.sex }),
        ...(data.goals !== undefined && {
          goals: JSON.stringify(data.goals),
        }),
        ...(data.conditions !== undefined && {
          conditions: JSON.stringify(data.conditions),
        }),
        ...(data.medications !== undefined && {
          medications: JSON.stringify(data.medications),
        }),
        ...(data.supplements !== undefined && {
          supplements: JSON.stringify(data.supplements),
        }),
        updatedAt: now,
      })
      .where(eq(schema.healthProfiles.userId, userId));
  } else {
    await db.insert(schema.healthProfiles).values({
      id: randomUUID(),
      userId,
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      dateOfBirth: data.dateOfBirth,
      sex: data.sex,
      goals: JSON.stringify(data.goals ?? []),
      conditions: JSON.stringify(data.conditions ?? []),
      medications: JSON.stringify(data.medications ?? []),
      supplements: JSON.stringify(data.supplements ?? []),
      createdAt: now,
      updatedAt: now,
    });
  }

  return getProfile(userId);
}
