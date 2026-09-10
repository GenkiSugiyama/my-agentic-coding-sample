import type { HealthResponse } from "@workspace/shared";
import { Hono } from "hono";

export const app = new Hono();

app.get("/api/health", (context) => {
  const response: HealthResponse = { status: "ok" };
  return context.json(response);
});
