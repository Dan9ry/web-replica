import styles from "./App.module.css";

function HomePage() {
  return (
    <main className={styles.home}>
      <section className={styles.intro}>
        <p className={styles.eyebrow}>Web Replica Evaluator</p>
        <h1>网页复刻与一致性评估基础环境</h1>
        <p>
          这是一个干净的复刻工程壳子。新的复刻任务由项目级 skill 创建
          <code>projects/{"{target-id}"}</code>，生成页面源码、评估配置和素材基线后，
          再调用通用评估器完成一致性评估。
        </p>
      </section>

      <section className={styles.grid} aria-label="Workflow summary">
        <article className={styles.card}>
          <span>1. 使用 skill 创建复刻 project</span>
        </article>
        <article className={styles.card}>
          <span>2. 采集真实状态与截图基线</span>
        </article>
        <article className={styles.card}>
          <span>3. 实现页面并调用通用评估器</span>
        </article>
      </section>
    </main>
  );
}

export default function App() {
  return <HomePage />;
}
