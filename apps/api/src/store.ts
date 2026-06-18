import type { DocumentIndex, DocumentMeta } from "./types/index.js";

export const documentMetaStore = new Map<string, DocumentMeta>();
export const documentIndexStore = new Map<string, DocumentIndex>();
export const documentBufferStore = new Map<string, Buffer>();

export function getDocumentMeta(id: string): DocumentMeta | undefined {
  return documentMetaStore.get(id);
}

export function getDocumentIndex(id: string): DocumentIndex | undefined {
  return documentIndexStore.get(id);
}

export function setDocumentMeta(id: string, meta: DocumentMeta): void {
  documentMetaStore.set(id, meta);
}

export function setDocumentIndex(id: string, index: DocumentIndex): void {
  documentIndexStore.set(id, index);
}

export function setDocumentBuffer(id: string, buffer: Buffer): void {
  documentBufferStore.set(id, buffer);
}
