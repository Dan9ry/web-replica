const REPLICA_PATH = "/replica/google-search";
const MIN_PAGE = 1;
const MAX_PAGE = 2;

export function normalizeSearchQuery(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function hasSearchQuery(value: string): boolean {
  return normalizeSearchQuery(value).length > 0;
}

export function getSearchQuery(params: URLSearchParams): string {
  return normalizeSearchQuery(params.get("q") ?? "");
}

export function getResultPage(params: URLSearchParams): number {
  const parsed = Number(params.get("page") ?? MIN_PAGE);

  if (!Number.isFinite(parsed)) {
    return MIN_PAGE;
  }

  return Math.min(MAX_PAGE, Math.max(MIN_PAGE, Math.trunc(parsed)));
}

export function buildSearchUrl(query: string, page = MIN_PAGE): string {
  const cleanQuery = normalizeSearchQuery(query);
  const params = new URLSearchParams();
  params.set("q", cleanQuery);

  if (getResultPage(new URLSearchParams(`page=${page}`)) > MIN_PAGE) {
    params.set("page", String(MAX_PAGE));
  }

  return `${REPLICA_PATH}?${params.toString()}`;
}

export function isResultsState(params: URLSearchParams): boolean {
  return hasSearchQuery(params.get("q") ?? "");
}
