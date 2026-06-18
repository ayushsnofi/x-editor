import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { documentRoutes } from "./routes/documents.js";
import { searchRoutes } from "./routes/search.js";

const PORT = Number(process.env.PORT ?? 3001);

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
});

await app.register(multipart, {
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_MB ?? 50) * 1024 * 1024,
  },
});

await app.register(documentRoutes);
await app.register(searchRoutes);

app.get("/api/health", async () => ({ status: "ok" }));

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`API listening on http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
