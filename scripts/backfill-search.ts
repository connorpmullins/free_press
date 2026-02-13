import { db } from "../src/lib/db";
import { initializeSearchIndexes, syncArticleInSearch } from "../src/lib/search";

async function main() {
  console.log("Initializing search indexes...");
  await initializeSearchIndexes();

  const articles = await db.article.findMany({
    select: { id: true },
  });

  console.log(`Syncing ${articles.length} articles...`);
  for (const article of articles) {
    await syncArticleInSearch(article.id);
  }
  console.log("Search backfill complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
