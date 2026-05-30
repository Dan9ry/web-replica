import styles from "../GoogleSearchReplicaPage.module.css";

export function GoogleLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? styles.logoCompact : styles.logo} aria-label="Google">
      <span className={styles.blue}>G</span>
      <span className={styles.red}>o</span>
      <span className={styles.yellow}>o</span>
      <span className={styles.blue}>g</span>
      <span className={styles.green}>l</span>
      <span className={styles.red}>e</span>
    </div>
  );
}
