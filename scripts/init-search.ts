import { initializeSearchIndexes } from "../src/lib/search";

async function main() {
  console.log("Initializing Meilisearch indexes...");
  await initializeSearchIndexes();
  console.log("Done!");
}

main().catch(console.error);
