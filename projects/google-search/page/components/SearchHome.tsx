import { Grid3X3 } from "lucide-react";
import styles from "../GoogleSearchReplicaPage.module.css";
import { GoogleFooter } from "./GoogleFooter";
import { GoogleLogo } from "./GoogleLogo";
import { SearchBox } from "./SearchBox";

interface SearchHomeProps {
  onSearch: (query: string) => void;
}

export function SearchHome({ onSearch }: SearchHomeProps) {
  return (
    <main className={styles.homePage}>
      <header className={styles.homeHeader}>
        <nav className={styles.leftLinks} aria-label="Primary">
          <a>Googleについて</a>
          <a>ストア</a>
        </nav>
        <nav className={styles.rightLinks} aria-label="Account">
          <a>Gmail</a>
          <a>画像</a>
          <button className={styles.appsButton} aria-label="Google apps" type="button">
            <Grid3X3 size={18} />
          </button>
          <button className={styles.loginButton} type="button">ログイン</button>
        </nav>
      </header>

      <section className={styles.homeSearchArea}>
        <GoogleLogo />
        <SearchBox initialValue="" onSearch={onSearch} />
        <p className={styles.language}>
          Google 検索は次の言語でもご利用いただけます: <a>English</a>
        </p>
      </section>

      <GoogleFooter />
    </main>
  );
}
