import styles from "../BaiduReplicaPage.module.css";

const navItems = ["新闻", "hao123", "地图", "贴吧", "视频", "图片", "网盘", "文库", "文心", "搭子DuMate", "更多"];

export function TopNav() {
  return (
    <nav className={styles.topNav} aria-label="百度顶部导航">
      <div className={styles.navLinks}>
        {navItems.map((item) => (
          <a href="#" key={item}>
            {item}
          </a>
        ))}
      </div>
      <div className={styles.navActions}>
        <a href="#">设置</a>
        <button type="button" className={styles.loginButton}>
          登录
        </button>
      </div>
    </nav>
  );
}

