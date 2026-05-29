import { getResultData } from "./data/results";
import { HomeFooter } from "./components/HomeFooter";
import { HomeHeader } from "./components/HomeHeader";
import { Pagination } from "./components/Pagination";
import { ResultsFooter } from "./components/ResultsFooter";
import { ResultsHeader } from "./components/ResultsHeader";
import { ResultsList } from "./components/ResultsList";
import { SearchHome } from "./components/SearchHome";
import { useSearchExperience } from "./hooks/useSearchExperience";
import styles from "./GoogleSearchReplicaPage.module.css";

export default function GoogleSearchReplicaPage() {
  const {
    draftQuery,
    goToPage,
    isResults,
    page,
    query,
    setDraftQuery,
    submitSearch,
  } = useSearchExperience();

  if (!isResults) {
    return (
      <div className={styles.homePage}>
        <HomeHeader />
        <SearchHome
          draftQuery={draftQuery}
          onDraftQueryChange={setDraftQuery}
          onSubmit={submitSearch}
        />
        <HomeFooter />
      </div>
    );
  }

  const data = getResultData(page);

  return (
    <div className={styles.resultsPage}>
      <ResultsHeader
        draftQuery={draftQuery}
        onDraftQueryChange={setDraftQuery}
        onSubmit={submitSearch}
      />
      <main className={styles.resultsMain}>
        <ResultsList data={data} query={query} />
        {data.sidePanel ? (
          <aside className={styles.sidePanel} aria-label="Related sites">
            <div className={styles.sidePanelHeader}>
              <span>W</span>
              <strong>{data.sidePanel.title}</strong>
              <button type="button" aria-label="More options">
                ⋮
              </button>
            </div>
            {data.sidePanel.items.map((item) => (
              <a href={`#${item}`} key={item}>
                {item}
              </a>
            ))}
          </aside>
        ) : null}
        <Pagination page={page} onPageChange={goToPage} />
      </main>
      <ResultsFooter />
    </div>
  );
}
