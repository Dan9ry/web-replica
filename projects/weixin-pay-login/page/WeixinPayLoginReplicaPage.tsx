import { LoginCard } from "./components/LoginCard";
import logoUrl from "./assets/logo.svg";
import styles from "./WeixinPayLoginReplicaPage.module.css";

export default function WeixinPayLoginReplicaPage() {
  const params = new URLSearchParams(window.location.search);
  const initialValidation = params.get("state") === "validation";

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.topInner}>
          <a className={styles.activeTopLink} href="#mainland">
            境内商户
          </a>
          <span />
          <a href="#partner">合作伙伴</a>
          <span />
          <a href="#international">International Business</a>
        </div>
      </header>

      <nav className={styles.mainNav} aria-label="微信支付商户平台导航">
        <a className={styles.brand} href="#home" aria-label="微信支付">
          <img src={logoUrl} alt="微信支付" />
        </a>
        <div className={styles.navLinks}>
          <a className={styles.activeNav} href="#home">
            首页
          </a>
          <a href="#guide">接入指引</a>
          <a href="#products">产品中心</a>
          <a href="#solutions">解决方案</a>
          <a href="#docs">文档中心</a>
          <a className={styles.joinButton} href="#join">
            接入微信支付
          </a>
        </div>
      </nav>

      <main className={styles.hero}>
        <section className={styles.heroCopy}>
          <h2>微信支付商家助手</h2>
          <p>即刻扫码移动办公，随时随地，助力经营</p>
          <div className={styles.smallQr} aria-hidden="true">
            <div />
            <span>▣</span>
          </div>
        </section>
        <div className={styles.phoneMock} aria-hidden="true">
          <div className={styles.phoneScreen}>
            <span>商家助手</span>
            <p>[1] 业务助手</p>
            <p>[2] 产品能力</p>
            <p>[3] 经营数据</p>
          </div>
        </div>
        <LoginCard initialValidation={initialValidation} />
        <div className={styles.noticeBar}>
          <span className={styles.speaker}>⌕</span>
          <span>[04.02] 微信支付网络变更通知</span>
          <span>[10.18] 商家转账到零钱功能升级通知</span>
          <a href="#more">更多公告 ›</a>
        </div>
      </main>

      <section className={styles.belowFold} aria-label="平台开放能力">
        <h2>平台开放能力</h2>
        <span />
      </section>
    </div>
  );
}
