/**
 * GET /api/investor/admin/leads
 *
 * Token-gated read of the Airtable "Investor Leads" table for the
 * hidden /_/pipeline dashboard.
 *
 * Auth:
 *   · Authorization: Bearer <ADMIN_PIPELINE_TOKEN>
 *   · or cookie: aissisted_admin=<ADMIN_PIPELINE_TOKEN>
 *   · or query:  ?token=<ADMIN_PIPELINE_TOKEN>  (used once to seed the cookie)
 *
 * Returns up to 100 most recent leads (Airtable paginates in 100). If
 * ADMIN_PIPELINE_TOKEN is unset, the route 404s — the whole admin surface
 * is invisible unless the operator has wired the env var.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AirtableRecord = {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
};

type AirtableResponse = {
  records?: AirtableRecord[];
  offset?: string;
  error?: { message?: string };
};

type AdminLead = {
  id: string;
  intent: string;
  score: string;
  name: string;
  email: string;
  firm: string;
  checkSize: string;
  note: string;
  source: string;
  receivedAt: string;
};

function extractToken(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (bearer) return bearer;

  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)aissisted_admin=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);

  const url = new URL(req.url);
  const q = url.searchParams.get("token");
  if (q) return q.trim();

  return null;
}

export async function GET(req: Request) {
  const expected = process.env.ADMIN_PIPELINE_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Not found." } },
      { status: 404 },
    );
  }

  const token = extractToken(req);
  if (!token || token !== expected) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Admin token required." } },
      { status: 401 },
    );
  }

  const key = process.env.AIRTABLE_API_KEY;
  const base = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_LEADS_TABLE ?? "Investor Leads";
  if (!key || !base) {
    return NextResponse.json(
      {
        ok: true,
        source: "env_unset",
        leads: [],
        message: "Airtable env not configured. Leads appear in Vercel logs.",
      },
      { status: 200 },
    );
  }

  const url = new URL(
    `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`,
  );
  url.searchParams.set("pageSize", "100");
  url.searchParams.set("sort[0][field]", "Received At");
  url.searchParams.set("sort[0][direction]", "desc");

  let data: AirtableResponse;
  try {
    const res = await fetch(url.toString(), {
      headers: { authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    data = (await res.json()) as AirtableResponse;
    if (!res.ok) {
      return NextResponse.json(
        {
          error: {
            code: "AIRTABLE_ERROR",
            message: data.error?.message ?? `Airtable ${res.status}`,
          },
        },
        { status: 502 },
      );
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: "AIRTABLE_FETCH_FAILED",
          message: err instanceof Error ? err.message : "Airtable fetch failed",
        },
      },
      { status: 502 },
    );
  }

  const leads: AdminLead[] = (data.records ?? []).map((r) => ({
    id: r.id,
    intent: toStr(r.fields.Intent),
    score: toStr(r.fields.Score),
    name: toStr(r.fields.Name),
    email: toStr(r.fields.Email),
    firm: toStr(r.fields.Firm),
    checkSize: toStr(r.fields["Check Size"]),
    note: toStr(r.fields.Note),
    source: toStr(r.fields.Source),
    receivedAt: toStr(r.fields["Received At"]) || r.createdTime,
  }));

  const summary = {
    total: leads.length,
    hot: leads.filter((l) => l.score.toLowerCase().startsWith("hot")).length,
    warm: leads.filter((l) => l.score.toLowerCase().startsWith("warm")).length,
    cold: leads.filter((l) => l.score.toLowerCase().startsWith("cold")).length,
  };

  return NextResponse.json(
    { ok: true, source: "airtable", summary, leads },
    { status: 200, headers: { "cache-control": "private, no-store" } },
  );
}

function toStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return "";
  }
}
