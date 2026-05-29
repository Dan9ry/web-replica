import { Camera, Mic, Plus, Search, Sparkles } from "lucide-react";
import type { FormEvent } from "react";
import { GoogleLogo } from "./GoogleLogo";
import styles from "../GoogleSearchReplicaPage.module.css";

interface SearchHomeProps {
  draftQuery: string;
  onDraftQueryChange: (value: string) => void;
  onSubmit: (event?: FormEvent<HTMLFormElement>) => void;
}

export function SearchHome({ draftQuery, onDraftQueryChange, onSubmit }: SearchHomeProps) {
  return (
    <main className={styles.homeMain}>
      <GoogleLogo />
      <form className={styles.homeSearchForm} role="search" onSubmit={onSubmit}>
        <div className={styles.homeSearchBox}>
          <Plus size={22} strokeWidth={2.4} aria-hidden="true" />
          <input
            aria-label="Search"
            name="q"
            value={draftQuery}
            onChange={(event) => onDraftQueryChange(event.target.value)}
            autoComplete="off"
          />
          <div className={styles.searchTools} aria-hidden="true">
            <Mic size={20} />
            <Camera size={20} />
            <span className={styles.aiMode}>
              <Sparkles size={16} /> AI モード
            </span>
          </div>
        </div>
        <div className={styles.homeButtons}>
          <button type="submit">Google 検索</button>
          <button type="button" onClick={() => onDraftQueryChange("tencent")}>
            I'm Feeling Lucky
          </button>
        </div>
      </form>
    </main>
  );
}
