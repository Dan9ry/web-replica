import { LockKeyhole, UserRound } from "lucide-react";
import { CaptchaRow } from "./CaptchaRow";
import { LoginField } from "./LoginField";
import qrcodeCornerUrl from "../assets/qrcode-corner.png";
import { useLoginForm } from "../hooks/useLoginForm";
import styles from "../WeixinPayLoginReplicaPage.module.css";

interface LoginCardProps {
  initialValidation?: boolean;
}

export function LoginCard({ initialValidation = false }: LoginCardProps) {
  const form = useLoginForm(initialValidation);

  return (
    <section className={styles.loginCard} aria-label="账号密码登录">
      <img className={styles.cornerMark} src={qrcodeCornerUrl} alt="" aria-hidden="true" />
      <h1>账号密码登录</h1>
      <form onSubmit={form.submit}>
        <LoginField
          icon={<UserRound size={19} />}
          name="username"
          type="text"
          placeholder="登录账号"
          value={form.username}
          onChange={form.setUsername}
        />
        <LoginField
          icon={<LockKeyhole size={18} />}
          name="password"
          type="password"
          placeholder="登录密码"
          value={form.password}
          onChange={form.setPassword}
        />
        <CaptchaRow
          value={form.captcha}
          captchaText={form.captchaText}
          onChange={form.setCaptcha}
          onRefresh={form.refreshCaptcha}
        />
        <p className={styles.validationMessage} aria-live="polite">
          {form.message}
        </p>
        <button className={styles.loginSubmit} type="submit">
          登录
        </button>
      </form>
      <a className={styles.forgotLink} href="#forgot">
        忘记密码
      </a>
    </section>
  );
}
