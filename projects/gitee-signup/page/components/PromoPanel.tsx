import styles from "../GiteeSignupReplicaPage.module.css";

export function PromoPanel() {
  return (
    <section className={styles.promoPanel} aria-label="Gitee platform introduction">
      <div className={styles.logoRow}>
        <span className={styles.gMark}>G</span>
        <span className={styles.giteeText}>gitee</span>
      </div>
      <h2>企业级 DevOps 研发管理平台</h2>
      <div className={styles.quote}>
        <p className={styles.quoteAuthor}>霍泰稳　极客邦科技创始人</p>
        <p>
          类似 GitHub 这样的代码托管服务，是软件研发过程中不可缺少的一环，
          在国内目前还没有特别好的服务，Gitee 很好地填补了这个空白。
          一起努力，越来越好，为中国技术人群提供更多更贴心的服务。
        </p>
      </div>
      <a className={styles.enterpriseLink} href="#enterprise">
        <strong>Gitee 企业版</strong>
        <span>hot</span>
        <em>企业级 DevOps 研发管理平台 ›</em>
      </a>
    </section>
  );
}
