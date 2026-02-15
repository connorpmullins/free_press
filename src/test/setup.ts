import { vi } from "vitest";

// ============================================================
// Mock: @prisma/client
// ============================================================

vi.mock("@prisma/client", () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => mockPrismaClient),
  };
});

vi.mock("@prisma/adapter-pg", () => {
  return {
    PrismaPg: vi.fn().mockImplementation(() => ({})),
  };
});

// ============================================================
// Mock: Prisma DB
// ============================================================

export const mockPrismaClient = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  session: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  magicLink: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  journalistProfile: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  article: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  articleVersion: {
    create: vi.fn(),
  },
  source: {
    createMany: vi.fn(),
  },
  flag: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  correction: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  dispute: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  appeal: {
    create: vi.fn(),
  },
  bookmark: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  subscription: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn(),
  },
  reputationEvent: {
    create: vi.fn(),
  },
  integrityLabel: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  notification: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  featureRequest: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  vote: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  revenueEntry: {
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  platformConfig: {
    findUnique: vi.fn(),
  },
  accountAction: {
    create: vi.fn(),
  },
  $transaction: vi.fn().mockImplementation(async (fn: unknown) => {
    if (typeof fn === "function") {
      return fn(mockPrismaClient);
    }
    return fn;
  }),
};

vi.mock("@/lib/db", () => ({
  db: mockPrismaClient,
}));

// ============================================================
// Mock: Redis
// ============================================================

export const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  pipeline: vi.fn().mockReturnValue({
    zremrangebyscore: vi.fn(),
    zadd: vi.fn(),
    zcard: vi.fn(),
    expire: vi.fn(),
    exec: vi.fn().mockResolvedValue([
      [null, 0],
      [null, 1],
      [null, 1],
      [null, 1],
    ]),
  }),
};

vi.mock("@/lib/redis", async () => {
  return {
    redis: mockRedis,
    cacheGet: vi.fn().mockResolvedValue(null),
    cacheSet: vi.fn().mockResolvedValue(undefined),
    cacheDel: vi.fn().mockResolvedValue(undefined),
    checkRateLimit: vi.fn().mockResolvedValue({
      allowed: true,
      remaining: 10,
      resetAt: Math.floor(Date.now() / 1000) + 3600,
    }),
  };
});

// ============================================================
// Mock: next/headers (cookies)
// ============================================================

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
  headers: vi.fn().mockResolvedValue(new Map()),
}));

export { mockCookieStore };

// ============================================================
// Mock: next/navigation
// ============================================================

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectError(url);
  }),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => "/"),
}));

export class RedirectError extends Error {
  url: string;
  constructor(url: string) {
    super(`REDIRECT: ${url}`);
    this.url = url;
    this.name = "RedirectError";
  }
}

// ============================================================
// Mock: audit log
// ============================================================

vi.mock("@/lib/audit", () => ({
  auditLog: vi.fn().mockResolvedValue(undefined),
}));

// ============================================================
// Mock: search
// ============================================================

vi.mock("@/lib/search", () => ({
  meili: null,
  initializeSearchIndexes: vi.fn(),
  indexArticle: vi.fn(),
  removeArticleFromIndex: vi.fn(),
  syncArticleInSearch: vi.fn().mockResolvedValue(undefined),
  searchArticles: vi.fn().mockResolvedValue({ hits: [], totalHits: 0 }),
  searchAuthors: vi.fn().mockResolvedValue({ hits: [], totalHits: 0 }),
}));

// ============================================================
// Mock: email
// ============================================================

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  sendMagicLinkEmail: vi.fn().mockResolvedValue(undefined),
}));

// ============================================================
// Mock: stripe
// ============================================================

vi.mock("@/lib/stripe", () => ({
  stripe: null,
  isStripeEnabled: vi.fn().mockReturnValue(false),
  createCheckoutSession: vi.fn(),
  createStripeCustomer: vi.fn(),
  cancelSubscription: vi.fn(),
  createConnectAccount: vi.fn(),
  createConnectOnboardingLink: vi.fn(),
  createPayout: vi.fn(),
  createVerificationSession: vi.fn(),
  getVerificationSessionStatus: vi.fn(),
  constructWebhookEvent: vi.fn(),
}));

// ============================================================
// Global test environment setup
// ============================================================

// @ts-expect-error - setting env vars for test
process.env["NODE_ENV"] = "test";
process.env["NEXT_PUBLIC_APP_URL"] = "http://localhost:3000";
process.env["DATABASE_URL"] = "postgresql://test:test@localhost:5432/test";
process.env["REDIS_URL"] = "redis://localhost:6379";
