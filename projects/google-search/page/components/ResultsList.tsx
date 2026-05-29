import { Sparkles } from "lucide-react";
import { ResultItem } from "./ResultItem";
import type { SearchResultPage } from "../data/results";
import styles from "../GoogleSearchReplicaPage.module.css";

interface ResultsListProps {
  data: SearchResultPage;
  query: string;
}

export function ResultsList({ data, query }: ResultsListProps) {
  return (
    <section className={styles.resultsColumn} id="search" aria-label="Search results">
      <p className={styles.resultStats} id="result-stats">
        {data.elapsed}
      </p>

      {data.summary ? (
        <section className={styles.aiSummary} aria-label="AI overview">
          <h2>
            <Sparkles size={22} /> {data.summary.heading}
          </h2>
          <p>
            <strong>{query}</strong> は、{data.summary.body}
          </p>
          <h3>主要な事業内容</h3>
          <ul>
            {data.summary.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button type="button">もっと見る</button>
        </section>
      ) : null}

      <div className={styles.resultStack}>
        {data.results.map((item) => (
          <ResultItem item={item} key={item.id} />
        ))}
      </div>
    </section>
  );
}
