import type { SignupFieldName } from "../utils/signupValidation";
import styles from "../GiteeSignupReplicaPage.module.css";

interface NamespaceFieldProps {
  value: string;
  error?: string;
  showError: boolean;
  onBlur: (field: SignupFieldName) => void;
  onChange: (field: SignupFieldName, value: string) => void;
}

export function NamespaceField({ value, error, showError, onBlur, onChange }: NamespaceFieldProps) {
  const hasError = Boolean(error && showError);

  return (
    <div className={styles.fieldBlock}>
      <label className={`${styles.namespaceShell} ${hasError ? styles.inputError : ""}`}>
        <span className={styles.prefix}>https://gitee.com/</span>
        <input
          name="namespace"
          type="text"
          placeholder="个人空间地址"
          value={value}
          onBlur={() => onBlur("namespace")}
          onChange={(event) => onChange("namespace", event.target.value)}
        />
        <span className={styles.aiBadge}>AI</span>
        <span className={styles.helpBadge}>?</span>
        {hasError ? <span className={styles.errorMark}>×</span> : null}
      </label>
      {hasError ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  );
}
