import type { ReactNode } from "react";
import styles from "../WeixinPayLoginReplicaPage.module.css";

interface LoginFieldProps {
  icon: ReactNode;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export function LoginField({ icon, name, type, placeholder, value, onChange }: LoginFieldProps) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldIcon}>{icon}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
      />
    </label>
  );
}
