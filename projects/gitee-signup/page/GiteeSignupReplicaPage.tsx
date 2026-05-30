import { PromoPanel } from "./components/PromoPanel";
import { SignupForm } from "./components/SignupForm";
import styles from "./GiteeSignupReplicaPage.module.css";

export default function GiteeSignupReplicaPage() {
  const params = new URLSearchParams(window.location.search);
  const state = params.get("state");
  const initialState = state === "blur" || state === "submit" ? state : "initial";

  return (
    <main className={styles.page}>
      <div className={styles.backgroundCubeLeft} aria-hidden="true" />
      <div className={styles.backgroundCubeSmall} aria-hidden="true" />
      <div className={styles.backgroundCircle} aria-hidden="true" />
      <section className={styles.authCard}>
        <PromoPanel />
        <SignupForm initialState={initialState} />
      </section>
      <footer className={styles.footer}>
        <a href="#copyright">© Gitee.com</a>
        <a href="#about">关于我们</a>
        <a href="#terms">使用条款</a>
        <a href="#help">帮助文档</a>
        <a href="#service">在线自助服务</a>
        <a href="#mail">重发激活邮件</a>
      </footer>
      <button className={styles.helpBubble} type="button" aria-label="在线帮助">
        ◔
      </button>
    </main>
  );
}
