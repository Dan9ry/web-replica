import LoginPanel from "./LoginPanel";
import styles from "../WechatPayLoginReplicaPage.module.css";

export default function LoginHero() {
  return (
    <main className={styles.hero} data-replica="hero-shell">
      <div className={styles.heroCopy} aria-hidden="true">
        <h1>微信支付商家助手</h1>
        <p>即刻扫码移动办公，随时随地，助力经营</p>
        <div className={styles.smallQr}>
          <span />
        </div>
      </div>

      <div className={styles.phoneMock} aria-hidden="true">
        <div className={styles.phoneScreen}>
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      <LoginPanel />
    </main>
  );
}

