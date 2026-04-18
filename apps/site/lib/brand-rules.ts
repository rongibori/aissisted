/**
 * brand-rules — programmatic Brand Bible v1.1 guards.
 *
 * Three responsibilities:
 *   1. Forbidden-word list — words Brand Bible v1.1 rejects on sight.
 *   2. Rally-cry integrity — enforce the period lock "Your Body. Understood."
 *   3. 70/20/8/2 palette budget — documented, not yet linted. Ships as a
 *      review reference and a runtime assertRallyCry util for components.
 *
 * These utilities don't block a build today; they give reviewers and
 * primitives something concrete to point at. When we wire ESLint, the
 * forbidden list here is the source of truth the rule reads.
 */

// ─── Forbidden words ──────────────────────────────────────────────────────
// Every entry is a hard no. Case-insensitive. Whole-word match on write,
// substring match is fine for review tooling.

export const FORBIDDEN_WORDS = [
  "users",
  "customers",
  "consumers",
  "revolutionary",
  "cutting-edge",
  "miracle",
  "cure",
  "game-changer",
  "unlock",
  "next-level",
  "hack",
  "powered by AI",
  "AI-driven",
] as const;

export type ForbiddenWord = (typeof FORBIDDEN_WORDS)[number];

/**
 * Returns the forbidden words present in a string (case-insensitive).
 * Use at build-time checks or in a Storybook/catalog banner if drift appears.
 */
export function findForbiddenWords(input: string): ForbiddenWord[] {
  if (!input) return [];
  const haystack = input.toLowerCase();
  return FORBIDDEN_WORDS.filter((word) =>
    haystack.includes(word.toLowerCase())
  );
}

// ─── Rally cry lock ───────────────────────────────────────────────────────
// The rally cry is "Your Body. Understood." — period, not comma, not em-dash.
// Any component that surfaces the rally cry MUST call assertRallyCry on its
// input so the comma variant (or any drift) throws loudly in dev.

export const RALLY_CRY = "Your Body. Understood." as const;

const RALLY_CRY_ACCEPTED = new Set<string>([RALLY_CRY]);

export function assertRallyCry(input: string): void {
  if (RALLY_CRY_ACCEPTED.has(input)) return;
  // Surface a loud error in dev. Silent in prod to avoid crashing the page,
  // but the catalog will flag it in the /design audit row.
  const message =
    `Rally cry drift blocked. Received: "${input}". ` +
    `The only accepted form is: "${RALLY_CRY}" (period, not comma).`;
  if (process.env.NODE_ENV !== "production") {
    throw new Error(message);
  }
  // eslint-disable-next-line no-console
  console.error(message);
}

// ─── 70/20/8/2 palette budget ─────────────────────────────────────────────
// Reference only at M2. Budget:
//   70% neutral surface + ink (white/graphite family)
//   20% secondary support (midnight on investor surfaces; aqua restraint on public)
//    8% data/accent (aqua on metric affordances, system cues)
//    2% brand red (rally cry, conversion, single hero beat per page)
// Investor Room is the one approved deviation: midnight may run +10pp (so ~30%).
// Public pages stay strict.

export const PALETTE_BUDGET = {
  neutral: 70,
  secondary: 20,
  data: 8,
  signal: 2,
} as const;

export const PALETTE_BUDGET_INVESTOR_ROOM = {
  neutral: 60,
  secondary: 30, // +10pp on #0B1D3A midnight
  data: 8,
  signal: 2,
} as const;
