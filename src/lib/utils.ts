export function generateShortId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

export function defaultDateRange(): { from: string; to: string } {
  const to = new Date().toISOString().split('T')[0];
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);
  const from = fromDate.toISOString().split('T')[0];
  return { from, to };
}
