import styles from "../WechatPayLoginReplicaPage.module.css";

interface CaptchaBoxProps {
  value: string;
  onRefresh: () => void;
}

export default function CaptchaBox({ value, onRefresh }: CaptchaBoxProps) {
  return (
    <div className={styles.captchaGroup}>
      <div className={styles.captchaImage} aria-label="验证码图片">
        {value.split("").map((letter, index) => (
          <span key={`${letter}-${index}`}>{letter}</span>
        ))}
      </div>
      <button className={styles.refreshCaptcha} type="button" onClick={onRefresh}>
        换一张
      </button>
    </div>
  );
}

