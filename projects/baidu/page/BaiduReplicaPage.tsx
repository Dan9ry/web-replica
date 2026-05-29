import { FormEvent, useMemo, useState } from "react";
import styles from "./BaiduReplicaPage.module.css";

const DEFAULT_QUERY = "网页复刻";

interface SearchResultItem {
  title: string;
  source: string;
  date: string;
  summary: string;
  image?: boolean;
}

const hotSearches = [
  "夜空中最亮的星",
  "日本全境调兵 12万居民转移",
  "诺基亚发布首款微聊手机 售价199元",
  "为什么是“六张网”",
  "铁路新规6月1日起实施",
  "北京致谢全体市民：戴头盔已蔚然成风",
  "奚梦瑶何猷君将在法国办婚礼",
  "你的麦子熟了 整个中国替你收",
  "体检出这8种“假病” 只是身体老了",
];

const pageOneResults: SearchResultItem[] = [
  {
    title: "从灵感到网站,只要5分钟,扣子空间 网页复刻设计功能上线 - 文章 - 开发...",
    source: "开发者社区",
    date: "2025年7月28日",
    summary:
      "同时上传参考图片,还能帮你一键完成网页复刻,截图/Figma 设计稿/网站/手画稿皆可上传,实现 1:1 复刻。",
  },
  {
    title: "完全没有想玩的欲望了,复刻之前的网页版本 英雄传奇 - 百度贴吧",
    source: "百度贴吧",
    date: "8天前",
    summary:
      "玩家讨论复刻网页版本的体验,页面结构、按钮和内容区域都成为关注点。",
  },
  {
    title: "“全球100B级效果最强!”智谱新一代视觉推理模型GLM-4.5V上线并开源",
    source: "华尔街见闻",
    date: "2025年8月11日",
    summary:
      "模型能结合视频理解与代码生成能力,输出相应的网页代码,成功复刻视频中展示的界面。",
    image: true,
  },
  {
    title: "日活跌破1000后,Meta才想起来用移动端APP救活元宇宙",
    source: "爱企查",
    date: "2025年6月5日",
    summary:
      "复刻页面需要关注原网页的布局节奏、信息密度和交互反馈,而不是只看截图顶部。",
  },
  {
    title: "AI编程神器Cursor,教你用5分钟复刻一个网页工具",
    source: "科技专栏",
    date: "2025年4月15日",
    summary:
      "打开朋友发来的目标网页监视器,分析数据并整理接口,再生成本地可运行页面。",
  },
];

const pageTwoResults: SearchResultItem[] = [
  {
    title: "网页复刻项目如何做一致性评估?截图、DOM 与交互流程缺一不可",
    source: "前端工程实践",
    date: "2025年9月2日",
    summary:
      "先采集真实状态,再实现复刻页面,每轮都用视觉和交互指标回归验证。",
  },
  {
    title: "从百度首页到搜索结果页:复刻任务中的状态拆分方法",
    source: "网页分析笔记",
    date: "2025年7月9日",
    summary:
      "首页、结果页、翻页页是三个独立状态,需要分别截图和保存 DOM 摘要。",
  },
  {
    title: "如何避免网页复刻只像首页?中部、底部和交互态都要采集",
    source: "设计还原指南",
    date: "2025年5月18日",
    summary:
      "真实页面经常在滚动区域、分页和错误态里暴露关键布局差异。",
  },
  {
    title: "搜索框交互复刻:点击、回车、分页与结果文案",
    source: "交互测试周刊",
    date: "2025年3月21日",
    summary:
      "复刻页面不需要访问真实搜索接口,但需要模拟稳定的本地搜索状态。",
  },
  {
    title: "AI 辅助网页复刻的流程化记录:Prompt、截图和评估报告",
    source: "AI 工具实践",
    date: "2025年1月11日",
    summary:
      "将关键 Prompt 和人工决策放入 project 日志,更容易解释每次迭代原因。",
  },
];

const relatedSearches = [
  "今天复刻",
  "ai18复刻计划",
  "游戏复刻啥意思",
  "复制数据大全最新版",
  "199937复刻",
  "光遇复刻最新消息",
];

function getInitialQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("wd") || "";
}

function getInitialPage() {
  const params = new URLSearchParams(window.location.search);
  return params.get("page") === "2" ? 2 : 1;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? styles.logoCompact : styles.logo} aria-label="Baidu 百度">
      <span>Bai</span>
      <span>du</span>
      <strong>百度</strong>
    </div>
  );
}

export function BaiduReplicaPage() {
  const [query, setQuery] = useState(getInitialQuery);
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const isResults = query.trim().length > 0;
  const results = currentPage === 2 ? pageTwoResults : pageOneResults;
  const highlighted = query.trim() || DEFAULT_QUERY;

  const resultCountText = useMemo(
    () => `百度为您找到相关结果约${currentPage === 2 ? "87,200,000" : "100,000,000"}个`,
    [currentPage],
  );

  function syncUrl(nextQuery: string, nextPage: number) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) {
      params.set("wd", nextQuery.trim());
    }
    if (nextPage > 1) {
      params.set("page", String(nextPage));
    }
    window.history.pushState(null, "", `/replica/baidu${params.toString() ? `?${params}` : ""}`);
  }

  function runSearch(event?: FormEvent) {
    event?.preventDefault();
    const nextQuery = query.trim() || DEFAULT_QUERY;
    setQuery(nextQuery);
    setCurrentPage(1);
    syncUrl(nextQuery, 1);
  }

  function goToPage(page: number) {
    const nextQuery = query.trim() || DEFAULT_QUERY;
    setQuery(nextQuery);
    setCurrentPage(page);
    syncUrl(nextQuery, page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!isResults) {
    return (
      <main className={styles.homePage}>
        <TopLinks />
        <section className={styles.homeCenter}>
          <Logo />
          <SearchForm query={query} setQuery={setQuery} onSubmit={runSearch} home />
          <div className={styles.assistantPill}>文心　复杂问题就找文心助手，深入思考回答更优</div>
          <HotSearchBoard />
        </section>
        <FloatingTools />
      </main>
    );
  }

  return (
    <main className={styles.resultsPage}>
      <header className={styles.resultsHeader}>
        <Logo compact />
        <SearchForm query={query} setQuery={setQuery} onSubmit={runSearch} />
        <nav className={styles.headerLinks} aria-label="结果页工具">
          <a href="/">百度首页</a>
          <a href="/">设置</a>
          <button type="button">登录</button>
        </nav>
      </header>

      <div className={styles.resultsShell}>
        <section className={styles.resultsMain}>
          <nav className={styles.resultTabs} aria-label="搜索分类">
            {["文心", "网页", "图片", "资讯", "视频", "笔记", "地图", "贴吧", "文库", "更多", "搜索工具"].map(
              (tab, index) => (
                <button className={index === 0 ? styles.activeTab : ""} key={tab} type="button">
                  {tab}
                </button>
              ),
            )}
          </nav>
          {currentPage === 1 ? <AiAnswerBlock /> : <p className={styles.resultCount}>{resultCountText}</p>}
          <div id="content_left" className={styles.resultsList}>
            {results.map((result) => (
              <article className={styles.resultItem} key={result.title}>
                <a className={styles.resultTitle} href="/">
                  {highlightText(result.title, highlighted)}
                </a>
                <p className={styles.resultSummary}>
                  <span>{result.date}</span> {highlightText(result.summary, highlighted)}
                </p>
                {result.image ? <ResultImageStrip /> : null}
                <div className={styles.resultSource}>{result.source}</div>
              </article>
            ))}
          </div>
          <PaginationBar currentPage={currentPage} onPageChange={goToPage} />
        </section>
        <aside className={styles.sidePanel} aria-label="相关搜索和百度热搜">
          <RelatedSearches />
          <HotSearchBoard compact />
        </aside>
      </div>
    </main>
  );
}

function AiAnswerBlock() {
  return (
    <section className={styles.aiAnswer} aria-label="百度AI回答">
      <div className={styles.aiHead}>
        <strong>百度AI</strong>
        <span>停</span>
        <span>听</span>
      </div>
      <p>
        网页复刻是指利用自动化工具或AI技术，快速复制目标网站的视觉样式、布局结构甚至交互功能的过程。
        根据您的需求，是想要快速生成原型、学习前端代码，还是进行竞品分析，目前主要有以下几种主流方式和工具：
      </p>
      <h2>1. AI 智能一键复刻（适合快速建站/原型验证）</h2>
      <p>
        这是目前效率较高的方式，无需编写代码，通过AI解析页面结构并生成可编辑的代码或网站。
      </p>
      <ul>
        <li>
          <strong>Skywork AI (WebClone)：</strong>
          支持提供网址、上传文件或输入文字描述，AI会在数分钟内生成高还原度的网页原型。
        </li>
        <li>
          <strong>Same.dev：</strong>
          输入网页URL、截图或Figma设计稿，即可生成HTML/CSS/JS代码，适合快速原型开发。
        </li>
      </ul>
    </section>
  );
}

function SearchForm({
  query,
  setQuery,
  onSubmit,
  home = false,
}: {
  query: string;
  setQuery: (value: string) => void;
  onSubmit: (event?: FormEvent) => void;
  home?: boolean;
}) {
  return (
    <form className={home ? styles.homeSearch : styles.resultSearch} id="form" onSubmit={onSubmit}>
      <input
        id="kw"
        aria-label="搜索关键词"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="网页复刻"
      />
      <div className={styles.searchTools} aria-hidden="true">
        <span>⌕</span>
        <span>⛓</span>
        <span>▧</span>
      </div>
      <button id="su" type="submit">
        百度一下
      </button>
    </form>
  );
}

function TopLinks() {
  return (
    <header className={styles.topLinks}>
      <nav aria-label="百度首页导航">
        {["新闻", "hao123", "地图", "贴吧", "视频", "图片", "网盘", "文库", "文心", "搭子DuMate", "更多"].map(
          (item) => (
            <a href="/" key={item}>
              {item}
            </a>
          ),
        )}
      </nav>
      <div>
        <a href="/">设置</a>
        <button type="button">登录</button>
      </div>
    </header>
  );
}

function HotSearchBoard({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? styles.hotCompact : styles.hotBoard} aria-label="百度热搜">
      <div className={styles.hotHeader}>
        <strong>百度热搜</strong>
        <button type="button">换一换</button>
      </div>
      <ol>
        {hotSearches.map((item, index) => (
          <li key={item}>
            <span>{index === 0 ? "↑" : index}</span>
            <a href="/">{item}</a>
            {[1, 2, 4, 6].includes(index) ? <em>热</em> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

function RelatedSearches() {
  return (
    <section className={styles.related}>
      <h2>相关搜索</h2>
      <ul>
        {relatedSearches.map((item) => (
          <li key={item}>
            <span>○</span>
            <a href="/">{item}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PaginationBar({
  currentPage,
  onPageChange,
}: {
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav id="page" className={styles.pagination} aria-label="搜索结果分页">
      <button className={currentPage === 1 ? styles.activePage : ""} onClick={() => onPageChange(1)} type="button">
        1
      </button>
      <button className={currentPage === 2 ? styles.activePage : ""} onClick={() => onPageChange(2)} type="button">
        2
      </button>
      <button onClick={() => onPageChange(currentPage === 1 ? 2 : 1)} type="button">
        下一页 &gt;
      </button>
    </nav>
  );
}

function ResultImageStrip() {
  return (
    <div className={styles.imageStrip} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function FloatingTools() {
  return (
    <div className={styles.floatTools} aria-hidden="true">
      <span>☼</span>
      <span>▦</span>
    </div>
  );
}

function highlightText(text: string, keyword: string) {
  if (!keyword) {
    return text;
  }

  const parts = text.split(keyword);
  if (parts.length === 1) {
    return text;
  }

  return parts.map((part, index) => (
    <span key={`${part}-${index}`}>
      {part}
      {index < parts.length - 1 ? <mark>{keyword}</mark> : null}
    </span>
  ));
}
