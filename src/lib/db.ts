import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion: string | undefined;
};

// Bump this version when the Prisma schema changes to bust the globalThis cache
// during development hot-reloads. The stale PrismaClient on globalThis otherwise
// survives Turbopack rebuilds and causes "column does not exist" errors.
const SCHEMA_VERSION = "2";

function createPrismaClient(): PrismaClient {
  const connectionString =
    process.env.DATABASE_URL || "postgresql://warrant:warrant_dev@localhost:5432/warrant";

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

if (globalForPrisma.prismaSchemaVersion !== SCHEMA_VERSION) {
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaSchemaVersion = SCHEMA_VERSION;
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
