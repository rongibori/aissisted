import { randomUUID } from "crypto";
import { config } from "../../config.js";
import { db, schema, eq, and } from "@aissisted/db";

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.whoop.clientId,
    redirect_uri: config.whoop.redirectUri,
    response_type: "code",
    scope: config.whoop.scopes,
    state,
  });
  return `${config.whoop.authUrl}?${params}`;
}

export interface WhoopTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export async function exchangeCode(code: string): Promise<WhoopTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.whoop.redirectUri,
    client_id: config.whoop.clientId,
    client_secret: config.whoop.clientSecret,
  });

  const res = await fetch(config.whoop.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`WHOOP token exchange failed: ${txt}`);
  }

  return res.json() as Promise<WhoopTokenResponse>;
}

export async function refreshToken(userId: string): Promise<string> {
  const stored = await db
    .select()
    .from(schema.integrationTokens)
    .where(and(eq(schema.integrationTokens.userId, userId), eq(schema.integrationTokens.provider, "whoop")))
    .get();

  if (!stored || stored.provider !== "whoop" || !stored.refreshToken) {
    throw new Error("No WHOOP token found for user");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: stored.refreshToken,
    client_id: config.whoop.clientId,
    client_secret: config.whoop.clientSecret,
  });

  const res = await fetch(config.whoop.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) throw new Error("WHOOP token refresh failed");

  const data = (await res.json()) as WhoopTokenResponse;
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  const now = new Date().toISOString();

  await db
    .update(schema.integrationTokens)
    .set({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
      updatedAt: now,
    })
    .where(and(eq(schema.integrationTokens.userId, userId), eq(schema.integrationTokens.provider, "whoop")));

  return data.access_token;
}

export async function storeTokens(
  userId: string,
  tokens: WhoopTokenResponse
): Promise<void> {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  const now = new Date().toISOString();

  const existing = await db
    .select()
    .from(schema.integrationTokens)
    .where(and(eq(schema.integrationTokens.userId, userId), eq(schema.integrationTokens.provider, "whoop")))
    .get();

  if (existing) {
    await db
      .update(schema.integrationTokens)
      .set({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scope: tokens.scope,
        updatedAt: now,
      })
      .where(and(eq(schema.integrationTokens.userId, userId), eq(schema.integrationTokens.provider, "whoop")));
  } else {
    await db.insert(schema.integrationTokens).values({
      id: randomUUID(),
      userId,
      provider: "whoop",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      scope: tokens.scope,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export async function getAccessToken(userId: string): Promise<string> {
  const stored = await db
    .select()
    .from(schema.integrationTokens)
    .where(and(eq(schema.integrationTokens.userId, userId), eq(schema.integrationTokens.provider, "whoop")))
    .get();

  if (!stored?.accessToken) throw new Error("WHOOP not connected");

  // Refresh if expires within 5 minutes
  if (stored.expiresAt) {
    const expiresAt = new Date(stored.expiresAt).getTime();
    if (expiresAt - Date.now() < 5 * 60 * 1000) {
      return refreshToken(userId);
    }
  }

  return stored.accessToken;
}
