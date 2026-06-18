import natural from "natural";
import Fuse from "fuse.js";
import type {
  DocumentIndex,
  SearchHit,
  SearchMode,
  SearchResponse,
} from "../types/index.js";
import { tokenizeSentence } from "./sentenceSegment.js";

const metaphone = new natural.Metaphone();
const doubleMetaphone = new natural.DoubleMetaphone();

export const MIN_SCORE = 0.55;
export const LEVENSHTEIN_MIN_RATIO = 0.55;
export const PHONETIC_SCORE = 0.78;
export const PREFIX_SCORE = 0.85;
export const JARO_MIN = 0.82;

function levenshteinRatio(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = natural.LevenshteinDistance(a, b);
  return 1 - dist / maxLen;
}

function lengthSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return Math.min(a.length, b.length) / maxLen;
}

function phoneticMatch(query: string, tokenMetaphone: string): boolean {
  const single = metaphone.process(query);
  const doubleCodes = doubleMetaphone.process(query);
  const codes = new Set<string>();
  if (single) codes.add(single);
  if (Array.isArray(doubleCodes)) {
    doubleCodes.forEach((c) => c && codes.add(c));
  } else if (doubleCodes) {
    codes.add(doubleCodes);
  }
  return codes.has(tokenMetaphone);
}

function scoreToken(
  query: string,
  token: DocumentIndex["tokens"][number],
  mode: SearchMode,
): number {
  const q = query.toLowerCase();
  const t = token.normalized;

  if (mode === "exact") {
    return t === q || t.includes(q) ? 1 : 0;
  }

  if (t === q) return 1;
  if (t.startsWith(q) && q.length >= 3) return PREFIX_SCORE;

  const lenSim = lengthSimilarity(q, t);
  if (t.length < 3 || (q.length >= 3 && lenSim < 0.5)) {
    return 0;
  }

  const lev = levenshteinRatio(q, t);
  const jaro = natural.JaroWinklerDistance(q, t, { ignoreCase: true });
  const isPhonetic =
    q.length >= 3 &&
    t.length >= 3 &&
    lenSim >= 0.6 &&
    phoneticMatch(q, token.metaphone);

  if (mode === "fuzzy") {
    if (lev >= LEVENSHTEIN_MIN_RATIO) return lev * 0.85 * lenSim;
    if (jaro >= JARO_MIN) return jaro * 0.85;
    return 0;
  }

  let score = 0;
  if (lev >= LEVENSHTEIN_MIN_RATIO) score = Math.max(score, lev * 0.85 * lenSim);
  if (jaro >= JARO_MIN) score = Math.max(score, jaro * 0.85);
  if (isPhonetic) score = Math.max(score, PHONETIC_SCORE * lenSim);
  return score;
}

function getPriorSentences(
  index: DocumentIndex,
  sentenceId: number,
  count = 2,
): string[] {
  const sentence = index.sentences.find((s) => s.id === sentenceId);
  if (!sentence) return [];

  const prior: string[] = [];
  const samePage = index.sentences.filter((s) => s.page === sentence.page);
  const idxInPage = samePage.findIndex((s) => s.id === sentenceId);

  for (let i = idxInPage - 1; i >= 0 && prior.length < count; i--) {
    prior.unshift(samePage[i]!.text);
  }

  if (prior.length < count) {
    const crossPage = index.sentences
      .filter((s) => s.page < sentence.page)
      .slice(-(count - prior.length));
    prior.unshift(...crossPage.map((s) => s.text));
  }

  return prior.slice(-count);
}

function findMatchRange(sentenceText: string, matchedToken: string): {
  start: number;
  end: number;
} {
  const lower = sentenceText.toLowerCase();
  const tokenLower = matchedToken.toLowerCase();
  const idx = lower.indexOf(tokenLower);
  if (idx >= 0) {
    return { start: idx, end: idx + matchedToken.length };
  }
  return { start: 0, end: matchedToken.length };
}

export function syntacticSearch(
  index: DocumentIndex,
  query: string,
  mode: SearchMode = "smart",
): SearchResponse {
  const trimmed = query.trim();
  if (!trimmed) {
    return { query: trimmed, mode, hits: [] };
  }

  const queryTokens = tokenizeSentence(trimmed);
  const primaryQuery = queryTokens[0] ?? trimmed.toLowerCase();

  const scored: SearchHit[] = [];
  const seen = new Set<string>();

  for (const token of index.tokens) {
    const score = scoreToken(primaryQuery, token, mode);
    if (score < MIN_SCORE) continue;

    const sentence = index.sentences.find((s) => s.id === token.sentenceId);
    if (!sentence) continue;

    const key = `${token.sentenceId}:${token.original}`;
    if (seen.has(key)) continue;
    seen.add(key);

    scored.push({
      page: token.page,
      score: Math.round(score * 100) / 100,
      matchedToken: token.original,
      context: {
        prior: getPriorSentences(index, token.sentenceId),
        current: sentence.text,
        matchRange: findMatchRange(sentence.text, token.original),
      },
    });
  }

  if (mode === "smart" && scored.length < 5) {
    const fuse = new Fuse(index.tokens, {
      keys: ["normalized", "original"],
      threshold: 0.35,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: Math.min(3, primaryQuery.length),
    });
    const fuseResults = fuse.search(primaryQuery);
    for (const result of fuseResults) {
      const token = result.item;
      if (token.normalized.length < 3) continue;
      if (lengthSimilarity(primaryQuery, token.normalized) < 0.5) continue;
      const key = `${token.sentenceId}:${token.original}`;
      if (seen.has(key)) continue;
      const fuseScore = 1 - (result.score ?? 1);
      if (fuseScore < MIN_SCORE) continue;

      const sentence = index.sentences.find((s) => s.id === token.sentenceId);
      if (!sentence) continue;
      seen.add(key);

      scored.push({
        page: token.page,
        score: Math.round(fuseScore * 100) / 100,
        matchedToken: token.original,
        context: {
          prior: getPriorSentences(index, token.sentenceId),
          current: sentence.text,
          matchRange: findMatchRange(sentence.text, token.original),
        },
      });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.page - b.page);

  return {
    query: trimmed,
    mode,
    hits: scored.slice(0, 50),
  };
}
