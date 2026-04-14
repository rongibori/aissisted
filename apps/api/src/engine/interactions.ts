/**
 * Supplement-supplement and supplement-drug interaction checker.
 *
 * Each interaction entry defines two parties and the severity/description.
 * Severity: "warning" = possible interaction, use caution
 *           "contraindicated" = do not combine
 */

export type InteractionSeverity = "warning" | "contraindicated";

export interface Interaction {
  a: string;          // supplement or drug name (lowercase, partial match)
  b: string;
  severity: InteractionSeverity;
  description: string;
}

/**
 * Known interactions. Names are lowercased partial-match strings.
 * In production these would be loaded from a curated database (e.g. Natural Medicines).
 */
export const INTERACTIONS: Interaction[] = [
  // ─── Blood thinners ──────────────────────────────────
  {
    a: "omega-3",
    b: "warfarin",
    severity: "warning",
    description: "Omega-3 fatty acids may enhance anticoagulant effects of warfarin. Monitor INR closely.",
  },
  {
    a: "omega-3",
    b: "aspirin",
    severity: "warning",
    description: "High-dose omega-3 combined with aspirin may increase bleeding risk.",
  },
  {
    a: "vitamin e",
    b: "warfarin",
    severity: "warning",
    description: "Vitamin E at high doses may potentiate warfarin anticoagulation.",
  },
  {
    a: "ginkgo",
    b: "warfarin",
    severity: "contraindicated",
    description: "Ginkgo biloba significantly increases bleeding risk with warfarin.",
  },
  {
    a: "melatonin",
    b: "warfarin",
    severity: "warning",
    description: "Melatonin may affect CYP1A2 metabolism of warfarin. Monitor INR.",
  },

  // ─── Immunosuppressants ───────────────────────────────
  {
    a: "melatonin",
    b: "immunosuppressant",
    severity: "contraindicated",
    description: "Melatonin may stimulate immune function, opposing immunosuppressant therapy.",
  },
  {
    a: "ashwagandha",
    b: "immunosuppressant",
    severity: "warning",
    description: "Ashwagandha's immunostimulatory effects may reduce efficacy of immunosuppressants.",
  },
  {
    a: "echinacea",
    b: "immunosuppressant",
    severity: "contraindicated",
    description: "Echinacea stimulates the immune system and is contraindicated with immunosuppressants.",
  },

  // ─── Thyroid medications ─────────────────────────────
  {
    a: "iron",
    b: "levothyroxine",
    severity: "warning",
    description: "Iron supplements can chelate levothyroxine and reduce absorption. Take 4 hours apart.",
  },
  {
    a: "calcium",
    b: "levothyroxine",
    severity: "warning",
    description: "Calcium impairs levothyroxine absorption. Take 4 hours apart.",
  },

  // ─── MAOIs / antidepressants ─────────────────────────
  {
    a: "5-htp",
    b: "ssri",
    severity: "contraindicated",
    description: "Combining 5-HTP with SSRIs risks serotonin syndrome.",
  },
  {
    a: "5-htp",
    b: "maoi",
    severity: "contraindicated",
    description: "5-HTP with MAOIs is contraindicated due to severe serotonin syndrome risk.",
  },
  {
    a: "st. john",
    b: "ssri",
    severity: "contraindicated",
    description: "St. John's Wort combined with SSRIs risks serotonin syndrome and reduces drug efficacy.",
  },
  {
    a: "sam-e",
    b: "ssri",
    severity: "warning",
    description: "SAMe may have additive serotonergic effects with SSRIs.",
  },

  // ─── Diabetes medications ─────────────────────────────
  {
    a: "berberine",
    b: "metformin",
    severity: "warning",
    description: "Berberine and metformin have additive glucose-lowering effects; monitor for hypoglycemia.",
  },
  {
    a: "chromium",
    b: "insulin",
    severity: "warning",
    description: "Chromium may enhance insulin sensitivity; monitor blood glucose.",
  },

  // ─── Stimulants / cardiac ─────────────────────────────
  {
    a: "caffeine",
    b: "ephedrine",
    severity: "contraindicated",
    description: "Caffeine + ephedrine significantly increases cardiovascular risk.",
  },
  {
    a: "synephrine",
    b: "maoi",
    severity: "contraindicated",
    description: "Synephrine with MAOIs risks severe hypertensive crisis.",
  },

  // ─── Liver / CYP enzymes ─────────────────────────────
  {
    a: "kava",
    b: "alcohol",
    severity: "contraindicated",
    description: "Kava combined with alcohol greatly increases risk of liver damage.",
  },
  {
    a: "black cohosh",
    b: "hepatotoxic",
    severity: "warning",
    description: "Black cohosh may have hepatotoxic potential; avoid with other hepatotoxic drugs.",
  },

  // ─── Supplement-supplement interactions ───────────────
  {
    a: "iron",
    b: "calcium",
    severity: "warning",
    description: "Iron and calcium compete for absorption. Take at different times of day.",
  },
  {
    a: "zinc",
    b: "copper",
    severity: "warning",
    description: "High-dose zinc supplementation depletes copper over time. Add copper if using >40mg zinc.",
  },
  {
    a: "vitamin d",
    b: "calcium",
    severity: "warning",
    description: "Very high vitamin D combined with high calcium may cause hypercalcemia.",
  },
  {
    a: "magnesium",
    b: "calcium",
    severity: "warning",
    description: "Calcium and magnesium compete for absorption at high doses; consider separate timing.",
  },
];

export interface InteractionResult {
  supplement: string;
  interactsWith: string;
  severity: InteractionSeverity;
  description: string;
}

/**
 * Check a list of supplement names and user medications/conditions for known interactions.
 *
 * @param supplements  Names of supplements in the recommended stack (e.g. ["Magnesium Glycinate"])
 * @param medications  User's medications (e.g. ["warfarin"])
 * @param conditions   User's conditions (e.g. ["hypothyroid"])
 * @returns Array of triggered interactions, sorted by severity (contraindicated first)
 */
export function checkInteractions(
  supplements: string[],
  medications: string[],
  conditions: string[]
): InteractionResult[] {
  const allTerms = [
    ...supplements.map((s) => s.toLowerCase()),
    ...medications.map((m) => m.toLowerCase()),
    ...conditions.map((c) => c.toLowerCase()),
  ];

  const results: InteractionResult[] = [];
  const seen = new Set<string>();

  for (const interaction of INTERACTIONS) {
    const aMatch = allTerms.find((t) => t.includes(interaction.a) || interaction.a.includes(t));
    const bMatch = allTerms.find((t) => t.includes(interaction.b) || interaction.b.includes(t));

    if (aMatch && bMatch && aMatch !== bMatch) {
      const key = [interaction.a, interaction.b].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        supplement: aMatch,
        interactsWith: bMatch,
        severity: interaction.severity,
        description: interaction.description,
      });
    }
  }

  // Sort: contraindicated first, then warnings
  return results.sort((a, b) =>
    a.severity === "contraindicated" && b.severity !== "contraindicated" ? -1 : 1
  );
}

/**
 * Convert interaction results to human-readable warning strings.
 */
export function formatInteractionWarnings(interactions: InteractionResult[]): string[] {
  return interactions.map((i) => {
    const prefix = i.severity === "contraindicated" ? "⛔ CONTRAINDICATED" : "⚠ Caution";
    return `${prefix}: ${i.description}`;
  });
}
