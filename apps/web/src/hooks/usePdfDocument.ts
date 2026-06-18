import { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface PdfDocumentHandle {
  numPages: number;
  getPage: (page: number) => Promise<pdfjs.PDFPageProxy>;
}

export function usePdfDocument(file: File | null) {
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadIdRef = useRef(0);

  useEffect(() => {
    if (!file) {
      setPdf(null);
      setError(null);
      return;
    }

    const loadId = ++loadIdRef.current;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const currentFile = file;
      if (!currentFile) return;
      try {
        const buffer = await currentFile.arrayBuffer();
        const task = pdfjs.getDocument({ data: buffer });
        const doc = await task.promise;
        if (!cancelled && loadId === loadIdRef.current) {
          setPdf(doc);
        } else {
          void doc.destroy();
        }
      } catch (err) {
        if (!cancelled && loadId === loadIdRef.current) {
          setError(err instanceof Error ? err.message : "Failed to load PDF");
          setPdf(null);
        }
      } finally {
        if (!cancelled && loadId === loadIdRef.current) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    return () => {
      if (pdf) void pdf.destroy();
    };
  }, [pdf]);

  const getPage = useCallback(
    async (pageNum: number) => {
      if (!pdf) throw new Error("No PDF loaded");
      return pdf.getPage(pageNum);
    },
    [pdf],
  );

  return {
    pdf,
    numPages: pdf?.numPages ?? 0,
    loading,
    error,
    getPage,
  };
}
