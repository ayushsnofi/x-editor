import { useState } from "react";
import { FileText, Info, Search } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { useDocumentStore } from "@/stores/documentStore";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";

type Tab = "search" | "info";

export function ToolsPanel() {
  const [tab, setTab] = useState<Tab>("search");
  const activeDoc = useDocumentStore((s) => s.getActiveDocument());

  return (
    <aside className="flex h-full flex-col border-l border-panel-border bg-panel">
      <div className="flex border-b border-panel-border">
        <TabButton
          active={tab === "search"}
          onClick={() => setTab("search")}
          icon={<Search className="h-3.5 w-3.5" />}
          label="Search"
        />
        <TabButton
          active={tab === "info"}
          onClick={() => setTab("info")}
          icon={<Info className="h-3.5 w-3.5" />}
          label="Info"
        />
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === "search" ? (
          <div className="flex h-full flex-col">
            <SearchBar />
            <SearchResults />
          </div>
        ) : (
          <DocumentInfo doc={activeDoc} />
        )}
      </div>
    </aside>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition",
        active
          ? "border-panel-accent text-panel-accent"
          : "border-transparent text-[#6c7086] hover:text-[#bac2de]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function DocumentInfo({
  doc,
}: {
  doc: ReturnType<ReturnType<typeof useDocumentStore.getState>["getActiveDocument"]>;
}) {
  if (!doc) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-[#6c7086]">
        <FileText className="h-8 w-8 opacity-50" />
        <p className="text-xs">Open a document to see details</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 text-sm">
      <InfoRow label="Filename" value={doc.fileName} />
      <InfoRow label="Size" value={formatFileSize(doc.fileSize)} />
      <InfoRow label="Pages" value={String(doc.pageCount || "—")} />
      <InfoRow label="Indexed tokens" value={String(doc.tokenCount || "—")} />
      <InfoRow label="Status" value={doc.status} />
      {doc.documentId && (
        <InfoRow label="Document ID" value={doc.documentId.slice(0, 8) + "…"} />
      )}
      {doc.statusError && (
        <p className="rounded bg-[#f38ba8]/10 p-2 text-xs text-[#f38ba8]">
          {doc.statusError}
        </p>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6c7086]">
        {label}
      </p>
      <p className="mt-0.5 break-all text-[#cdd6f4]">{value}</p>
    </div>
  );
}
