import { useEffect, useRef } from "react";
import {
  getDocumentStatus,
  searchDocument,
  uploadDocument,
} from "@/api/client";
import { useDocumentStore, type OpenDocument } from "@/stores/documentStore";

const pollIntervals = new Map<string, ReturnType<typeof setInterval>>();

async function indexDocument(
  doc: OpenDocument,
  updateDocument: (localId: string, patch: Partial<OpenDocument>) => void,
) {
  try {
    updateDocument(doc.localId, { status: "indexing" });
    const { documentId } = await uploadDocument(doc.file);
    updateDocument(doc.localId, { documentId, status: "indexing" });

    if (pollIntervals.has(doc.localId)) {
      clearInterval(pollIntervals.get(doc.localId)!);
    }

    const interval = setInterval(async () => {
      try {
        const status = await getDocumentStatus(documentId);
        updateDocument(doc.localId, {
          status: status.status,
          pageCount: status.pageCount || doc.pageCount,
          tokenCount: status.tokenCount,
          statusError: status.error,
        });

        if (status.status === "ready" || status.status === "error") {
          const handle = pollIntervals.get(doc.localId);
          if (handle) clearInterval(handle);
          pollIntervals.delete(doc.localId);
        }
      } catch {
        /* retry on next poll */
      }
    }, 1500);

    pollIntervals.set(doc.localId, interval);
  } catch (err) {
    updateDocument(doc.localId, {
      status: "error",
      statusError: err instanceof Error ? err.message : "Upload failed",
    });
  }
}

export function useDocumentIndexing() {
  const documents = useDocumentStore((s) => s.documents);
  const updateDocument = useDocumentStore((s) => s.updateDocument);
  const startedRef = useRef(new Set<string>());

  useEffect(() => {
    for (const doc of documents) {
      if (doc.documentId || doc.status === "indexing" || doc.status === "ready") {
        startedRef.current.add(doc.localId);
        continue;
      }
      if (doc.status === "error") {
        startedRef.current.add(doc.localId);
        continue;
      }
      if (startedRef.current.has(doc.localId)) continue;

      startedRef.current.add(doc.localId);
      void indexDocument(doc, updateDocument);
    }
  }, [documents, updateDocument]);
}

export function useDebouncedSearch() {
  const activeDoc = useDocumentStore((s) => s.getActiveDocument());
  const searchQuery = useDocumentStore((s) => s.searchQuery);
  const searchMode = useDocumentStore((s) => s.searchMode);
  const setSearchResults = useDocumentStore((s) => s.setSearchResults);
  const setSearchLoading = useDocumentStore((s) => s.setSearchLoading);
  const setSearchError = useDocumentStore((s) => s.setSearchError);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!activeDoc?.documentId || !searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    if (activeDoc.status !== "ready") {
      setSearchResults([]);
      setSearchError(
        activeDoc.status === "indexing"
          ? "Document is still indexing…"
          : activeDoc.statusError ?? "Document not ready",
      );
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    timerRef.current = setTimeout(async () => {
      try {
        const result = await searchDocument(
          activeDoc.documentId!,
          searchQuery,
          searchMode,
        );
        setSearchResults(result.hits);
        setSearchError(null);
      } catch (err) {
        setSearchResults([]);
        setSearchError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    activeDoc?.documentId,
    activeDoc?.status,
    activeDoc?.statusError,
    searchQuery,
    searchMode,
    setSearchResults,
    setSearchLoading,
    setSearchError,
  ]);
}
