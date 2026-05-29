import { useMemo, useState } from "react";
import { FloatingTools } from "./components/FloatingTools";
import { HotSearchBoard } from "./components/HotSearchBoard";
import { SearchBox } from "./components/SearchBox";
import { SearchResults } from "./components/SearchResults";
import { TopNav } from "./components/TopNav";
import { WenxinPill } from "./components/WenxinPill";
import { hotSearchGroups } from "./data/hotSearch";
import { resultsByPage } from "./data/searchResults";
import type { SearchMode } from "./baiduReplica.types";
import styles from "./BaiduReplicaPage.module.css";

const totalPages = Object.keys(resultsByPage).length;
const resultTabs = ["文心", "网页", "图片", "资讯", "视频", "笔记", "地图", "贴吧", "文库", "更多", "搜索工具"];

export function BaiduReplicaPage() {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [mode, setMode] = useState<SearchMode>("idle");
  const [currentPage, setCurrentPage] = useState(1);
  const [hotGroup, setHotGroup] = useState(0);

  const currentResults = useMemo(
    () => resultsByPage[currentPage] ?? resultsByPage[1],
    [currentPage],
  );

  const handleSubmit = () => {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) {
      setMode("emptyError");
      return;
    }

    setSubmittedKeyword(trimmedKeyword);
    setCurrentPage(1);
    setMode("results");
  };

  const searchBox = (
    <SearchBox
      keyword={keyword}
      error={mode === "emptyError" ? "请输入搜索关键词" : ""}
      onKeywordChange={(value) => {
        setKeyword(value);
        if (mode === "emptyError") {
          setMode("idle");
        }
      }}
      onSubmit={handleSubmit}
    />
  );

  if (mode === "results") {
    return (
      <div className={styles.page}>
        <main className={styles.resultsPage}>
          <header className={styles.resultsHeader}>
            <a href="#" className={styles.compactLogo} aria-label="百度首页">
              <span>Bai</span>
              <span>du</span>
              <strong>百度</strong>
            </a>
            {searchBox}
            <nav className={styles.resultsUserNav} aria-label="百度用户导航">
              <a href="#">百度首页</a>
              <a href="#">通知</a>
              <a href="#">设置</a>
              <button type="button">Dan9ry</button>
            </nav>
          </header>
          <nav className={styles.resultTabs} aria-label="搜索分类">
            {resultTabs.map((tab, index) => (
              <a
                href="#"
                key={tab}
                className={index === 1 ? styles.activeTab : ""}
                aria-current={index === 1 ? "page" : undefined}
              >
                {tab}
              </a>
            ))}
          </nav>
          <SearchResults
            keyword={submittedKeyword}
            currentPage={currentPage}
            totalPages={totalPages}
            results={currentResults}
            hotItems={hotSearchGroups[hotGroup]}
            onPageChange={setCurrentPage}
            onHotRefresh={() => setHotGroup((value) => (value + 1) % hotSearchGroups.length)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <TopNav />
      <main className={styles.homeLayout}>
        <section className={styles.hero} aria-label="百度搜索区域">
          <div className={styles.logo} aria-label="百度">
            <span>Bai</span>
            <span className={styles.logoPaw}>du</span>
            <strong>百度</strong>
          </div>
          {searchBox}
          <WenxinPill />
        </section>

        <HotSearchBoard
          items={hotSearchGroups[hotGroup]}
          onRefresh={() => setHotGroup((value) => (value + 1) % hotSearchGroups.length)}
        />
      </main>
      <FloatingTools />
    </div>
  );
}
