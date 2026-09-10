import { describe, expect, it } from "vitest";
import { healthResponseSchema } from "./index.ts";

describe("healthResponseSchema", () => {
  it("accepts the public health response", () => {
    expect(healthResponseSchema.parse({ status: "ok" })).toEqual({
      status: "ok",
    });
  });

  it("rejects an unknown health status", () => {
    expect(() => healthResponseSchema.parse({ status: "down" })).toThrow();
  });
});
