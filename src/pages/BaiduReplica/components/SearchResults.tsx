import { Search } from "lucide-react";
import type { HotSearchItem, SearchResult } from "../baiduReplica.types";
import styles from "../BaiduReplicaPage.module.css";

type SearchResultsProps = {
  keyword: string;
  currentPage: number;
  totalPages: number;
  results: SearchResult[];
  hotItems: HotSearchItem[];
  onPageChange: (page: number) => void;
  onHotRefresh: () => void;
};

const relatedSearches = [
  "怎么追回微信付款",
  "立即支付打开微信",
  "微信二维码支付",
  "扫二维码付款还能追回吗",
  "微信信用分600可以在哪借钱",
  "微信公众号平台",
];

export function SearchResults({
  keyword,
  currentPage,
  totalPages,
  results,
  hotItems,
  onPageChange,
  onHotRefresh,
}: SearchResultsProps) {
  return (
    <section className={styles.resultsGrid} aria-label="搜索结果">
      <div className={styles.resultColumn}>
        <p className={styles.resultSummary} data-testid="result-summary">
          {keyword}
        </p>
        <div className={styles.resultList} data-testid="result-list">
          {results.map((result, index) => (
            <article className={styles.resultItem} key={result.id}>
              {index === 0 && currentPage === 1 ? <span className={styles.officialBadge}>官方</span> : null}
              <a href="#" className={styles.resultTitle}>
                {result.title}
              </a>
              <p>{result.summary}</p>
              <div className={styles.resultMeta}>
                <span>{result.source}</span>
                <span>{result.date}</span>
                <span>{result.urlText}</span>
              </div>
            </article>
          ))}
        </div>
        <nav className={styles.pagination} aria-label="搜索结果分页">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            上一页
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              type="button"
              key={page}
              aria-label={`第 ${page} 页`}
              aria-current={currentPage === page ? "page" : undefined}
              className={currentPage === page ? styles.activePage : ""}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            下一页
          </button>
        </nav>
      </div>
      <aside className={styles.resultSidebar} data-testid="result-sidebar" aria-label="搜索侧栏">
        <section className={styles.askBox}>
          <span>问文心</span>
          <strong>{keyword}</strong>
        </section>
        <section className={styles.relatedBox} data-testid="related-searches" aria-label="相关搜索">
          <h2>相关搜索</h2>
          <div className={styles.relatedList}>
            {relatedSearches.map((item) => (
              <a href="#" key={item}>
                <Search size={15} />
                {item}
              </a>
            ))}
          </div>
        </section>
        <section className={styles.sideHotBoard} aria-label="百度热搜">
          <div className={styles.sideHotHeader}>
            <h2>百度热搜</h2>
            <button type="button" onClick={onHotRefresh}>
              换一换
            </button>
          </div>
          <div className={styles.sideHotTabs}>
            <span>热搜榜</span>
            <span>民生榜</span>
            <span>财经榜</span>
          </div>
          <ol className={styles.sideHotList}>
            {hotItems.slice(0, 10).map((item) => (
              <li key={`${item.rank}-${item.title}`}>
                <span>{item.rank === 0 ? "↑" : item.rank}</span>
                <a href="#">{item.title}</a>
                {item.tag ? <em>{item.tag}</em> : null}
              </li>
            ))}
          </ol>
        </section>
      </aside>
    </section>
  );
}
