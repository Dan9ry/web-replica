export interface SearchResult {
  site: string;
  url: string;
  title: string;
  snippet: string;
  accent?: string;
}

export const pageOneResults: SearchResult[] = [
  {
    site: "Wikipedia",
    url: "https://ja.wikipedia.org › wiki › テンセント",
    title: "テンセント",
    snippet:
      "テンセント・ホールディングスは、広東省深圳市に本拠を置く中国の多国籍テクノロジー・コングロマリット。",
    accent: "W",
  },
  {
    site: "Tencent Japan",
    url: "https://www.tencentjapan.com",
    title: "Tencent Japan",
    snippet:
      "私たちは、1998年に中国深センで設立し、2004年に香港証券取引所に上場しました。",
    accent: "T",
  },
  {
    site: "Tencent Cloud",
    url: "https://www.tencentcloud.com",
    title: "Tencent Cloud",
    snippet:
      "Secure, reliable and high-performance cloud products for games, media, finance and global digital businesses.",
    accent: "C",
  },
  {
    site: "Tencent Holdings",
    url: "https://www.tencent.com › en-us",
    title: "Tencent 腾讯",
    snippet:
      "Tencent is a world-leading internet and technology company that develops innovative products and services.",
    accent: "T",
  },
  {
    site: "Reuters",
    url: "https://www.reuters.com › companies › 0700.HK",
    title: "Tencent Holdings Ltd company profile",
    snippet:
      "Latest company information, business segments, market updates and financial news for Tencent Holdings.",
    accent: "R",
  },
];

export const pageTwoResults: SearchResult[] = [
  {
    site: "Tencent Games",
    url: "https://www.tencentgames.com",
    title: "Tencent Games",
    snippet:
      "At Tencent Games we seek to elevate the core experience and spirit of games with original thinking.",
    accent: "G",
  },
  {
    site: "note · Jini",
    url: "https://note.com › ゲームゼミ",
    title: "テンセントとは何か--世界No.1ゲーム企業、その未知なる ...",
    snippet:
      "テンセント・ホールディングスは1998年、深圳市で創業された企業。世界中にデータセンターを含む拠点を展開。",
    accent: "n",
  },
  {
    site: "PR TIMES",
    url: "https://prtimes.jp › main › html › searchrlp",
    title: "Tencent Japan合同会社のプレスリリース",
    snippet:
      "PR TIMESで配信されたTencent Japan合同会社のプレスリリース一覧です。",
    accent: "P",
  },
  {
    site: "smartweb.jp",
    url: "https://www.smartweb.jp › glossary › tencent",
    title: "Tencent(テンセント) - SmartWeb",
    snippet:
      "Tencentは、メッセージング、ゲーム、クラウド、フィンテック、AIを統合するデジタルエコシステムを構築した企業です。",
    accent: "S",
  },
  {
    site: "Nikkei",
    url: "https://www.nikkei.com › topic › tencent",
    title: "テンセント 関連ニュース",
    snippet:
      "中国テック大手テンセントの投資、ゲーム、クラウド、AI関連の最新ニュース。",
    accent: "N",
  },
];

export function resultsForPage(page: number): SearchResult[] {
  return page === 2 ? pageTwoResults : pageOneResults;
}
