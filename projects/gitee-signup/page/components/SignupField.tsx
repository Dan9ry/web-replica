import type { SignupFieldName } from "../utils/signupValidation";
import styles from "../GiteeSignupReplicaPage.module.css";

interface SignupFieldProps {
  field: SignupFieldName;
  placeholder: string;
  type?: string;
  value: string;
  error?: string;
  showError: boolean;
  onBlur: (field: SignupFieldName) => void;
  onChange: (field: SignupFieldName, value: string) => void;
  withEye?: boolean;
}

export function SignupField({
  field,
  placeholder,
  type = "text",
  value,
  error,
  showError,
  onBlur,
  onChange,
  withEye = false,
}: SignupFieldProps) {
  const hasError = Boolean(error && showError);

  return (
    <div className={styles.fieldBlock}>
      <label className={`${styles.inputShell} ${hasError ? styles.inputError : ""}`}>
        <input
          name={field}
          type={type}
          placeholder={placeholder}
          value={value}
          onBlur={() => onBlur(field)}
          onChange={(event) => onChange(field, event.target.value)}
        />
        {withEye ? <span className={styles.eyeIcon}>◉</span> : null}
        {hasError ? <span className={styles.errorMark}>×</span> : null}
      </label>
      {hasError ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  );
}
