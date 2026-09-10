import { healthResponseSchema } from "@workspace/shared";
import { useEffect, useState } from "react";

type HealthState = "loading" | "healthy" | "error";

export default function App() {
  const [health, setHealth] = useState<HealthState>("loading");

  useEffect(() => {
    let active = true;

    async function checkHealth() {
      try {
        const response = await fetch("/api/health");
        if (!response.ok)
          throw new Error(`Unexpected status: ${response.status}`);
        healthResponseSchema.parse(await response.json());
        if (active) setHealth("healthy");
      } catch {
        if (active) setHealth("error");
      }
    }

    void checkHealth();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <section className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-10 shadow-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
          npm workspaces
        </p>
        <h1 className="text-4xl font-bold tracking-tight">Workspace Health</h1>
        <div
          className="mt-8 flex items-center gap-3 rounded-2xl bg-slate-800 p-5"
          aria-live="polite"
        >
          <span
            className={`h-3 w-3 rounded-full ${health === "healthy" ? "bg-emerald-400" : health === "error" ? "bg-rose-400" : "animate-pulse bg-amber-300"}`}
          />
          <span className="font-medium">
            {health === "loading" && "確認中…"}
            {health === "healthy" && "正常稼働中"}
            {health === "error" && "APIに接続できませんでした"}
          </span>
        </div>
      </section>
    </main>
  );
}
