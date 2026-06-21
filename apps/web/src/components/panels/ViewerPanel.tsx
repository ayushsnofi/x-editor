import { useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  Plus,
  Printer,
  RotateCw,
} from "lucide-react";
import { useDocumentStore } from "@/stores/documentStore";
import { PdfCanvas } from "@/components/viewer/PdfCanvas";

export function ViewerPanel() {
  const activeDoc = useDocumentStore((s) =>
    s.activeLocalId
      ? s.documents.find((d) => d.localId === s.activeLocalId)
      : undefined,
  );
  const updateDocument = useDocumentStore((s) => s.updateDocument);
  const currentPage = useDocumentStore((s) => s.currentPage);
  const zoom = useDocumentStore((s) => s.zoom);
  const zoomMode = useDocumentStore((s) => s.zoomMode);
  const rotation = useDocumentStore((s) => s.rotation);
  const setCurrentPage = useDocumentStore((s) => s.setCurrentPage);
  const setZoom = useDocumentStore((s) => s.setZoom);
  const setZoomMode = useDocumentStore((s) => s.setZoomMode);
  const rotateClockwise = useDocumentStore((s) => s.rotateClockwise);
  const activeHighlight = useDocumentStore((s) => s.activeHighlight);

  const handleDownload = () => {
    if (!activeDoc) return;
    const url = URL.createObjectURL(activeDoc.file);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeDoc.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!activeDoc) return;
    const url = URL.createObjectURL(activeDoc.file);
    const w = window.open(url);
    w?.addEventListener("load", () => w.print());
  };

  const handlePageCount = useCallback(
    (count: number) => {
      if (!activeDoc) return;
      updateDocument(activeDoc.localId, { pageCount: count });
    },
    [activeDoc?.localId, updateDocument],
  );

  return (
    <main className="flex h-full flex-col bg-[#181825]">
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-panel-border bg-panel-muted px-2 py-1.5">
        <ToolbarButton
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={!activeDoc || currentPage <= 1}
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            setCurrentPage(
              Math.min(activeDoc?.pageCount || currentPage, currentPage + 1),
            )
          }
          disabled={
            !activeDoc ||
            (activeDoc.pageCount > 0 && currentPage >= activeDoc.pageCount)
          }
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 flex items-center gap-1 text-sm text-[#bac2de]">
          <input
            type="number"
            min={1}
            max={activeDoc?.pageCount || 1}
            value={currentPage}
            onChange={(e) => {
              const p = Number(e.target.value);
              if (p >= 1) setCurrentPage(p);
            }}
            className="w-12 rounded border border-panel-border bg-[#313244] px-1 py-0.5 text-center text-xs text-[#cdd6f4] outline-none focus:border-panel-accent"
            disabled={!activeDoc}
          />
          <span className="text-xs text-[#6c7086]">
            / {activeDoc?.pageCount || "—"}
          </span>
        </div>

        <div className="mx-2 h-5 w-px bg-panel-border" />

        <ToolbarButton
          onClick={() => setZoomMode("fitWidth")}
          active={zoomMode === "fitWidth"}
          title="Fit width"
        >
          <span className="text-[10px] font-semibold">W</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setZoomMode("fitPage")}
          active={zoomMode === "fitPage"}
          title="Fit page"
        >
          <span className="text-[10px] font-semibold">P</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => setZoom(1)} title="100%">
          <span className="text-[10px] font-semibold">100%</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}
          title="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        <span className="min-w-[3rem] text-center text-xs text-[#6c7086]">
          {Math.round(zoom * 100)}%
        </span>
        <ToolbarButton
          onClick={() => setZoom(Math.min(4, zoom + 0.1))}
          title="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-2 h-5 w-px bg-panel-border" />

        <ToolbarButton onClick={rotateClockwise} title="Rotate clockwise">
          <RotateCw className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={handleDownload} disabled={!activeDoc} title="Download">
          <Download className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={handlePrint} disabled={!activeDoc} title="Print">
          <Printer className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <div className="flex-1 overflow-auto">
        {activeDoc ? (
          <PdfCanvas
            file={activeDoc.file}
            page={currentPage}
            zoom={zoom}
            zoomMode={zoomMode}
            rotation={rotation}
            highlight={activeHighlight}
            onPageCount={handlePageCount}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#6c7086]">
            <div className="text-center">
              <p className="text-lg font-medium text-[#bac2de]">
                No document open
              </p>
              <p className="mt-1 text-sm">
                Open a PDF from the left panel or drag and drop
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ToolbarButton({
  children,
  onClick,
  disabled,
  active,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-[#bac2de] transition hover:bg-[#313244] disabled:opacity-40 ${
        active ? "bg-[#313244] text-panel-accent" : ""
      }`}
    >
      {children}
    </button>
  );
}
