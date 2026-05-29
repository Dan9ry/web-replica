import { Grid3X3 } from "lucide-react";
import styles from "../GoogleSearchReplicaPage.module.css";

export function HomeHeader() {
  return (
    <header className={styles.homeHeader}>
      <nav className={styles.homeHeaderLinks} aria-label="Google home left links">
        <a href="#about">Googleについて</a>
        <a href="#store">ストア</a>
      </nav>
      <nav className={styles.homeHeaderLinks} aria-label="Google home right links">
        <a href="#gmail">Gmail</a>
        <a href="#images">画像</a>
        <button className={styles.iconButton} type="button" aria-label="Google apps">
          <Grid3X3 size={20} strokeWidth={2} />
        </button>
        <button className={styles.loginButton} type="button">
          ログイン
        </button>
      </nav>
    </header>
  );
}
