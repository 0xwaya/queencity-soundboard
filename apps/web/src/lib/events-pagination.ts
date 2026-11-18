export function normalizeEventsPage(pageParam: string | undefined, pageCount: number): number {
  const requestedPage = Number.parseInt(pageParam ?? "1", 10);
  return Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), Math.max(pageCount, 1)) : 1;
}
