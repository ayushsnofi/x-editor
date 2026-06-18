import { Search as SearchIcon } from "lucide-react";
import type { SearchMode } from "@/api/client";
import { useDocumentStore } from "@/stores/documentStore";

const MODES: { value: SearchMode; label: string }[] = [
  { value: "smart", label: "Smart" },
  { value: "exact", label: "Exact" },
  { value: "fuzzy", label: "Fuzzy" },
];

export function SearchBar() {
  const searchQuery = useDocumentStore((s) => s.searchQuery);
  const searchMode = useDocumentStore((s) => s.searchMode);
  const searchLoading = useDocumentStore((s) => s.searchLoading);
  const activeDoc = useDocumentStore((s) => s.getActiveDocument());
  const setSearchQuery = useDocumentStore((s) => s.setSearchQuery);
  const setSearchMode = useDocumentStore((s) => s.setSearchMode);

  return (
    <div className="space-y-2 border-b border-panel-border p-3">
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6c7086]" />
        <input
          type="search"
          placeholder={
            activeDoc ? "Search document…" : "Open a document to search"
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={!activeDoc}
          className="w-full rounded-md border border-panel-border bg-[#313244] py-2 pl-9 pr-3 text-sm text-[#cdd6f4] outline-none placeholder:text-[#6c7086] focus:border-panel-accent disabled:opacity-50"
        />
        {searchLoading && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#6c7086]">
            …
          </span>
        )}
      </div>

      <div className="flex gap-1">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setSearchMode(m.value)}
            className={`rounded px-2 py-1 text-[10px] font-medium uppercase tracking-wide transition ${
              searchMode === m.value
                ? "bg-panel-accent text-[#11111b]"
                : "bg-[#313244] text-[#6c7086] hover:text-[#bac2de]"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {activeDoc?.status === "indexing" && (
        <p className="text-xs text-[#fab387]">Indexing document for search…</p>
      )}
    </div>
  );
}
