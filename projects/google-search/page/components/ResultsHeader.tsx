import { ChevronDown, Grid3X3, Settings } from "lucide-react";
import styles from "../GoogleSearchReplicaPage.module.css";
import { GoogleLogo } from "./GoogleLogo";
import { SearchBox } from "./SearchBox";

interface ResultsHeaderProps {
  query: string;
  onSearch: (query: string) => void;
}

const tabs = ["AI モード", "すべて", "画像", "ニュース", "動画", "ショッピング", "ショート動画"];

export function ResultsHeader({ query, onSearch }: ResultsHeaderProps) {
  return (
    <header id="searchform" className={styles.resultsHeader}>
      <div className={styles.headerRow}>
        <GoogleLogo compact />
        <SearchBox compact initialValue={query} onSearch={onSearch} />
        <div className={styles.headerTools}>
          <button className={styles.appsButton} aria-label="Settings" type="button">
            <Settings size={21} />
          </button>
          <button className={styles.appsButton} aria-label="Google apps" type="button">
            <Grid3X3 size={18} />
          </button>
          <button className={styles.loginButton} type="button">ログイン</button>
        </div>
      </div>
      <nav className={styles.tabs} aria-label="Search type">
        {tabs.map((tab) => (
          <a key={tab} className={tab === "すべて" ? styles.activeTab : undefined}>{tab}</a>
        ))}
        <a className={styles.moreTab}>もっと見る <ChevronDown size={14} /></a>
        <a className={styles.moreTab}>ツール <ChevronDown size={14} /></a>
      </nav>
    </header>
  );
}
