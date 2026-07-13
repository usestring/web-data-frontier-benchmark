import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { WebAccessBenchmarkResult } from "./types.js";

export interface ProviderRun {
  provider: string;
  result: WebAccessBenchmarkResult;
}

const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;
const secs = (ms: number): string => `${(ms / 1000).toFixed(2)}s`;

function padRow(cells: string[], widths: number[]): string {
  return cells.map((c, i) => c.padEnd(widths[i])).join(" | ");
}

/** Leaderboard across providers, sorted by overall success rate. */
export function formatComparisonTable(runs: ProviderRun[]): string {
  const header = ["Provider", "Success Rate", "Avg Latency", "Requests"];
  const rows = [...runs]
    .sort((a, b) => b.result.overallSuccessRate - a.result.overallSuccessRate)
    .map((r) => {
      const avgLatency =
        r.result.results.reduce((sum, t) => sum + t.avgLatencyMs, 0) / Math.max(r.result.results.length, 1);
      return [
        r.provider,
        pct(r.result.overallSuccessRate),
        secs(avgLatency),
        `${r.result.successfulRequests}/${r.result.totalRequests}`
      ];
    });

  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((row) => row[i].length)));
  const divider = widths.map((w) => "-".repeat(w)).join("-+-");
  return [padRow(header, widths), divider, ...rows.map((row) => padRow(row, widths))].join("\n");
}

/** Per-test breakdown for a single provider. */
export function formatProviderSummary(run: ProviderRun): string {
  const lines = [`\n${run.provider} — ${pct(run.result.overallSuccessRate)} over ${run.result.totalRequests} requests`];
  for (const test of [...run.result.results].sort((a, b) => b.successRate - a.successRate)) {
    const errs = test.errors.length ? `  [${test.errors.join("; ")}]` : "";
    lines.push(`  ${pct(test.successRate).padStart(6)}  ${secs(test.avgLatencyMs).padStart(7)}  ${test.testName}${errs}`);
  }
  return lines.join("\n");
}

/** Persist the full structured results (every attempt) for later analysis. */
export function saveResultsJSON(runs: ProviderRun[], outPath: string): void {
  mkdirSync(dirname(outPath), { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    providers: runs.map((r) => ({ provider: r.provider, ...r.result }))
  };
  writeFileSync(outPath, JSON.stringify(payload, null, 2));
}
