export function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function isLoanOverdue(
  dueAt: string,
  returnedAt: string | null,
  now = new Date(),
): boolean {
  if (returnedAt !== null) return false;
  return new Date(dueAt).getTime() < now.getTime();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
