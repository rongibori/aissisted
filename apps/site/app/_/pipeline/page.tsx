/**
 * /_/pipeline — hidden investor lead pipeline dashboard.
 *
 * Server component. Reads ADMIN_PIPELINE_TOKEN from env, validates the
 * token from the `aissisted_admin` cookie or the `?token=` query param.
 * On first visit with a valid query token, sets the cookie so the URL
 * can be shared without exposing the token.
 *
 * Renders:
 *   · Score-bucket summary (Hot / Warm / Cold)
 *   · Sortable-looking table of the most recent 100 leads from Airtable
 *
 * Surface language matches the investor room: schematic grid, hairline
 * dividers, UI-label typography. No emoji, no dashboard clichés.
 */

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { Container } from "@/components/container";
import { UILabel, JeffreySystem } from "@/components/typography";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

type LeadsApiResponse =
  | {
      ok: true;
      source: "airtable" | "env_unset";
      summary?: { total: number; hot: number; warm: number; cold: number };
      leads: AdminLead[];
      message?: string;
    }
  | {
      error: { code: string; message: string };
    };

type SearchParams = Record<string, string | string[] | undefined>;

async function absoluteUrl(path: string): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3001";
  return `${proto}://${host}${path}`;
}

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const expected = process.env.ADMIN_PIPELINE_TOKEN;
  if (!expected) {
    // Whole surface is invisible unless the operator has wired the env var.
    return notFoundSurface();
  }

  const sp = await searchParams;
  const queryToken = typeof sp.token === "string" ? sp.token : undefined;
  const jar = await cookies();
  const cookieToken = jar.get("aissisted_admin")?.value;
  const token = queryToken || cookieToken;

  // If the URL carries a valid token, seed the cookie and clean the URL.
  if (queryToken && queryToken === expected) {
    jar.set("aissisted_admin", queryToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect("/_/pipeline");
  }

  if (!token || token !== expected) {
    return unauthorizedSurface();
  }

  // Fetch leads server-side via the admin API, forwarding the token.
  const url = await absoluteUrl("/api/investor/admin/leads");
  let data: LeadsApiResponse | null = null;
  try {
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${expected}` },
      cache: "no-store",
    });
    data = (await res.json()) as LeadsApiResponse;
  } catch {
    data = { error: { code: "FETCH_FAILED", message: "Upstream unreachable." } };
  }

  if (!data || "error" in data) {
    return errorSurface(
      "error" in (data ?? {})
        ? (data as { error: { message: string } }).error.message
        : "Unknown error.",
    );
  }

  return (
    <main className="min-h-screen bg-[color:var(--brand-midnight)] text-white">
      <Container width="wide" className="py-12 md:py-16">
        <div className="flex items-center gap-3">
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-data" />
          <UILabel className="text-data">Pipeline · private</UILabel>
        </div>
        <h1 className="mt-6 font-display font-bold text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.015em]">
          Investor leads.
          <br />
          <span className="text-white/55">Ranked, scored, sorted.</span>
        </h1>
        <JeffreySystem className="mt-4 block text-white/45">
          Source · {data.source === "airtable" ? "Airtable · Investor Leads" : "Vercel logs (Airtable unset)"}
        </JeffreySystem>

        {data.summary ? (
          <div className="mt-10 grid gap-px md:grid-cols-4 bg-white/[0.08]">
            <SummaryCell label="Total" value={data.summary.total} />
            <SummaryCell label="Hot" value={data.summary.hot} tone="hot" />
            <SummaryCell label="Warm" value={data.summary.warm} tone="warm" />
            <SummaryCell label="Cold" value={data.summary.cold} tone="cold" />
          </div>
        ) : null}

        {data.leads.length === 0 ? (
          <div className="mt-10 p-8 bg-white/[0.03] ring-1 ring-white/10">
            <UILabel className="text-white/55">Empty</UILabel>
            <p className="mt-3 font-body text-[15px] text-white/70 max-w-lg">
              {data.message ??
                "No leads captured yet. Public CTAs still log every capture to Vercel — structured logs are the fallback of record."}
            </p>
          </div>
        ) : (
          <div className="mt-10 overflow-x-auto ring-1 ring-white/10">
            <table className="min-w-full text-left font-body text-[13.5px] leading-[1.5]">
              <thead className="bg-white/[0.03] text-white/60">
                <tr>
                  <Th>Score</Th>
                  <Th>Intent</Th>
                  <Th>Name</Th>
                  <Th>Firm</Th>
                  <Th>Check</Th>
                  <Th>Email</Th>
                  <Th>Received</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {data.leads.map((l) => (
                  <tr key={l.id} className="hover:bg-white/[0.03] transition-colors">
                    <Td>
                      <ScoreChip score={l.score} />
                    </Td>
                    <Td>
                      <span className="font-system text-[11.5px] uppercase tracking-[0.14em] text-white/85">
                        {l.intent || "—"}
                      </span>
                    </Td>
                    <Td className="text-white">{l.name || "—"}</Td>
                    <Td className="text-white/75">{l.firm || "—"}</Td>
                    <Td className="text-white/75">{l.checkSize || "—"}</Td>
                    <Td>
                      <a
                        className="text-data hover:underline underline-offset-4"
                        href={`mailto:${l.email}`}
                      >
                        {l.email || "—"}
                      </a>
                    </Td>
                    <Td className="text-white/55">
                      {formatStamp(l.receivedAt)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <JeffreySystem className="mt-10 block text-white/40">
          Private surface · no-index · rotates on ADMIN_PIPELINE_TOKEN change · log-out by clearing cookies.
        </JeffreySystem>
      </Container>
    </main>
  );
}

function SummaryCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "hot" | "warm" | "cold";
}) {
  const toneClass =
    tone === "hot"
      ? "text-brand"
      : tone === "warm"
        ? "text-data"
        : tone === "cold"
          ? "text-white/55"
          : "text-white";
  return (
    <div className="bg-[color:var(--brand-midnight)] p-6 md:p-8">
      <UILabel className="text-white/55">{label}</UILabel>
      <div
        className={`mt-4 font-display font-semibold tracking-[-0.02em] leading-none ${toneClass}`}
        style={{ fontSize: "clamp(2rem,3.4vw,2.75rem)" }}
      >
        {value}
      </div>
    </div>
  );
}

function ScoreChip({ score }: { score: string }) {
  const s = score.toLowerCase();
  const bucket = s.startsWith("hot") ? "hot" : s.startsWith("warm") ? "warm" : "cold";
  const cls =
    bucket === "hot"
      ? "bg-brand text-white"
      : bucket === "warm"
        ? "bg-data text-[color:var(--brand-midnight)]"
        : "bg-white/10 text-white/70";
  return (
    <span
      className={`inline-flex items-center h-6 px-2.5 font-system text-[10.5px] uppercase tracking-[0.16em] ${cls}`}
    >
      {bucket}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-system text-[10.5px] uppercase tracking-[0.18em] font-normal">
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 align-top ${className ?? ""}`}>{children}</td>
  );
}

function formatStamp(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toISOString().replace("T", " ").slice(0, 16) + "Z";
  } catch {
    return iso;
  }
}

function notFoundSurface() {
  return (
    <main className="min-h-screen bg-[color:var(--brand-midnight)] text-white flex items-center justify-center">
      <div className="text-center">
        <UILabel className="text-white/55">404</UILabel>
        <p className="mt-3 font-display text-xl">Not here.</p>
      </div>
    </main>
  );
}

function unauthorizedSurface() {
  return (
    <main className="min-h-screen bg-[color:var(--brand-midnight)] text-white flex items-center justify-center">
      <div className="text-center max-w-sm">
        <UILabel className="text-data">Private</UILabel>
        <p className="mt-3 font-display text-xl">Token required.</p>
        <JeffreySystem className="mt-4 block text-white/55">
          Append <span className="text-white/80">?token=…</span> once to seed the cookie, then the URL stays clean.
        </JeffreySystem>
      </div>
    </main>
  );
}

function errorSurface(message: string) {
  return (
    <main className="min-h-screen bg-[color:var(--brand-midnight)] text-white flex items-center justify-center">
      <div className="text-center max-w-lg">
        <UILabel className="text-brand">Upstream error</UILabel>
        <p className="mt-3 font-display text-xl">{message}</p>
      </div>
    </main>
  );
}
