import { NavLink, Route, Routes } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { BaiduReplicaPage } from "./pages/BaiduReplica/BaiduReplicaPage";
import { WeChatPayLoginReplicaPage } from "./pages/WeChatPayLoginReplica/WeChatPayLoginReplicaPage";
import { ThirdReplicaPage } from "./pages/ThirdReplica/ThirdReplicaPage";
import styles from "./App.module.css";

const pages = [
  { path: "/replica/baidu", label: "Baidu Replica" },
  { path: "/replica/wechat-pay-login", label: "WeChat Pay Login" },
  { path: "/replica/third", label: "Third Page" },
];

function HomePage() {
  return (
    <main className={styles.home}>
      <section className={styles.intro}>
        <p className={styles.eyebrow}>Web Replica Evaluator</p>
        <h1>AI-assisted page replica and consistency evaluation</h1>
        <p>
          This project reproduces target web pages and scores them with an
          automated evaluation pipeline covering source capture validation,
          functionality, interaction, visual similarity, performance,
          accessibility, and responsive behavior.
        </p>
      </section>

      <section className={styles.grid} aria-label="Replica pages">
        {pages.map((page) => (
          <NavLink className={styles.card} to={page.path} key={page.path}>
            <span>{page.label}</span>
            <ExternalLink size={18} aria-hidden="true" />
          </NavLink>
        ))}
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/replica/baidu" element={<BaiduReplicaPage />} />
      <Route
        path="/replica/wechat-pay-login"
        element={<WeChatPayLoginReplicaPage />}
      />
      <Route path="/replica/third" element={<ThirdReplicaPage />} />
    </Routes>
  );
}

