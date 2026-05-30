import styles from "../GoogleSearchReplicaPage.module.css";
import { resultsForPage } from "../data/searchResults";

interface ResultsListProps {
  query: string;
  page: number;
}

export function ResultsList({ query, page }: ResultsListProps) {
  const results = resultsForPage(page);

  return (
    <section id="search" className={styles.resultsShell}>
      <div id="rso" className={styles.resultsColumn} data-results-list>
        {page === 1 && (
          <article className={styles.aiOverview}>
            <div className={styles.aiLabel}>✦ AI による概要</div>
            <p>
              テンセント（Tencent Holdings）は、
              <mark>1998年に中国・深圳で設立された世界有数のテクノロジー企業</mark>
              です。中国のIT・テック大手「BAT」の一角を占め、メッセージアプリやゲーム、
              クラウドサービスなど多岐にわたる事業を展開しています。
            </p>
            <ul>
              <li><strong>コミュニケーション&amp;ソーシャルメディア</strong> WeChat や QQ などを運営しています。</li>
              <li><strong>ゲーム・エンターテインメント</strong> 世界規模のゲーム事業を持ちます。</li>
            </ul>
            <button type="button">もっと見る</button>
          </article>
        )}

        <p className={styles.resultStats}>Search results for {query || "tencent"} · About 7,680,000 results (0.39 seconds)</p>
        {results.map((result) => (
          <article className={`${styles.resultItem} g`} data-result-item key={result.title}>
            <div className={styles.resultMeta}>
              <span className={styles.favicon}>{result.accent ?? "G"}</span>
              <div>
                <div className={styles.siteName}>{result.site}</div>
                <cite>{result.url}</cite>
              </div>
              <button type="button" aria-label="More result options">⋮</button>
            </div>
            <a className={styles.resultTitle} href="#" onClick={(event) => event.preventDefault()}>
              {result.title}
            </a>
            <p>{result.snippet}</p>
          </article>
        ))}
      </div>
      {page === 1 && (
        <aside className={styles.knowledgePanel}>
          <h2>テンセント</h2>
          <p className={styles.panelType}>企業</p>
          <p>
            テンセント・ホールディングスは、広東省深圳市に本拠を置く中国の多国籍テクノロジー企業です。
          </p>
        </aside>
      )}
    </section>
  );
}
