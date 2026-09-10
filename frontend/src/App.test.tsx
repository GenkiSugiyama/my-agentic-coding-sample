import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App.tsx";

describe("App", () => {
  afterEach(() => vi.restoreAllMocks());

  it("shows loading and then the healthy status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeResponse({ status: "ok" }),
    );
    render(<App />);
    expect(screen.getByText("確認中…")).toBeInTheDocument();
    expect(await screen.findByText("正常稼働中")).toBeInTheDocument();
  });

  it("shows an error when the API response is invalid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      makeResponse({ status: "down" }),
    );
    render(<App />);
    expect(
      await screen.findByText("APIに接続できませんでした"),
    ).toBeInTheDocument();
  });
});

function makeResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}
