import { cookies } from "next/headers";
import { db } from "./db";
import { redis } from "./redis";
import { randomBytes, createHash } from "crypto";
import type { User, UserRole } from "@prisma/client";

const SESSION_COOKIE = "warrant_session";
const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
const MAGIC_LINK_TTL = 15 * 60; // 15 minutes

// ============================================================
// Token generation
// ============================================================

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// ============================================================
// Magic Link
// ============================================================

export async function createMagicLink(email: string): Promise<string> {
  // Find or create user
  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    user = await db.user.create({
      data: {
        email,
        displayName: email.split("@")[0],
      },
    });
  }

  // Generate token
  const token = generateToken();
  const hashedToken = hashToken(token);

  // Store magic link
  await db.magicLink.create({
    data: {
      userId: user.id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + MAGIC_LINK_TTL * 1000),
    },
  });

  return token;
}

export async function verifyMagicLink(
  token: string
): Promise<User | null> {
  const hashedToken = hashToken(token);

  const magicLink = await db.magicLink.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!magicLink) return null;
  if (magicLink.used) return null;
  if (magicLink.expiresAt < new Date()) return null;

  // Mark as used
  await db.magicLink.update({
    where: { id: magicLink.id },
    data: { used: true },
  });

  // Mark email as verified
  if (!magicLink.user.emailVerified) {
    await db.user.update({
      where: { id: magicLink.user.id },
      data: { emailVerified: true },
    });
  }

  return magicLink.user;
}

// ============================================================
// Sessions
// ============================================================

export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const token = generateToken();
  const hashedToken = hashToken(token);

  await db.session.create({
    data: {
      userId,
      token: hashedToken,
      expiresAt: new Date(Date.now() + SESSION_TTL * 1000),
      ipAddress,
      userAgent,
    },
  });

  // Also cache in Redis for fast lookups (non-critical — getSession falls back to DB)
  try {
    await redis.set(
      `session:${hashedToken}`,
      JSON.stringify({ userId }),
      "EX",
      SESSION_TTL
    );
  } catch (err) {
    console.warn("Failed to cache session in Redis:", err);
  }

  return token;
}

export async function getSession(): Promise<{
  user: User;
  sessionId: string;
} | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionToken) return null;

  const hashedToken = hashToken(sessionToken);

  // Try Redis first
  try {
    const cached = await redis.get(`session:${hashedToken}`);
    if (cached) {
      const { userId } = JSON.parse(cached);
      const user = await db.user.findUnique({ where: { id: userId } });
      if (user) {
        return { user, sessionId: hashedToken };
      }
    }
  } catch {
    // Fall through to DB
  }

  // Fall back to DB
  const session = await db.session.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }

  // Re-cache in Redis (non-critical — session already validated from DB)
  try {
    await redis.set(
      `session:${hashedToken}`,
      JSON.stringify({ userId: session.userId }),
      "EX",
      SESSION_TTL
    );
  } catch (err) {
    console.warn("Failed to re-cache session in Redis:", err);
  }

  return { user: session.user, sessionId: session.id };
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionToken) {
    const hashedToken = hashToken(sessionToken);
    await db.session.deleteMany({ where: { token: hashedToken } });
    try {
      await redis.del(`session:${hashedToken}`);
    } catch (err) {
      console.warn("Failed to remove session from Redis:", err);
    }
  }

  cookieStore.delete(SESSION_COOKIE);
}

// ============================================================
// Authorization helpers
// ============================================================

export async function requireAuth(): Promise<User> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Authentication required", 401);
  }
  return session.user;
}

export async function requireRole(role: UserRole): Promise<User> {
  const user = await requireAuth();
  if (user.role !== role && user.role !== "ADMIN") {
    throw new AuthError("Insufficient permissions", 403);
  }
  return user;
}

export async function requireJournalist(): Promise<User> {
  return requireRole("JOURNALIST");
}

export async function requireAdmin(): Promise<User> {
  return requireRole("ADMIN");
}

export class AuthError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}
