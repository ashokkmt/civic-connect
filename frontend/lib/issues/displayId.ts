export function formatIssueDisplayId(id: string): string {
  const normalized = id.trim();
  if (!normalized) {
    return "CC-UNKNOWN";
  }

  const compact = normalized.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (compact.length <= 8) {
    return `CC-${compact}`;
  }

  return `CC-${compact.slice(0, 4)}-${compact.slice(-4)}`;
}
