import { Camera, Grid3X3, Mic, Search, Settings, X } from "lucide-react";
import type { FormEvent } from "react";
import { GoogleLogo } from "./GoogleLogo";
import styles from "../GoogleSearchReplicaPage.module.css";

const tabs = ["AI モード", "すべて", "画像", "ニュース", "動画", "ショッピング", "ショート動画", "もっと見る", "ツール"];

interface ResultsHeaderProps {
  draftQuery: string;
  onDraftQueryChange: (value: string) => void;
  onSubmit: (event?: FormEvent<HTMLFormElement>) => void;
}

export function ResultsHeader({ draftQuery, onDraftQueryChange, onSubmit }: ResultsHeaderProps) {
  return (
    <header className={styles.resultsHeader}>
      <div className={styles.resultsSearchRow}>
        <a className={styles.logoLink} href="/replica/google-search" aria-label="Google home">
          <GoogleLogo compact />
        </a>
        <form className={styles.resultsSearchForm} role="search" onSubmit={onSubmit}>
          <input
            aria-label="Search"
            name="q"
            value={draftQuery}
            onChange={(event) => onDraftQueryChange(event.target.value)}
            autoComplete="off"
          />
          <button
            className={styles.iconButton}
            type="button"
            aria-label="Clear search"
            onClick={() => onDraftQueryChange("")}
          >
            <X size={21} />
          </button>
          <span className={styles.divider} aria-hidden="true" />
          <button className={styles.iconButton} type="button" aria-label="Voice search">
            <Mic size={21} />
          </button>
          <button className={styles.iconButton} type="button" aria-label="Image search">
            <Camera size={21} />
          </button>
          <button className={styles.iconButton} type="submit" aria-label="Search">
            <Search size={22} />
          </button>
        </form>
        <div className={styles.resultsActions}>
          <button className={styles.iconButton} type="button" aria-label="Settings">
            <Settings size={21} />
          </button>
          <button className={styles.iconButton} type="button" aria-label="Google apps">
            <Grid3X3 size={20} />
          </button>
          <button className={styles.loginButton} type="button">
            ログイン
          </button>
        </div>
      </div>
      <nav className={styles.tabs} aria-label="Search result types">
        {tabs.map((tab) => (
          <a className={tab === "すべて" ? styles.activeTab : undefined} href={`#${tab}`} key={tab}>
            {tab}
          </a>
        ))}
      </nav>
    </header>
  );
}
