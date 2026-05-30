import { useCallback, useEffect, useMemo, useState } from "react";

function readParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    query: params.get("q") ?? "",
    page: Math.max(1, Number(params.get("page") ?? "1") || 1),
  };
}

export function useLocalSearch() {
  const initial = useMemo(readParams, []);
  const [query, setQuery] = useState(initial.query);
  const [page, setPage] = useState(initial.page);

  useEffect(() => {
    const onPopState = () => {
      const next = readParams();
      setQuery(next.query);
      setPage(next.page);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const updateUrl = useCallback((nextQuery: string, nextPage = 1) => {
    const params = new URLSearchParams();
    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    }
    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }
    const url = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
    window.history.pushState(null, "", url);
    setQuery(nextQuery.trim());
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return {
    query,
    page,
    hasQuery: query.trim().length > 0,
    search: updateUrl,
    goToPage: (nextPage: number) => updateUrl(query || "tencent", nextPage),
  };
}
