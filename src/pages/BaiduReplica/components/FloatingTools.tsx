import { Grid3X3, ShieldCheck } from "lucide-react";
import styles from "../BaiduReplicaPage.module.css";

export function FloatingTools() {
  return (
    <aside className={styles.floatingTools} aria-label="辅助工具">
      <button type="button" aria-label="安全中心">
        <ShieldCheck size={20} />
      </button>
      <button type="button" aria-label="二维码入口">
        <Grid3X3 size={20} />
      </button>
    </aside>
  );
}

