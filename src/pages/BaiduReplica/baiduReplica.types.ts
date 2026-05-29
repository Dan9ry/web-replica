export type SearchMode = "idle" | "emptyError" | "results";

export type HotSearchItem = {
  rank: number;
  title: string;
  tag?: "热" | "新";
};

export type SearchResult = {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  urlText: string;
};

