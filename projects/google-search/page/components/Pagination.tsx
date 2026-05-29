import styles from "../GoogleSearchReplicaPage.module.css";

interface PaginationProps {
  page: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, onPageChange }: PaginationProps) {
  return (
    <nav className={styles.pagination} aria-label="Result pages">
      <div className={styles.paginationLogo} aria-hidden="true">
        <span className={styles.blue}>G</span>
        <span className={styles.red}>o</span>
        <span className={styles.yellow}>o</span>
        <span className={styles.yellow}>o</span>
        <span className={styles.yellow}>o</span>
        <span className={styles.blue}>g</span>
        <span className={styles.green}>l</span>
        <span className={styles.red}>e</span>
      </div>
      <div className={styles.pageLinks}>
        <button disabled={page === 1} type="button" onClick={() => onPageChange(page - 1)}>
          前へ
        </button>
        {[1, 2].map((item) => (
          <button
            className={page === item ? styles.currentPage : undefined}
            type="button"
            key={item}
            onClick={() => onPageChange(item)}
            aria-current={page === item ? "page" : undefined}
          >
            {item}
          </button>
        ))}
        <button disabled={page === 2} type="button" onClick={() => onPageChange(page + 1)}>
          次へ
        </button>
      </div>
    </nav>
  );
}
