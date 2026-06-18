import type { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { buildDocumentIndex } from "../services/indexDocument.js";
import {
  getDocumentMeta,
  setDocumentBuffer,
  setDocumentIndex,
  setDocumentMeta,
} from "../store.js";

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB ?? 50);

export async function documentRoutes(app: FastifyInstance) {
  app.post("/api/documents", async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: "No file uploaded" });
    }

    const buffer = await data.toBuffer();
    const maxBytes = MAX_UPLOAD_MB * 1024 * 1024;
    if (buffer.length > maxBytes) {
      return reply.status(413).send({ error: `File exceeds ${MAX_UPLOAD_MB}MB limit` });
    }

    const documentId = uuidv4();
    const fileName = data.filename ?? "document.pdf";

    setDocumentMeta(documentId, {
      documentId,
      fileName,
      status: "indexing",
      pageCount: 0,
      tokenCount: 0,
    });
    setDocumentBuffer(documentId, buffer);

    void (async () => {
      try {
        const index = await buildDocumentIndex(documentId, fileName, buffer);
        setDocumentIndex(documentId, index);
        const pageCount = new Set(index.sentences.map((s) => s.page)).size || 1;
        setDocumentMeta(documentId, {
          documentId,
          fileName,
          status: "ready",
          pageCount,
          tokenCount: index.tokens.length,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Indexing failed";
        setDocumentMeta(documentId, {
          documentId,
          fileName,
          status: "error",
          pageCount: 0,
          tokenCount: 0,
          error: message,
        });
      }
    })();

    return { documentId, fileName, status: "indexing" };
  });

  app.get<{ Params: { id: string } }>(
    "/api/documents/:id/status",
    async (request, reply) => {
      const meta = getDocumentMeta(request.params.id);
      if (!meta) {
        return reply.status(404).send({ error: "Document not found" });
      }
      return meta;
    },
  );
}
