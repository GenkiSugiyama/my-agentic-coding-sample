import { healthResponseSchema } from "@workspace/shared";
import { describe, expect, it } from "vitest";
import { app } from "./app.ts";

describe("GET /api/health", () => {
  it("returns a schema-valid healthy response", async () => {
    const response = await app.request("/api/health");
    expect(response.status).toBe(200);
    expect(healthResponseSchema.parse(await response.json())).toEqual({
      status: "ok",
    });
  });
});
