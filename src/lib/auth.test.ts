import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrismaClient, mockCookieStore } from "@/test/setup";
import { mockRedis } from "@/test/setup";

import {
  generateToken,
  hashToken,
  createMagicLink,
  verifyMagicLink,
  createSession,
  getSession,
  destroySession,
  requireAuth,
  requireRole,
  AuthError,
} from "./auth";

describe("Auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // Token generation
  // ============================================================

  describe("generateToken", () => {
    it("generates a 64-character hex string", () => {
      const token = generateToken();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it("generates unique tokens each time", () => {
      const token1 = generateToken();
      const token2 = generateToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe("hashToken", () => {
    it("produces consistent hash for same input", () => {
      const hash1 = hashToken("test-token");
      const hash2 = hashToken("test-token");
      expect(hash1).toBe(hash2);
    });

    it("produces different hash for different input", () => {
      const hash1 = hashToken("token-a");
      const hash2 = hashToken("token-b");
      expect(hash1).not.toBe(hash2);
    });

    it("returns a 64-character hex string (SHA-256)", () => {
      const hash = hashToken("any-input");
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  // ============================================================
  // Magic Links
  // ============================================================

  describe("createMagicLink", () => {
    it("creates a new user if one doesn't exist", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValueOnce(null);
      mockPrismaClient.user.create.mockResolvedValueOnce({
        id: "new-user-id",
        email: "new@example.com",
        displayName: "new",
      });
      mockPrismaClient.magicLink.create.mockResolvedValueOnce({});

      const token = await createMagicLink("new@example.com");

      expect(token).toMatch(/^[a-f0-9]{64}$/);
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: {
          email: "new@example.com",
          displayName: "new",
        },
      });
      expect(mockPrismaClient.magicLink.create).toHaveBeenCalled();
    });

    it("uses existing user", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValueOnce({
        id: "existing-user",
        email: "existing@example.com",
      });
      mockPrismaClient.magicLink.create.mockResolvedValueOnce({});

      const token = await createMagicLink("existing@example.com");

      expect(token).toMatch(/^[a-f0-9]{64}$/);
      expect(mockPrismaClient.user.create).not.toHaveBeenCalled();
    });
  });

  describe("verifyMagicLink", () => {
    it("returns null for non-existent token", async () => {
      mockPrismaClient.magicLink.findUnique.mockResolvedValueOnce(null);

      const user = await verifyMagicLink("invalid-token");
      expect(user).toBeNull();
    });

    it("returns null for used token", async () => {
      mockPrismaClient.magicLink.findUnique.mockResolvedValueOnce({
        id: "ml-1",
        used: true,
        expiresAt: new Date(Date.now() + 60000),
        user: { id: "user-1" },
      });

      const user = await verifyMagicLink("used-token");
      expect(user).toBeNull();
    });

    it("returns null for expired token", async () => {
      mockPrismaClient.magicLink.findUnique.mockResolvedValueOnce({
        id: "ml-1",
        used: false,
        expiresAt: new Date(Date.now() - 60000), // expired
        user: { id: "user-1" },
      });

      const user = await verifyMagicLink("expired-token");
      expect(user).toBeNull();
    });

    it("returns user and marks token as used for valid token", async () => {
      const mockUser = {
        id: "user-1",
        email: "user@example.com",
        emailVerified: false,
      };
      mockPrismaClient.magicLink.findUnique.mockResolvedValueOnce({
        id: "ml-1",
        used: false,
        expiresAt: new Date(Date.now() + 60000),
        user: mockUser,
      });
      mockPrismaClient.magicLink.update.mockResolvedValueOnce({});
      mockPrismaClient.user.update.mockResolvedValueOnce({});

      const user = await verifyMagicLink("valid-token");

      expect(user).toBeTruthy();
      expect(user?.id).toBe("user-1");
      expect(mockPrismaClient.magicLink.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ml-1" },
          data: { used: true },
        })
      );
      // Should verify email if not already verified
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { emailVerified: true },
        })
      );
    });

    it("doesn't re-verify already verified email", async () => {
      const mockUser = {
        id: "user-1",
        email: "user@example.com",
        emailVerified: true,
      };
      mockPrismaClient.magicLink.findUnique.mockResolvedValueOnce({
        id: "ml-1",
        used: false,
        expiresAt: new Date(Date.now() + 60000),
        user: mockUser,
      });
      mockPrismaClient.magicLink.update.mockResolvedValueOnce({});

      await verifyMagicLink("valid-token");

      expect(mockPrismaClient.user.update).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Sessions
  // ============================================================

  describe("createSession", () => {
    it("creates session in DB and Redis", async () => {
      mockPrismaClient.session.create.mockResolvedValueOnce({});

      const token = await createSession("user-1", "1.2.3.4", "Mozilla/5.0");

      expect(token).toMatch(/^[a-f0-9]{64}$/);
      expect(mockPrismaClient.session.create).toHaveBeenCalled();
      expect(mockRedis.set).toHaveBeenCalled();
    });
  });

  describe("getSession", () => {
    it("returns null when no session cookie", async () => {
      mockCookieStore.get.mockReturnValueOnce(undefined);

      const session = await getSession();
      expect(session).toBeNull();
    });

    it("returns user from Redis cache when available", async () => {
      const mockUser = { id: "user-1", email: "user@example.com" };
      mockCookieStore.get.mockReturnValueOnce({ value: "session-token" });
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({ userId: "user-1" }));
      mockPrismaClient.user.findUnique.mockResolvedValueOnce(mockUser);

      const session = await getSession();
      expect(session?.user).toEqual(mockUser);
    });

    it("falls back to DB when Redis misses", async () => {
      const mockUser = { id: "user-1", email: "user@example.com" };
      mockCookieStore.get.mockReturnValueOnce({ value: "session-token" });
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrismaClient.session.findUnique.mockResolvedValueOnce({
        id: "session-id",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 86400000),
        user: mockUser,
      });

      const session = await getSession();
      expect(session?.user).toEqual(mockUser);
      // Should re-cache in Redis
      expect(mockRedis.set).toHaveBeenCalled();
    });

    it("deletes expired sessions", async () => {
      mockCookieStore.get.mockReturnValueOnce({ value: "session-token" });
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrismaClient.session.findUnique.mockResolvedValueOnce({
        id: "session-id",
        userId: "user-1",
        expiresAt: new Date(Date.now() - 1000), // expired
        user: { id: "user-1" },
      });

      const session = await getSession();
      expect(session).toBeNull();
      expect(mockPrismaClient.session.delete).toHaveBeenCalledWith({
        where: { id: "session-id" },
      });
    });
  });

  describe("destroySession", () => {
    it("deletes session from DB, Redis, and clears cookie", async () => {
      mockCookieStore.get.mockReturnValueOnce({ value: "session-token" });
      mockPrismaClient.session.deleteMany.mockResolvedValueOnce({});

      await destroySession();

      expect(mockPrismaClient.session.deleteMany).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalled();
      expect(mockCookieStore.delete).toHaveBeenCalled();
    });

    it("handles case with no session cookie gracefully", async () => {
      mockCookieStore.get.mockReturnValueOnce(undefined);

      await destroySession();

      expect(mockPrismaClient.session.deleteMany).not.toHaveBeenCalled();
      expect(mockCookieStore.delete).toHaveBeenCalled();
    });
  });

  // ============================================================
  // Authorization helpers
  // ============================================================

  describe("requireAuth", () => {
    it("throws AuthError when not authenticated", async () => {
      mockCookieStore.get.mockReturnValueOnce(undefined);

      await expect(requireAuth()).rejects.toThrow(AuthError);
    });

    it("returns user when authenticated", async () => {
      const mockUser = { id: "user-1", email: "user@example.com", role: "READER" };
      mockCookieStore.get.mockReturnValueOnce({ value: "session-token" });
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({ userId: "user-1" }));
      mockPrismaClient.user.findUnique.mockResolvedValueOnce(mockUser);

      const user = await requireAuth();
      expect(user.id).toBe("user-1");
    });
  });

  describe("requireRole", () => {
    it("throws when user doesn't have required role", async () => {
      const mockUser = { id: "user-1", email: "user@example.com", role: "READER" };
      mockCookieStore.get.mockReturnValueOnce({ value: "session-token" });
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({ userId: "user-1" }));
      mockPrismaClient.user.findUnique.mockResolvedValueOnce(mockUser);

      await expect(requireRole("JOURNALIST" as any)).rejects.toThrow(AuthError);
    });

    it("allows admin to bypass role check", async () => {
      const mockUser = { id: "admin-1", email: "admin@example.com", role: "ADMIN" };
      mockCookieStore.get.mockReturnValueOnce({ value: "session-token" });
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({ userId: "admin-1" }));
      mockPrismaClient.user.findUnique.mockResolvedValueOnce(mockUser);

      const user = await requireRole("JOURNALIST" as any);
      expect(user.role).toBe("ADMIN");
    });
  });

  // ============================================================
  // AuthError
  // ============================================================

  describe("AuthError", () => {
    it("has correct name and status code", () => {
      const error = new AuthError("test", 403);
      expect(error.name).toBe("AuthError");
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe("test");
    });

    it("defaults to 401 status code", () => {
      const error = new AuthError("unauthorized");
      expect(error.statusCode).toBe(401);
    });
  });
});
