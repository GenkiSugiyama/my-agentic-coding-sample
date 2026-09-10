import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["frontend/e2e/**", "**/node_modules/**", "**/dist/**"],
    coverage: {
      exclude: [
        "**/*.config.ts",
        "**/*.d.ts",
        "**/dist/**",
        "**/node_modules/**",
        "backend/src/lambda.ts",
        "backend/src/server.ts",
        "frontend/src/main.tsx",
      ],
      include: [
        "backend/src/**/*.ts",
        "frontend/src/**/*.{ts,tsx}",
        "packages/shared/src/**/*.ts",
        "aws/src/**/*.ts",
      ],
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: { branches: 80, functions: 80, lines: 80, statements: 80 },
    },
    projects: ["packages/shared", "backend", "frontend", "aws"],
  },
});
