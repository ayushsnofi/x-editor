import type { FastifyInstance } from "fastify";
import { syntacticSearch } from "../services/syntacticSearch.js";
import type { SearchMode } from "../types/index.js";
import { getDocumentIndex, getDocumentMeta } from "../store.js";

export async function searchRoutes(app: FastifyInstance) {
  app.get<{
    Params: { id: string };
    Querystring: { q?: string; mode?: SearchMode };
  }>("/api/documents/:id/search", async (request, reply) => {
    const { id } = request.params;
    const { q = "", mode = "smart" } = request.query;

    const meta = getDocumentMeta(id);
    if (!meta) {
      return reply.status(404).send({ error: "Document not found" });
    }

    if (meta.status === "indexing") {
      return reply.status(202).send({
        error: "Document is still indexing",
        status: meta.status,
      });
    }

    if (meta.status === "error") {
      return reply.status(500).send({
        error: meta.error ?? "Indexing failed",
        status: meta.status,
      });
    }

    const index = getDocumentIndex(id);
    if (!index) {
      return reply.status(404).send({ error: "Index not found" });
    }

    const validMode: SearchMode =
      mode === "exact" || mode === "fuzzy" ? mode : "smart";

    return syntacticSearch(index, q, validMode);
  });
}
