export interface RawLabRecord {
  name: string;
  value: number;
  unit: string;
}

export function normalizeLab(record: RawLabRecord) {
  const codeMap: Record<string, string> = {
    "LDL Cholesterol": "LDL",
    "Triglycerides": "TRIGLYCERIDES",
    "Vitamin D": "VITAMIN_D",
  };

  return {
    code: codeMap[record.name] || record.name.toUpperCase(),
    value: record.value,
    unit: record.unit,
  };
}
