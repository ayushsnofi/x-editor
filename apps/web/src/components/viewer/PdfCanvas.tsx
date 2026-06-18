import { useEffect, useRef } from "react";
import * as pdfjs from "pdfjs-dist";
import type { ZoomMode } from "@/stores/documentStore";
import type { SearchHighlight } from "@/stores/documentStore";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import { TextLayer } from "@/components/viewer/TextLayer";

interface PdfCanvasProps {
  file: File;
  page: number;
  zoom: number;
  zoomMode: ZoomMode;
  rotation: number;
  highlight: SearchHighlight | null;
  onPageCount: (count: number) => void;
}

export function PdfCanvas({
  file,
  page,
  zoom,
  zoomMode,
  rotation,
  highlight,
  onPageCount,
}: PdfCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const { pdf, numPages, loading, error, getPage } = usePdfDocument(file);
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);

  useEffect(() => {
    if (numPages > 0) onPageCount(numPages);
  }, [numPages, onPageCount]);

  useEffect(() => {
    if (!pdf || !canvasRef.current || !containerRef.current) return;

    let cancelled = false;

    async function render() {
      try {
        const pdfPage = await getPage(page);
        if (cancelled) return;

        const canvas = canvasRef.current!;
        const container = containerRef.current!;
        const ctx = canvas.getContext("2d")!;

        const baseViewport = pdfPage.getViewport({ scale: 1, rotation });
        let scale = zoom;

        if (zoomMode === "fitWidth") {
          const padding = 32;
          scale = (container.clientWidth - padding) / baseViewport.width;
        } else if (zoomMode === "fitPage") {
          const padding = 32;
          const scaleX = (container.clientWidth - padding) / baseViewport.width;
          const scaleY =
            (container.clientHeight - padding) / baseViewport.height;
          scale = Math.min(scaleX, scaleY);
        }

        const viewport = pdfPage.getViewport({ scale, rotation });
        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const task = pdfPage.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        await task.promise;

        if (textLayerRef.current) {
          textLayerRef.current.innerHTML = "";
          textLayerRef.current.style.width = `${viewport.width}px`;
          textLayerRef.current.style.height = `${viewport.height}px`;

          const textContent = await pdfPage.getTextContent();
          const textLayer = new pdfjs.TextLayer({
            textContentSource: textContent,
            container: textLayerRef.current,
            viewport,
          });
          await textLayer.render();

          if (highlight && highlight.page === page && highlight.text) {
            const searchLower = highlight.text.toLowerCase();
            textLayer.textDivs.forEach((span) => {
              if (span.textContent?.toLowerCase().includes(searchLower)) {
                span.classList.add("search-highlight");
              }
            });
          }
        }
      } catch (err) {
        if (
          err instanceof Error &&
          err.message?.includes("Rendering cancelled")
        ) {
          return;
        }
        console.error("PDF render error:", err);
      }
    }

    void render();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [pdf, page, zoom, zoomMode, rotation, highlight, getPage]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[#6c7086]">
        Loading PDF…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-[#f38ba8]">
        {error}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex min-h-full justify-center p-4">
      <div className="relative shadow-lg">
        <canvas ref={canvasRef} className="block" />
        <TextLayer ref={textLayerRef} />
      </div>
    </div>
  );
}
