import { useEffect } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { FilesPanel } from "@/components/panels/FilesPanel";
import { ToolsPanel } from "@/components/panels/ToolsPanel";
import { ViewerPanel } from "@/components/panels/ViewerPanel";
import { useDebouncedSearch, useDocumentIndexing } from "@/hooks/usePdfSearch";
import { useDocumentStore } from "@/stores/documentStore";

export function AppShell() {
  useDebouncedSearch();
  useDocumentIndexing();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "o") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
      }
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
      }
      if (e.key === "ArrowLeft" && !isInputFocused()) {
        const { currentPage, setCurrentPage } = useDocumentStore.getState();
        if (currentPage > 1) setCurrentPage(currentPage - 1);
      }
      if (e.key === "ArrowRight" && !isInputFocused()) {
        const { currentPage, setCurrentPage, getActiveDocument } =
          useDocumentStore.getState();
        const doc = getActiveDocument();
        const max = doc?.pageCount || currentPage;
        if (currentPage < max) setCurrentPage(currentPage + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex h-full flex-col bg-[#11111b]">
      <header className="flex h-11 shrink-0 items-center border-b border-panel-border bg-panel-muted px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-panel-accent/20 text-sm font-bold text-panel-accent">
            X
          </div>
          <span className="text-sm font-semibold tracking-wide text-[#cdd6f4]">
            X-Editor
          </span>
          <span className="text-xs text-[#6c7086]">PDF Editor</span>
        </div>
      </header>

      <PanelGroup direction="horizontal" className="flex-1">
        <Panel defaultSize={20} minSize={15} maxSize={35}>
          <FilesPanel />
        </Panel>

        <PanelResizeHandle className="w-1 bg-panel-border transition-colors hover:bg-panel-accent/50" />

        <Panel defaultSize={55} minSize={35}>
          <ViewerPanel />
        </Panel>

        <PanelResizeHandle className="w-1 bg-panel-border transition-colors hover:bg-panel-accent/50" />

        <Panel defaultSize={25} minSize={18} maxSize={40}>
          <ToolsPanel />
        </Panel>
      </PanelGroup>
    </div>
  );
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el?.getAttribute("contenteditable") === "true"
  );
}
