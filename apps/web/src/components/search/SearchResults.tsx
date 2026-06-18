import { useDocumentStore } from "@/stores/documentStore";
import type { SearchHit } from "@/api/client";

export function SearchResults() {
  const searchResults = useDocumentStore((s) => s.searchResults);
  const searchError = useDocumentStore((s) => s.searchError);
  const searchQuery = useDocumentStore((s) => s.searchQuery);
  const setCurrentPage = useDocumentStore((s) => s.setCurrentPage);
  const setActiveHighlight = useDocumentStore((s) => s.setActiveHighlight);

  const handleSelect = (hit: SearchHit) => {
    setCurrentPage(hit.page);
    setActiveHighlight({ page: hit.page, text: hit.matchedToken });
  };

  if (searchError) {
    return (
      <div className="p-4 text-xs text-[#fab387]">{searchError}</div>
    );
  }

  if (!searchQuery.trim()) {
    return (
      <div className="p-4 text-xs text-[#6c7086]">
        Smart search matches phonetically similar words (e.g. &quot;Tika&quot; →
        &quot;Tinku&quot;) and shows prior sentence context.
      </div>
    );
  }

  if (searchResults.length === 0) {
    return (
      <div className="p-4 text-xs text-[#6c7086]">No results found.</div>
    );
  }

  return (
    <ul className="flex-1 overflow-y-auto divide-y divide-panel-border">
      {searchResults.map((hit, i) => (
        <li key={`${hit.page}-${hit.matchedToken}-${i}`}>
          <button
            type="button"
            onClick={() => handleSelect(hit)}
            className="w-full px-3 py-3 text-left transition hover:bg-[#313244]"
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#6c7086]">
                Page {hit.page}
              </span>
              <span className="rounded bg-[#45475a] px-1.5 py-0.5 text-[10px] text-[#bac2de]">
                {hit.matchedToken}
              </span>
              <span className="text-[10px] text-[#6c7086]">
                {Math.round(hit.score * 100)}%
              </span>
            </div>

            {hit.context.prior.map((sentence, j) => (
              <p
                key={j}
                className="mb-1 text-xs leading-relaxed text-[#6c7086] line-clamp-2"
              >
                {sentence}
              </p>
            ))}

            <p className="text-xs leading-relaxed text-[#cdd6f4]">
              <HighlightedSentence
                text={hit.context.current}
                start={hit.context.matchRange.start}
                end={hit.context.matchRange.end}
              />
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}

function HighlightedSentence({
  text,
  start,
  end,
}: {
  text: string;
  start: number;
  end: number;
}) {
  const before = text.slice(0, start);
  const match = text.slice(start, end);
  const after = text.slice(end);

  return (
    <>
      {before}
      <mark className="rounded bg-[#fab387]/40 px-0.5 text-[#fab387]">
        {match}
      </mark>
      {after}
    </>
  );
}
