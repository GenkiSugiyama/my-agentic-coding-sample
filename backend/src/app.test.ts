import { healthResponseSchema } from "@workspace/shared";
import { describe, expect, it } from "vitest";
import { app, createApp } from "./app.ts";

describe("GET /api/health", () => {
  it("returns a schema-valid healthy response", async () => {
    const response = await app.request("/api/health");
    expect(response.status).toBe(200);
    expect(healthResponseSchema.parse(await response.json())).toEqual({
      status: "ok",
    });
  });

  it("adds defensive response headers and a request ID", async () => {
    const response = await app.request("/api/health");

    expect(response.headers.get("content-security-policy")).toContain(
      "default-src 'self'",
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(response.headers.get("x-request-id")).toMatch(/^[\w-]+$/);
  });
});

describe("unsupported API requests", () => {
  it("does not expose internal error details", async () => {
    const isolatedApp = createApp();
    isolatedApp.get("/api/error-test", () => {
      throw new Error("sensitive internal detail");
    });

    const response = await isolatedApp.request("/api/error-test");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal Server Error" });
  });

  it.each([
    ["POST", "/api/health"],
    ["GET", "/api/missing"],
  ])("returns a generic JSON 404 for %s %s", async (method, path) => {
    const response = await app.request(path, { method });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not Found" });
    expect(response.headers.get("x-request-id")).toMatch(/^[\w-]+$/);
  });
});
