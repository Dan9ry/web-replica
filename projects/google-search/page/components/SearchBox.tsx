import { Camera, Mic, Plus, Search, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import styles from "../GoogleSearchReplicaPage.module.css";

interface SearchBoxProps {
  initialValue: string;
  compact?: boolean;
  onSearch: (query: string) => void;
}

export function SearchBox({ initialValue, compact = false, onSearch }: SearchBoxProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = value.trim() || "tencent";
    onSearch(query);
  }

  if (compact) {
    return (
      <form
        className={styles.searchFormCompact}
        role="search"
        onSubmit={submit}
      >
        <input
          name="q"
          data-search-input
          className={styles.searchInput}
          aria-label="Search"
          value={value}
          autoComplete="off"
          onChange={(event) => setValue(event.target.value)}
        />
        {value && (
          <button className={styles.iconButton} type="button" aria-label="Clear" onClick={() => setValue("")}>
            <X size={22} />
          </button>
        )}
        <span className={styles.divider} aria-hidden="true" />
        <button className={styles.iconButton} type="button" aria-label="Voice search">
          <Mic size={21} />
        </button>
        <button className={styles.iconButton} type="button" aria-label="Search by image">
          <Camera size={21} />
        </button>
        <button className={styles.iconButton} type="submit" data-search-submit aria-label="Search">
          <span className={styles.srOnly}>Google Search</span>
          <Search size={22} />
        </button>
      </form>
    );
  }

  return (
    <form
      className={styles.searchBoxLayout}
      role="search"
      onSubmit={submit}
    >
      <div className={styles.searchForm}>
        <button className={styles.iconButton} type="button" aria-label="Add">
          <Plus size={23} strokeWidth={3} />
        </button>
        <input
          name="q"
          data-search-input
          className={styles.searchInput}
          aria-label="Search"
          value={value}
          autoComplete="off"
          onChange={(event) => setValue(event.target.value)}
        />
        <span className={styles.divider} aria-hidden="true" />
        <button className={styles.iconButton} type="button" aria-label="Voice search">
          <Mic size={21} />
        </button>
        <button className={styles.iconButton} type="button" aria-label="Search by image">
          <Camera size={21} />
        </button>
        <button className={styles.aiModeButton} type="button">
          <Sparkles size={17} />
          AI モード
        </button>
      </div>
      <div className={styles.homeActions}>
        <button type="submit" name="btnK" data-search-submit>Google 検索</button>
        <button type="button">I'm Feeling Lucky</button>
      </div>
    </form>
  );
}
