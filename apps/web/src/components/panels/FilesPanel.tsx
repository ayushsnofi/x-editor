import { useCallback, useRef, useState } from "react";
import { FileUp, Files } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { useDocumentStore } from "@/stores/documentStore";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    idle: "bg-[#45475a] text-[#bac2de]",
    indexing: "bg-[#fab387]/20 text-[#fab387]",
    ready: "bg-[#a6e3a1]/20 text-[#a6e3a1]",
    error: "bg-[#f38ba8]/20 text-[#f38ba8]",
  };

  const labels: Record<string, string> = {
    idle: "Ready",
    indexing: "Indexing…",
    ready: "Indexed",
    error: "Error",
  };

  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        styles[status] ?? styles.idle,
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}

export function FilesPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const documents = useDocumentStore((s) => s.documents);
  const activeLocalId = useDocumentStore((s) => s.activeLocalId);
  const addDocument = useDocumentStore((s) => s.addDocument);
  const setActiveDocument = useDocumentStore((s) => s.setActiveDocument);
  const setCurrentPage = useDocumentStore((s) => s.setCurrentPage);
  const currentPage = useDocumentStore((s) => s.currentPage);
  const activeDoc = useDocumentStore((s) => s.getActiveDocument());

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const file = files[0];
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        alert("Please select a PDF file.");
        return;
      }
      addDocument(file);
    },
    [addDocument],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <aside className="flex h-full flex-col border-r border-panel-border bg-panel">
      <div className="border-b border-panel-border px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6c7086]">
          Files
        </h2>
      </div>

      <div className="space-y-2 border-b border-panel-border p-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-panel-accent px-3 py-2 text-sm font-medium text-[#11111b] transition hover:bg-[#74c7ec]"
        >
          <FileUp className="h-4 w-4" />
          Open PDF
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "rounded-md border border-dashed px-3 py-4 text-center text-xs text-[#6c7086] transition",
            dragOver
              ? "border-panel-accent bg-panel-accent/10 text-panel-accent"
              : "border-panel-border",
          )}
        >
          Drop PDF here
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-[#6c7086]">
            <Files className="h-8 w-8 opacity-50" />
            <p className="text-xs">No documents open</p>
          </div>
        ) : (
          <ul className="divide-y divide-panel-border">
            {documents.map((doc) => (
              <li key={doc.localId}>
                <button
                  type="button"
                  onClick={() => setActiveDocument(doc.localId)}
                  className={cn(
                    "w-full px-3 py-2.5 text-left transition hover:bg-[#313244]",
                    activeLocalId === doc.localId && "bg-[#313244]",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium text-[#cdd6f4]">
                      {doc.fileName}
                    </p>
                    <StatusBadge status={doc.status} />
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#6c7086]">
                    {formatFileSize(doc.fileSize)}
                    {doc.pageCount > 0 && ` · ${doc.pageCount} pages`}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {activeDoc && activeDoc.pageCount > 0 && (
        <div className="border-t border-panel-border p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6c7086]">
            Pages
          </p>
          <div className="grid max-h-40 grid-cols-4 gap-1 overflow-y-auto">
            {Array.from({ length: activeDoc.pageCount }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "rounded px-1 py-1 text-xs transition hover:bg-[#45475a]",
                    currentPage === page
                      ? "bg-panel-accent text-[#11111b]"
                      : "text-[#bac2de]",
                  )}
                >
                  {page}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
