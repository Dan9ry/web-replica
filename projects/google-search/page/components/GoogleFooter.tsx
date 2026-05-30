import styles from "../GoogleSearchReplicaPage.module.css";

interface GoogleFooterProps {
  compact?: boolean;
}

export function GoogleFooter({ compact = false }: GoogleFooterProps) {
  return (
    <footer id="footcnt" className={compact ? styles.resultsFooter : styles.footer}>
      {!compact && <div className={styles.country}>日本</div>}
      <div className={styles.footerLinks}>
        <div>
          <a>広告</a>
          <a>ビジネス</a>
          <a>検索の仕組み</a>
        </div>
        <div>
          <a>プライバシー</a>
          <a>規約</a>
          <a>設定</a>
        </div>
      </div>
    </footer>
  );
}
