import { Image, Mic, Paperclip } from "lucide-react";
import type { KeyboardEvent } from "react";
import styles from "../BaiduReplicaPage.module.css";

type SearchBoxProps = {
  keyword: string;
  error: string;
  onKeywordChange: (value: string) => void;
  onSubmit: () => void;
};

export function SearchBox({ keyword, error, onKeywordChange, onSubmit }: SearchBoxProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <form
      className={styles.searchForm}
      role="search"
      aria-label="百度搜索表单"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className={`${styles.searchShell} ${error ? styles.searchShellError : ""}`}>
        <textarea
          aria-label="百度搜索"
          className={styles.searchInput}
          rows={1}
          value={keyword}
          placeholder="演员张凌赫在人民日报发文"
          onChange={(event) => onKeywordChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className={styles.searchTools} aria-hidden="true">
          <Mic size={21} />
          <Paperclip size={21} />
          <Image size={21} />
        </div>
        <button type="submit" className={styles.searchButton}>
          百度一下
        </button>
      </div>
      {error ? <p className={styles.validationMessage}>{error}</p> : null}
    </form>
  );
}

