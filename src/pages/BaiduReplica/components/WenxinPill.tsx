import { ChevronRight, Sparkles } from "lucide-react";
import styles from "../BaiduReplicaPage.module.css";

export function WenxinPill() {
  return (
    <button type="button" className={styles.wenxinPill}>
      <span className={styles.wenxinIcon}>
        <Sparkles size={14} />
      </span>
      <strong>文心</strong>
      <span>复杂问题就找文心助手，深入思考回答更优</span>
      <ChevronRight size={16} />
    </button>
  );
}

