import pdfParse from "pdf-parse";

export interface PageText {
  page: number;
  text: string;
}

/**
 * pdf-parse returns full document text; we split heuristically by form-feed
 * or approximate per-page chunks when page markers exist.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<{
  pageCount: number;
  pages: PageText[];
  fullText: string;
}> {
  const result = await pdfParse(buffer);
  const fullText = result.text ?? "";
  const pageCount = result.numpages || 1;

  if (fullText.includes("\f")) {
    const chunks = fullText.split("\f");
    const pages: PageText[] = chunks.map((text, i) => ({
      page: i + 1,
      text: text.trim(),
    }));
    return { pageCount: Math.max(pageCount, pages.length), pages, fullText };
  }

  if (pageCount <= 1) {
    return {
      pageCount: 1,
      pages: [{ page: 1, text: fullText.trim() }],
      fullText,
    };
  }

  const approxLen = Math.ceil(fullText.length / pageCount);
  const pages: PageText[] = [];
  for (let i = 0; i < pageCount; i++) {
    const start = i * approxLen;
    const chunk = fullText.slice(start, start + approxLen).trim();
    pages.push({ page: i + 1, text: chunk });
  }

  return { pageCount, pages, fullText };
}
