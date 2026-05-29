export interface SearchResultItem {
  id: string;
  source: string;
  url: string;
  title: string;
  snippet: string;
  favicon: string;
  translate?: string;
}

export interface SearchResultPage {
  page: number;
  elapsed: string;
  summary?: {
    heading: string;
    body: string;
    bullets: string[];
  };
  sidePanel?: {
    title: string;
    items: string[];
  };
  results: SearchResultItem[];
}

export const resultPages: SearchResultPage[] = [
  {
    page: 1,
    elapsed: "約 10,400,000 件 (0.31 秒)",
    summary: {
      heading: "AI による概要",
      body: "テンセント（Tencent）は、1998年に設立された中国・深センに本拠を置く世界最大級のテクノロジー・コングロマリットです。SNS、ゲーム、フィンテック、クラウドなど幅広い事業を展開しています。",
      bullets: [
        "WeChat や QQ など大規模なコミュニケーションサービスを運営しています。",
        "ゲーム、クラウド、広告、決済など複数の事業領域を持っています。",
      ],
    },
    sidePanel: {
      title: "10 件のサイト",
      items: ["テンセント - Wikipedia", "Tencent Japan", "Tencent Cloud"],
    },
    results: [
      {
        id: "tencent-japan",
        source: "Tencent Japan",
        url: "https://tencentjapan.com",
        title: "Tencent Japan",
        snippet:
          "活力を与え、成長を支える会社。専門的な研修とキャリア開発システムを通じて組織や個人の活力を刺激します。",
        favicon: "T",
      },
      {
        id: "overview",
        source: "Wikipedia",
        url: "https://ja.wikipedia.org/wiki/Tencent",
        title: "テンセント - Wikipedia",
        snippet:
          "テンセント・ホールディングスは、中国を代表するインターネット関連サービス企業です。メッセージング、ゲーム、金融技術などを展開しています。",
        favicon: "W",
      },
      {
        id: "cloud",
        source: "Tencent Cloud",
        url: "https://www.tencentcloud.com",
        title: "Tencent Cloud",
        snippet:
          "Tencent Cloud provides secure, reliable and high-performance cloud products for businesses expanding digital services worldwide.",
        favicon: "C",
        translate: "このページを訳す",
      },
      {
        id: "about",
        source: "Tencent",
        url: "https://www.tencent.com/en-us/about.html",
        title: "About Tencent",
        snippet:
          "Tencent is a world-leading internet and technology company that develops innovative products and services to improve quality of life.",
        favicon: "G",
      },
    ],
  },
  {
    page: 2,
    elapsed: "約 10,400,000 件 (0.36 秒)",
    results: [
      {
        id: "games",
        source: "Tencent Games",
        url: "https://www.tencentgames.com",
        title: "Tencent Games",
        snippet:
          "Tencent Games is committed to providing abundant and high-quality game experience for players, so that players can gain happiness in games.",
        favicon: "G",
        translate: "このページを訳す",
      },
      {
        id: "linkedin",
        source: "LinkedIn · Tencent",
        url: "https://www.linkedin.com/company/tencent",
        title: "Tencent",
        snippet:
          "Tencent is a world-leading internet and technology company that develops innovative products and services to improve the quality of life.",
        favicon: "in",
      },
      {
        id: "prtimes",
        source: "PR TIMES",
        url: "https://prtimes.jp/main/html/searchrlp/company_id",
        title: "Tencent Japan合同会社のプレスリリース",
        snippet:
          "PR TIMESで配信されたTencent Japan合同会社のプレスリリース一覧です。最新配信日や企業情報を確認できます。",
        favicon: "P",
      },
      {
        id: "smartweb",
        source: "smartweb.jp",
        url: "https://www.smartweb.jp/glossary/tencent",
        title: "Tencent(テンセント) - SmartWeb",
        snippet:
          "Tencentは、メッセージング、ゲーム、クラウド、フィンテック、AIを統合するデジタルエコシステムを構築した中国テクノロジー企業です。",
        favicon: "S",
      },
      {
        id: "markets",
        source: "内藤証券",
        url: "https://www.naito-sec.co.jp/chinap/stock",
        title: "テンセント・ホールディングス株価情報",
        snippet:
          "香港市場に上場するテンセント・ホールディングスの企業情報、ニュース、関連指標を掲載しています。",
        favicon: "N",
      },
    ],
  },
];

export function getResultData(page: number): SearchResultPage {
  return resultPages.find((item) => item.page === page) ?? resultPages[0];
}
