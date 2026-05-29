import styles from "../GoogleSearchReplicaPage.module.css";

const links = ["ヘルプ", "フィードバック", "プライバシー", "規約"];

export function ResultsFooter() {
  return (
    <footer className={styles.resultsFooter}>
      <div className={styles.resultsFooterInner}>
        <p>
          <strong>日本</strong>
          <span>現在地: 東京都 - IP アドレスから推定</span>
        </p>
        <nav aria-label="Search footer links">
          {links.map((item) => (
            <a href={`#${item}`} key={item}>
              {item}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
