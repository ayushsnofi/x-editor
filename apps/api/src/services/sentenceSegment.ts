import type { Sentence } from "../types/index.js";

const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "prof", "sr", "jr", "vs", "etc", "e.g", "i.e",
]);

function isSentenceEnd(text: string, index: number): boolean {
  const char = text[index];
  if (char !== "." && char !== "!" && char !== "?") return false;

  const before = text.slice(Math.max(0, index - 2), index).toLowerCase();
  const wordBefore = before.replace(/[^a-z.]/g, "");
  if (char === "." && ABBREVIATIONS.has(wordBefore)) return false;

  const after = text[index + 1];
  if (char === "." && after && /\d/.test(after)) return false;

  return true;
}

export function segmentSentences(
  pages: { page: number; text: string }[],
): Sentence[] {
  const sentences: Sentence[] = [];
  let id = 0;

  for (const { page, text } of pages) {
    if (!text.trim()) continue;

    let start = 0;
    for (let i = 0; i < text.length; i++) {
      if (!isSentenceEnd(text, i)) continue;

      const slice = text.slice(start, i + 1).trim();
      if (slice.length > 0) {
        sentences.push({
          id: id++,
          page,
          sentenceIndex: sentences.filter((s) => s.page === page).length,
          text: slice,
          startChar: start,
        });
      }
      start = i + 1;
      while (start < text.length && /\s/.test(text[start]!)) start++;
    }

    const remainder = text.slice(start).trim();
    if (remainder.length > 0) {
      sentences.push({
        id: id++,
        page,
        sentenceIndex: sentences.filter((s) => s.page === page).length,
        text: remainder,
        startChar: start,
      });
    }
  }

  return sentences;
}

export function tokenizeSentence(sentence: string): string[] {
  return sentence
    .split(/[\s\u00A0]+/)
    .map((w) => w.replace(/^[^\w]+|[^\w]+$/g, ""))
    .filter((w) => w.length > 0);
}

export function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/[^\w]/g, "");
}
