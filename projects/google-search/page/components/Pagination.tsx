import styles from "../GoogleSearchReplicaPage.module.css";

interface PaginationProps {
  page: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, onPageChange }: PaginationProps) {
  const pages = [1, 2, 3, 4, 5];

  return (
    <nav id="botstuff" className={styles.pagination} data-pagination aria-label="Pagination">
      {page > 1 && (
        <button type="button" onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
      )}
      {pages.map((item) => (
        <button
          key={item}
          type="button"
          className={item === page ? styles.currentPage : undefined}
          data-current-page={item === page ? String(item) : undefined}
          onClick={() => onPageChange(item)}
        >
          {item}
        </button>
      ))}
      <button type="button" data-page-next onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}
