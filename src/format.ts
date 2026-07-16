import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { WebAccessAggregatedResult, WebAccessBenchmarkResult } from "./types.js";

export interface ProviderRun {
  provider: string;
  result: WebAccessBenchmarkResult;
}

const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;
const secs = (ms: number): string => `${(ms / 1000).toFixed(2)}s`;
const P75 = 0.75;
export const NO_SUCCESSFUL_PROVIDER_LATENCY_MS = 90_000;

function nearestRank(values: readonly number[], percentile: number): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * percentile) - 1];
}

function successfulLatencyMs(result: WebAccessAggregatedResult): number | undefined {
  return nearestRank(
    result.attempts.filter((attempt) => attempt.success).map((attempt) => attempt.latencyMs),
    P75
  );
}

function successfulLatenciesByTest(results: readonly WebAccessBenchmarkResult[]): Map<string, number[]> {
  return results.flatMap((result) => result.results).reduce((latenciesByTest, result) => {
    const latency = successfulLatencyMs(result);
    if (latency === undefined) return latenciesByTest;
    const latencies = latenciesByTest.get(result.testName) ?? [];
    latencies.push(latency);
    latenciesByTest.set(result.testName, latencies);
    return latenciesByTest;
  }, new Map<string, number[]>());
}

export type ResolvedLatencySource = "successful attempts" | "successful providers" | "timeout";

export interface ResolvedLatency {
  latencyMs: number;
  source: ResolvedLatencySource;
}

export function resolveComparisonLatency(
  result: WebAccessAggregatedResult,
  peerSuccessfulLatencies: readonly number[] = [],
  noSuccessfulProviderLatencyMs = NO_SUCCESSFUL_PROVIDER_LATENCY_MS
): ResolvedLatency {
  const successfulLatency = successfulLatencyMs(result);
  if (successfulLatency !== undefined) return { latencyMs: successfulLatency, source: "successful attempts" };

  const peerLatency = nearestRank(peerSuccessfulLatencies, P75);
  if (peerLatency !== undefined) return { latencyMs: peerLatency, source: "successful providers" };

  return { latencyMs: noSuccessfulProviderLatencyMs, source: "timeout" };
}

export function comparisonLatencyMs(
  result: WebAccessAggregatedResult,
  peerSuccessfulLatencies: readonly number[] = [],
  noSuccessfulProviderLatencyMs = NO_SUCCESSFUL_PROVIDER_LATENCY_MS
): number {
  return resolveComparisonLatency(result, peerSuccessfulLatencies, noSuccessfulProviderLatencyMs).latencyMs;
}

export function comparisonAverageLatencyMs(
  result: WebAccessBenchmarkResult,
  comparisonResults: readonly WebAccessBenchmarkResult[] = [result],
  noSuccessfulProviderLatencyMs = NO_SUCCESSFUL_PROVIDER_LATENCY_MS
): number {
  const latenciesByTest = successfulLatenciesByTest(comparisonResults);
  const latencies = result.results.map((target) =>
    comparisonLatencyMs(target, latenciesByTest.get(target.testName), noSuccessfulProviderLatencyMs)
  );
  return latencies.reduce((sum, latency) => sum + latency, 0) / Math.max(latencies.length, 1);
}

function padRow(cells: string[], widths: number[]): string {
  return cells.map((c, i) => c.padEnd(widths[i])).join(" | ");
}

/** Leaderboard across providers, sorted by overall success rate. */
export function formatComparisonTable(runs: ProviderRun[], noSuccessfulProviderLatencyMs = NO_SUCCESSFUL_PROVIDER_LATENCY_MS): string {
  const header = ["Provider", "Success Rate", "Latency Score", "Requests"];
  const comparisonResults = runs.map((run) => run.result);
  const rows = [...runs]
    .sort((a, b) => b.result.overallSuccessRate - a.result.overallSuccessRate)
    .map((r) => {
      const avgLatency = comparisonAverageLatencyMs(r.result, comparisonResults, noSuccessfulProviderLatencyMs);
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
export function formatProviderSummary(
  run: ProviderRun,
  comparisonResults: readonly WebAccessBenchmarkResult[] = [run.result],
  noSuccessfulProviderLatencyMs = NO_SUCCESSFUL_PROVIDER_LATENCY_MS
): string {
  const latenciesByTest = successfulLatenciesByTest(comparisonResults);
  const lines = [
    `\n${run.provider} — ${pct(run.result.overallSuccessRate)} over ${run.result.totalRequests} requests`,
    `  ${"Success".padStart(6)}  ${"Resolved latency".padStart(16)}  ${"Source".padEnd(20)}  Target`
  ];
  for (const test of [...run.result.results].sort((a, b) => b.successRate - a.successRate)) {
    const errs = test.errors.length ? `  [${test.errors.join("; ")}]` : "";
    const resolvedLatency = resolveComparisonLatency(test, latenciesByTest.get(test.testName), noSuccessfulProviderLatencyMs);
    lines.push(
      `  ${pct(test.successRate).padStart(6)}  ${secs(resolvedLatency.latencyMs).padStart(16)}  ${resolvedLatency.source.padEnd(20)}  ${test.testName}${errs}`
    );
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
