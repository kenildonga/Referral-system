export function formatPersonName(parts: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}): string {
  return [parts.firstName, parts.middleName, parts.lastName]
    .filter((p) => p?.trim())
    .join(' ')
    .trim();
}

export function normalizeMiddleName(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
