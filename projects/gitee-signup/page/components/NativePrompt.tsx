import styles from "../GiteeSignupReplicaPage.module.css";

interface NativePromptProps {
  show: boolean;
}

export function NativePrompt({ show }: NativePromptProps) {
  if (!show) {
    return null;
  }

  return (
    <div className={styles.nativePrompt} role="status">
      <span>!</span>
      <strong>请填写此字段。</strong>
    </div>
  );
}
