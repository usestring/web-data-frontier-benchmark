import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import test from "node:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  comparisonAverageLatencyMs,
  comparisonLatencyMs,
  formatComparisonReport,
  formatProviderSummary,
  NO_SUCCESSFUL_PROVIDER_LATENCY_MS,
  resolveComparisonLatency,
  saveComparisonReport
} from "./format.js";
import type { AttemptResult, WebAccessAggregatedResult, WebAccessBenchmarkResult } from "./types.js";

function target(testName: string, attempts: AttemptResult[]): WebAccessAggregatedResult {
  const latencies = attempts.map((attempt) => attempt.latencyMs);
  const successCount = attempts.filter((attempt) => attempt.success).length;
  return {
    testName,
    url: `https://${testName}.example`,
    totalAttempts: attempts.length,
    successCount,
    successRate: successCount / attempts.length,
    avgLatencyMs: latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length,
    minLatencyMs: Math.min(...latencies),
    maxLatencyMs: Math.max(...latencies),
    errors: [],
    attempts
  };
}

function run(...results: WebAccessAggregatedResult[]): WebAccessBenchmarkResult {
  const totalRequests = results.reduce((sum, result) => sum + result.totalAttempts, 0);
  const successfulRequests = results.reduce((sum, result) => sum + result.successCount, 0);
  return {
    durationMs: 0,
    totalRequests,
    successfulRequests,
    overallSuccessRate: successfulRequests / totalRequests,
    results
  };
}

test("uses nearest-rank p75 over successful attempts", () => {
  const result = target("partial", [
    { success: false, latencyMs: 1 },
    { success: true, latencyMs: 100 },
    { success: true, latencyMs: 200 }
  ]);

  assert.equal(comparisonLatencyMs(result), 200);
});

test("uses the successful providers on a target for a total failure", () => {
  const failed = run(target("shared", [{ success: false, latencyMs: 1 }]));
  const firstSuccess = run(target("shared", [{ success: true, latencyMs: 100 }, { success: true, latencyMs: 200 }]));
  const secondSuccess = run(target("shared", [{ success: true, latencyMs: 300 }]));

  assert.equal(comparisonAverageLatencyMs(failed, [failed, firstSuccess, secondSuccess]), 300);
});

test("uses the benchmark timeout when no provider succeeds", () => {
  const failed = target("unsolved", [{ success: false, latencyMs: 1 }]);

  assert.equal(comparisonLatencyMs(failed), NO_SUCCESSFUL_PROVIDER_LATENCY_MS);
});

test("shows the resolved latency and its source in each target row", () => {
  const failed = run(target("shared", [{ success: false, latencyMs: 1 }]));
  const firstSuccess = run(target("shared", [{ success: true, latencyMs: 100 }, { success: true, latencyMs: 200 }]));
  const secondSuccess = run(target("shared", [{ success: true, latencyMs: 300 }]));
  const resolvedLatency = resolveComparisonLatency(failed.results[0], [200, 300]);
  const summary = formatProviderSummary({ provider: "failed", result: failed }, [failed, firstSuccess, secondSuccess]);

  assert.deepEqual(resolvedLatency, { latencyMs: 300, source: "successful providers" });
  assert.match(summary, /Resolved latency/);
  assert.match(summary, /0\.30s\s+successful providers\s+shared/);
});

test("writes the formatted comparison report", () => {
  const directory = mkdtempSync(join(tmpdir(), "web-data-frontier-benchmark-"));
  const outPath = join(directory, "reports", "comparison.txt");
  const result = run(target("passed", [{ success: true, latencyMs: 100 }]));
  const report = formatComparisonReport([{ provider: "provider", result }]);

  try {
    saveComparisonReport(report, outPath);
    assert.equal(readFileSync(outPath, "utf8"), report);
    assert.match(report, /Provider/);
    assert.match(report, /successful attempts/);
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
});
