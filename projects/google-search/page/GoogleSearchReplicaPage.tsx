import styles from "./GoogleSearchReplicaPage.module.css";
import { GoogleFooter } from "./components/GoogleFooter";
import { Pagination } from "./components/Pagination";
import { ResultsHeader } from "./components/ResultsHeader";
import { ResultsList } from "./components/ResultsList";
import { SearchHome } from "./components/SearchHome";
import { useLocalSearch } from "./hooks/useLocalSearch";

export default function GoogleSearchReplicaPage() {
  const { query, page, hasQuery, search, goToPage } = useLocalSearch();

  if (!hasQuery) {
    return (
      <div className={styles.root}>
        <SearchHome onSearch={search} />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <ResultsHeader query={query} onSearch={(nextQuery) => search(nextQuery, 1)} />
      <main className={styles.resultsPage}>
        <ResultsList query={query} page={page} />
        <Pagination page={page} onPageChange={goToPage} />
      </main>
      <GoogleFooter compact />
    </div>
  );
}
