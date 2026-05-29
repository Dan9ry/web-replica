import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  buildSearchUrl,
  getResultPage,
  getSearchQuery,
  hasSearchQuery,
  isResultsState,
  normalizeSearchQuery,
} from "../utils/searchState";

export function useSearchExperience() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const query = getSearchQuery(params);
  const page = getResultPage(params);
  const [draftQuery, setDraftQuery] = useState(query);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  function submitSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const cleanQuery = normalizeSearchQuery(draftQuery);

    if (!hasSearchQuery(cleanQuery)) {
      return;
    }

    navigate(buildSearchUrl(cleanQuery, 1));
  }

  function goToPage(nextPage: number) {
    if (!hasSearchQuery(query)) {
      return;
    }

    navigate(buildSearchUrl(query, nextPage));
    window.scrollTo({ top: 0 });
  }

  return {
    draftQuery,
    page,
    query,
    isResults: isResultsState(params),
    setDraftQuery,
    submitSearch,
    goToPage,
  };
}
