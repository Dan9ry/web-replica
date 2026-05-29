import styles from "../WeixinPayLoginReplicaPage.module.css";

interface CaptchaRowProps {
  value: string;
  captchaText: string;
  onChange: (value: string) => void;
  onRefresh: () => void;
}

export function CaptchaRow({ value, captchaText, onChange, onRefresh }: CaptchaRowProps) {
  return (
    <div className={styles.captchaRow}>
      <input
        name="checkword_in"
        placeholder="验证码"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
      />
      <button className={styles.captchaImage} type="button" onClick={onRefresh} aria-label="验证码图片">
        {captchaText.split("").map((letter, index) => (
          <span
            className={index % 2 === 0 ? styles.captchaBlue : styles.captchaGold}
            key={`${letter}-${index}`}
          >
            {letter}
          </span>
        ))}
      </button>
      <button className={styles.refreshCaptcha} type="button" onClick={onRefresh}>
        换一张
      </button>
    </div>
  );
}
