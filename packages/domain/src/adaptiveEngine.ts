import { ProtocolOutput } from "./protocol";
import { getUserHistory } from "./protocolHistory";

export function adaptProtocol(userId: string, current: ProtocolOutput): ProtocolOutput {
  const history = getUserHistory(userId);
  const latest = history[history.length - 1];

  if (!latest?.feedback) {
    return current;
  }

  const notes = [...(current.notes || [])];

  if (latest.feedback.sleep !== undefined && latest.feedback.sleep < 5) {
    notes.push("Previous sleep feedback was poor. Consider increasing recovery and sleep-support emphasis.");
  }

  if (latest.feedback.energy !== undefined && latest.feedback.energy < 5) {
    notes.push("Previous energy feedback was poor. Consider reviewing stimulant load, recovery quality, and daytime support.");
  }

  return {
    ...current,
    notes,
  };
}
