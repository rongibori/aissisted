import type { Rule } from "./types.js";
import { sleepRules } from "./rules/sleep.js";
import { inflammationRules } from "./rules/inflammation.js";
import { hormoneRules } from "./rules/hormones.js";
import { energyRules } from "./rules/energy.js";
import { cognitionRules } from "./rules/cognition.js";

const allRules: Rule[] = [
  ...sleepRules,
  ...inflammationRules,
  ...hormoneRules,
  ...energyRules,
  ...cognitionRules,
];

export function getAllRules(): Rule[] {
  return allRules;
}

export function getRuleById(id: string): Rule | undefined {
  return allRules.find((r) => r.id === id);
}

export function getRulesByDomain(domain: Rule["domain"]): Rule[] {
  return allRules.filter((r) => r.domain === domain);
}
