import natural from "natural";
import type { DocumentIndex, TokenOccurrence } from "../types/index.js";
import { extractTextFromPdf } from "./extractText.js";
import {
  normalizeToken,
  segmentSentences,
  tokenizeSentence,
} from "./sentenceSegment.js";

const metaphone = new natural.Metaphone();
const doubleMetaphone = new natural.DoubleMetaphone();

function tokenMetaphone(normalized: string): string {
  const doubleCodes = doubleMetaphone.process(normalized);
  if (Array.isArray(doubleCodes)) {
    const primary = doubleCodes[0];
    if (primary) return primary;
  } else if (doubleCodes) {
    return doubleCodes;
  }
  return metaphone.process(normalized) || "";
}

export async function buildDocumentIndex(
  documentId: string,
  fileName: string,
  buffer: Buffer,
): Promise<DocumentIndex> {
  const { pages } = await extractTextFromPdf(buffer);
  const sentences = segmentSentences(pages);
  const tokens: TokenOccurrence[] = [];

  for (const sentence of sentences) {
    const words = tokenizeSentence(sentence.text);
    words.forEach((original, wordIndex) => {
      const normalized = normalizeToken(original);
      if (!normalized) return;
      tokens.push({
        page: sentence.page,
        sentenceId: sentence.id,
        wordIndex,
        original,
        normalized,
        metaphone: tokenMetaphone(normalized),
      });
    });
  }

  return { documentId, fileName, sentences, tokens };
}
