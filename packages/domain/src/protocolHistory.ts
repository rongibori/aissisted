import { SupplementStack } from "./supplement";

export interface ProtocolHistoryEntry {
  userId: string;
  timestamp: string;
  stack: SupplementStack;
  feedback?: {
    energy?: number;
    sleep?: number;
    stress?: number;
  };
}

const memory: ProtocolHistoryEntry[] = [];

export function saveProtocol(entry: ProtocolHistoryEntry) {
  memory.push(entry);
}

export function getUserHistory(userId: string): ProtocolHistoryEntry[] {
  return memory.filter((entry) => entry.userId === userId);
}
