import { useEffect } from "react";
import LoginHero from "./components/LoginHero";
import styles from "./WechatPayLoginReplicaPage.module.css";

export default function WechatPayLoginReplicaPage() {
  useEffect(() => {
    document.title = "微信支付 - 账号密码登录";
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.topBar} aria-hidden="true">
        <div className={styles.topInner}>
          <span className={styles.activeTop}>境内商户</span>
          <span>合作伙伴</span>
          <span>International Business</span>
        </div>
      </header>

      <nav className={styles.nav} aria-hidden="true">
        <div className={styles.navInner}>
          <div className={styles.logoMark}>
            <span className={styles.logoBubble}>✓</span>
            <span>微信支付</span>
          </div>
          <div className={styles.navLinks}>
            <span className={styles.activeNav}>首页</span>
            <span>接入指引</span>
            <span>产品中心</span>
            <span>解决方案</span>
            <span>文档中心</span>
            <span className={styles.navCta}>接入微信支付</span>
          </div>
        </div>
      </nav>

      <LoginHero />

      <div className={styles.noticeBar} aria-hidden="true">
        <span>[04.02] 微信支付网络变更通知</span>
        <span>[10.18] 商家转账到零钱功能升级通知</span>
        <span>更多公告 &gt;</span>
      </div>
    </div>
  );
}
