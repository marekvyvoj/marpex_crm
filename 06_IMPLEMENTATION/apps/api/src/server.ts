import { buildApp } from "./app.js";
import { loadEnv } from "./lib/env.js";

loadEnv();

const PORT = Number(process.env.API_PORT) || 3005;
const HOST = process.env.API_HOST || "0.0.0.0";

async function main() {
  const app = await buildApp();

  await app.listen({ port: PORT, host: HOST });
  console.log(`🚀 API running at http://${HOST}:${PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
