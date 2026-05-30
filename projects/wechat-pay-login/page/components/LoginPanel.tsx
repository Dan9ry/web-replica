import { Lock, UserRound } from "lucide-react";
import CaptchaBox from "./CaptchaBox";
import { useLoginForm } from "../hooks/useLoginForm";
import styles from "../WechatPayLoginReplicaPage.module.css";

export default function LoginPanel() {
  const {
    captchaText,
    error,
    form,
    isSubmitting,
    refreshCaptcha,
    submit,
    updateField,
  } = useLoginForm();

  return (
    <section className={styles.loginPanel} data-replica="login-panel" aria-label="账号密码登录">
      <div className={styles.cornerToggle} aria-hidden="true">
        <span />
      </div>
      <h2>账号密码登录</h2>

      <label className={styles.field}>
        <UserRound aria-hidden="true" size={22} strokeWidth={1.6} />
        <input
          data-replica="username-input"
          value={form.username}
          onChange={(event) => updateField("username", event.target.value)}
          placeholder="登录账号"
          autoComplete="username"
        />
      </label>

      <label className={styles.field}>
        <Lock aria-hidden="true" size={21} strokeWidth={1.6} />
        <input
          data-replica="password-input"
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          placeholder="登录密码"
          type="password"
          autoComplete="current-password"
        />
      </label>

      <div className={styles.captchaRow}>
        <input
          className={styles.captchaInput}
          data-replica="captcha-input"
          value={form.captcha}
          onChange={(event) => updateField("captcha", event.target.value)}
          placeholder="验证码"
          autoComplete="off"
        />
        <CaptchaBox value={captchaText} onRefresh={refreshCaptcha} />
      </div>

      <button
        className={styles.loginButton}
        data-replica="login-button"
        type="button"
        onClick={submit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "登录中..." : "登录"}
      </button>

      {error ? (
        <p className={styles.error} data-replica="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <a className={styles.forgot} href="#forgot" onClick={(event) => event.preventDefault()}>
        忘记密码
      </a>
    </section>
  );
}

