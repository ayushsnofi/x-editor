import { create } from "zustand";
import type { SearchHit, SearchMode } from "@/api/client";

export type ZoomMode = "custom" | "fitWidth" | "fitPage";

export interface OpenDocument {
  id: string;
  localId: string;
  file: File;
  fileName: string;
  fileSize: number;
  documentId?: string;
  status: "idle" | "indexing" | "ready" | "error";
  statusError?: string;
  pageCount: number;
  tokenCount: number;
  openedAt: number;
}

export interface SearchHighlight {
  page: number;
  text: string;
}

interface DocumentState {
  documents: OpenDocument[];
  activeLocalId: string | null;
  currentPage: number;
  zoom: number;
  zoomMode: ZoomMode;
  rotation: number;
  searchQuery: string;
  searchMode: SearchMode;
  searchResults: SearchHit[];
  searchLoading: boolean;
  searchError: string | null;
  activeHighlight: SearchHighlight | null;

  addDocument: (file: File) => string;
  setActiveDocument: (localId: string) => void;
  updateDocument: (localId: string, patch: Partial<OpenDocument>) => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setZoomMode: (mode: ZoomMode) => void;
  setRotation: (rotation: number) => void;
  rotateClockwise: () => void;
  setSearchQuery: (query: string) => void;
  setSearchMode: (mode: SearchMode) => void;
  setSearchResults: (results: SearchHit[]) => void;
  setSearchLoading: (loading: boolean) => void;
  setSearchError: (error: string | null) => void;
  setActiveHighlight: (highlight: SearchHighlight | null) => void;
  getActiveDocument: () => OpenDocument | undefined;
}

let localIdCounter = 0;

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  activeLocalId: null,
  currentPage: 1,
  zoom: 1,
  zoomMode: "fitWidth",
  rotation: 0,
  searchQuery: "",
  searchMode: "smart",
  searchResults: [],
  searchLoading: false,
  searchError: null,
  activeHighlight: null,

  addDocument: (file) => {
    const localId = `local-${++localIdCounter}`;
    const doc: OpenDocument = {
      id: localId,
      localId,
      file,
      fileName: file.name,
      fileSize: file.size,
      status: "idle",
      pageCount: 0,
      tokenCount: 0,
      openedAt: Date.now(),
    };
    set((s) => ({
      documents: [doc, ...s.documents.filter((d) => d.localId !== localId)],
      activeLocalId: localId,
      currentPage: 1,
      rotation: 0,
      searchQuery: "",
      searchResults: [],
      searchError: null,
      activeHighlight: null,
    }));
    return localId;
  },

  setActiveDocument: (localId) => {
    set({
      activeLocalId: localId,
      currentPage: 1,
      rotation: 0,
      searchResults: [],
      searchError: null,
      activeHighlight: null,
    });
  },

  updateDocument: (localId, patch) => {
    set((s) => {
      const index = s.documents.findIndex((d) => d.localId === localId);
      if (index === -1) return s;

      const current = s.documents[index];
      const hasChange = (Object.keys(patch) as (keyof OpenDocument)[]).some(
        (key) => patch[key] !== current[key],
      );
      if (!hasChange) return s;

      const documents = [...s.documents];
      documents[index] = { ...current, ...patch };
      return { documents };
    });
  },

  setCurrentPage: (page) => set({ currentPage: page }),
  setZoom: (zoom) => set({ zoom, zoomMode: "custom" }),
  setZoomMode: (zoomMode) => set({ zoomMode }),
  setRotation: (rotation) => set({ rotation }),
  rotateClockwise: () =>
    set((s) => ({ rotation: (s.rotation + 90) % 360 })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchMode: (searchMode) => set({ searchMode }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setSearchLoading: (searchLoading) => set({ searchLoading }),
  setSearchError: (searchError) => set({ searchError }),
  setActiveHighlight: (activeHighlight) => set({ activeHighlight }),

  getActiveDocument: () => {
    const { documents, activeLocalId } = get();
    return documents.find((d) => d.localId === activeLocalId);
  },
}));
