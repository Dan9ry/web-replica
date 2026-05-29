import styles from "../GoogleSearchReplicaPage.module.css";

const leftLinks = ["広告", "ビジネス", "検索の仕組み"];
const rightLinks = ["プライバシー", "規約", "設定"];

export function HomeFooter() {
  return (
    <footer className={styles.homeFooter}>
      <div className={styles.region}>日本</div>
      <div className={styles.footerLinks}>
        <nav aria-label="Business links">
          {leftLinks.map((item) => (
            <a href={`#${item}`} key={item}>
              {item}
            </a>
          ))}
        </nav>
        <nav aria-label="Policy links">
          {rightLinks.map((item) => (
            <a href={`#${item}`} key={item}>
              {item}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
