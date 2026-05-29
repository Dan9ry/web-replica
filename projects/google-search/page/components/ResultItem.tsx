import type { SearchResultItem } from "../data/results";
import styles from "../GoogleSearchReplicaPage.module.css";

interface ResultItemProps {
  item: SearchResultItem;
}

export function ResultItem({ item }: ResultItemProps) {
  return (
    <article className={styles.resultItem}>
      <div className={styles.resultMeta}>
        <span className={styles.favicon}>{item.favicon}</span>
        <div>
          <div className={styles.source}>{item.source}</div>
          <div className={styles.url}>
            {item.url}
            {item.translate ? <span> · {item.translate}</span> : null}
          </div>
        </div>
        <button className={styles.moreButton} type="button" aria-label={`${item.title} options`}>
          ⋮
        </button>
      </div>
      <a className={styles.resultTitle} href={`#${item.id}`}>
        {item.title}
      </a>
      <p>{item.snippet}</p>
    </article>
  );
}
