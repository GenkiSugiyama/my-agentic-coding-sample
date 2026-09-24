import type { HealthResponse } from "@workspace/shared";
import { Hono } from "hono";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";

export function createApp() {
  const app = new Hono();

  app.use("*", requestId());
  app.use(
    "*",
    secureHeaders({
      contentSecurityPolicy: {
        defaultSrc: ["'self'"],
      },
    }),
  );

  app.get("/api/health", (context) => {
    const response: HealthResponse = { status: "ok" };
    return context.json(response);
  });

  app.notFound((context) => context.json({ error: "Not Found" }, 404));

  app.onError((_error, context) =>
    context.json({ error: "Internal Server Error" }, 500),
  );

  return app;
}

export const app = createApp();
