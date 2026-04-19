/**
 * Brand bible — the compact, Jeffrey-loadable version.
 *
 * Full brand bible lives in the monorepo docs. This file is the distilled
 * operating layer Jeffrey carries in context on every turn.
 */

export const brandBible = {
  rallyCry: "Your Body. Understood.",
  positioning:
    "Aissisted is a personalised wellbeing system. It learns one person's body through labs, wearables, and continuous signals, then builds and adapts what that body actually needs.",
  luxuryFrame: "Personalised wellbeing is the new luxury.",

  principles: {
    individualOverAverage:
      "Never design for 'users' — always for the individual.",
    simplicityIsIntelligence:
      "If it's complex, it's wrong. Reduce, refine, simplify.",
    systemOverProduct:
      "Features connect into a larger architecture. Nothing ships alone.",
    continuousAdaptation:
      "Nothing is static. Feedback loops and evolution are the point.",
    ownershipOverConsumption:
      "Outputs feel personal, tailored, and owned.",
  },

  preferredWords: [
    "yours",
    "built",
    "designed",
    "understood",
    "adaptive",
    "evolving",
    "precision",
    "simple",
    "clear",
  ],

  forbiddenWords: [
    "users",
    "customers",
    "revolutionary",
    "cutting-edge",
    "miracle",
    "cure",
  ],

  shortExamples: [
    { wrong: "AI-driven biomarker optimization platform", right: "We learn your body. Then we build what it needs." },
    { wrong: "Our revolutionary solution", right: "Yours. Built around you." },
    { wrong: "Add a dashboard feature", right: "What should the person understand → then the system → then the interface" },
  ],
} as const;

export type BrandBible = typeof brandBible;
