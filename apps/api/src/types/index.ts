export type DocumentStatus = "indexing" | "ready" | "error";

export interface Sentence {
  id: number;
  page: number;
  sentenceIndex: number;
  text: string;
  startChar: number;
}

export interface TokenOccurrence {
  page: number;
  sentenceId: number;
  wordIndex: number;
  original: string;
  normalized: string;
  metaphone: string;
}

export interface DocumentIndex {
  documentId: string;
  fileName: string;
  sentences: Sentence[];
  tokens: TokenOccurrence[];
}

export interface DocumentMeta {
  documentId: string;
  fileName: string;
  status: DocumentStatus;
  pageCount: number;
  tokenCount: number;
  error?: string;
}

export type SearchMode = "smart" | "exact" | "fuzzy";

export interface SearchHit {
  page: number;
  score: number;
  matchedToken: string;
  context: {
    prior: string[];
    current: string;
    matchRange: { start: number; end: number };
  };
}

export interface SearchResponse {
  query: string;
  mode: SearchMode;
  hits: SearchHit[];
}
