const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export type DocumentStatus = "idle" | "indexing" | "ready" | "error";
export type SearchMode = "smart" | "exact" | "fuzzy";

export interface DocumentMeta {
  documentId: string;
  fileName: string;
  status: DocumentStatus;
  pageCount: number;
  tokenCount: number;
  error?: string;
}

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

export async function uploadDocument(file: File): Promise<{
  documentId: string;
  fileName: string;
  status: string;
}> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_URL}/api/documents`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Upload failed");
  }

  return res.json();
}

export async function getDocumentStatus(
  documentId: string,
): Promise<DocumentMeta> {
  const res = await fetch(`${API_URL}/api/documents/${documentId}/status`);
  if (!res.ok) throw new Error("Failed to get status");
  return res.json();
}

export async function searchDocument(
  documentId: string,
  query: string,
  mode: SearchMode = "smart",
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query, mode });
  const res = await fetch(
    `${API_URL}/api/documents/${documentId}/search?${params}`,
  );

  if (res.status === 202) {
    throw new Error("Document is still indexing");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Search failed");
  }

  return res.json();
}
