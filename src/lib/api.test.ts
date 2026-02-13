import { describe, it, expect } from "vitest";
import { ZodError } from "zod";
import {
  successResponse,
  errorResponse,
  handleApiError,
  getIpAddress,
  getUserAgent,
} from "./api";
import { AuthError } from "./auth";

describe("API Helpers", () => {
  describe("successResponse", () => {
    it("returns JSON response with success: true", async () => {
      const response = successResponse({ message: "ok" });
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual({ message: "ok" });
      expect(response.status).toBe(200);
    });

    it("supports custom status codes", async () => {
      const response = successResponse({ id: "123" }, 201);
      expect(response.status).toBe(201);
    });
  });

  describe("errorResponse", () => {
    it("returns JSON response with success: false", async () => {
      const response = errorResponse("Something went wrong", 400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Something went wrong");
      expect(response.status).toBe(400);
    });

    it("defaults to 400 status", async () => {
      const response = errorResponse("Bad request");
      expect(response.status).toBe(400);
    });
  });

  describe("handleApiError", () => {
    it("handles AuthError with correct status code", async () => {
      const response = handleApiError(new AuthError("Not authorized", 403));
      const body = await response.json();
      expect(body.error).toBe("Not authorized");
      expect(response.status).toBe(403);
    });

    it("handles ZodError with validation messages", async () => {
      const zodError = new ZodError([]);
      zodError.addIssue({
        code: "invalid_type" as any,
        expected: "string",
        received: "number",
        path: ["email"],
        message: "Expected string, got number",
      });

      const response = handleApiError(zodError);
      const body = await response.json();
      expect(body.error).toContain("Expected string, got number");
      expect(response.status).toBe(400);
    });

    it("handles generic Error", async () => {
      process.env.NODE_ENV = "development";
      const response = handleApiError(new Error("Something broke"));
      const body = await response.json();
      expect(body.error).toBe("Something broke");
      expect(response.status).toBe(500);
    });

    it("hides error details in production", async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      const response = handleApiError(new Error("Internal detail"));
      const body = await response.json();
      expect(body.error).toBe("Internal server error");
      process.env.NODE_ENV = origEnv;
    });

    it("handles unknown error types", async () => {
      const response = handleApiError("string error");
      const body = await response.json();
      expect(body.error).toBe("Internal server error");
      expect(response.status).toBe(500);
    });
  });

  describe("getIpAddress", () => {
    it("extracts IP from x-forwarded-for header", () => {
      const request = new Request("http://localhost", {
        headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
      });
      expect(getIpAddress(request)).toBe("1.2.3.4");
    });

    it("returns undefined when no forwarded header", () => {
      const request = new Request("http://localhost");
      expect(getIpAddress(request)).toBeUndefined();
    });
  });

  describe("getUserAgent", () => {
    it("extracts user agent header", () => {
      const request = new Request("http://localhost", {
        headers: { "user-agent": "Mozilla/5.0" },
      });
      expect(getUserAgent(request)).toBe("Mozilla/5.0");
    });

    it("returns undefined when no user agent", () => {
      const request = new Request("http://localhost");
      expect(getUserAgent(request)).toBeUndefined();
    });
  });
});
