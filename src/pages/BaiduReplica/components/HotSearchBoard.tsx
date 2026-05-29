import { RefreshCw } from "lucide-react";
import type { HotSearchItem } from "../baiduReplica.types";
import styles from "../BaiduReplicaPage.module.css";

type HotSearchBoardProps = {
  items: HotSearchItem[];
  onRefresh: () => void;
};

export function HotSearchBoard({ items, onRefresh }: HotSearchBoardProps) {
  return (
    <section className={styles.hotBoard} aria-label="百度热搜">
      <div className={styles.hotHeader}>
        <h2>
          百度<span>热搜</span>
        </h2>
        <button type="button" className={styles.refreshButton} onClick={onRefresh}>
          <RefreshCw size={15} />
          换一换
        </button>
      </div>
      <ol className={styles.hotList} data-testid="hot-search-list">
        {items.map((item) => (
          <li key={`${item.rank}-${item.title}`}>
            <span className={styles.hotRank}>{item.rank === 0 ? "↑" : item.rank}</span>
            <a href="#">{item.title}</a>
            {item.tag ? <em>{item.tag}</em> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

