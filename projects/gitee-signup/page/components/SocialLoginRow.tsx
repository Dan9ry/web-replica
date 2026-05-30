import styles from "../GiteeSignupReplicaPage.module.css";

const providers = ["↔", "⌂", "✹", "●", "…"];

export function SocialLoginRow() {
  return (
    <section className={styles.socialBlock} aria-label="其他方式登录">
      <div className={styles.divider}>
        <span />
        <p>其他方式登录</p>
        <span />
      </div>
      <div className={styles.socialIcons}>
        {providers.map((item, index) => (
          <button className={styles[`provider${index}`]} type="button" key={`${item}-${index}`}>
            {item}
          </button>
        ))}
      </div>
    </section>
  );
}
