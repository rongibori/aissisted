/**
 * Minimal Apple Health export XML parser.
 *
 * Apple Health exports a single export.xml file with records like:
 *   <Record type="HKQuantityTypeIdentifier..." value="45.2" unit="ng/mL"
 *           startDate="2024-01-15 00:00:00 -0800" .../>
 *
 * We scan for <Record> elements and extract the attributes we care about.
 * This is intentionally lightweight to avoid heavy XML parsing dependencies.
 */

export interface HealthRecord {
  type: string;
  value: number;
  unit: string;
  startDate: string;
  sourceName?: string;
}

// Attribute extraction regex
const ATTR_RE = /(\w+)="([^"]*)"/g;

function parseRecord(line: string): HealthRecord | null {
  const attrs: Record<string, string> = {};
  let match: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;
  while ((match = ATTR_RE.exec(line)) !== null) {
    attrs[match[1]] = match[2];
  }

  if (!attrs.type || !attrs.value || !attrs.startDate) return null;

  const value = parseFloat(attrs.value);
  if (isNaN(value)) return null;

  return {
    type: attrs.type,
    value,
    unit: attrs.unit ?? "",
    startDate: attrs.startDate,
    sourceName: attrs.sourceName,
  };
}

/**
 * Parse Apple Health export XML (as string) and return all numeric records.
 * Accepts the full export.xml content or a partial chunk.
 */
export function parseAppleHealthXml(xml: string): HealthRecord[] {
  const records: HealthRecord[] = [];

  // Find all <Record ...> or <Record .../> elements
  const recordRe = /<Record\s([^>]+)\/?>/g;
  let m: RegExpExecArray | null;

  while ((m = recordRe.exec(xml)) !== null) {
    const rec = parseRecord(m[1]);
    if (rec) records.push(rec);
  }

  return records;
}
