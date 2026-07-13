import { validateResponse } from "./check.js";
import type {
  AttemptResult,
  Provider,
  RequestExecutorFn,
  WebAccessAggregatedResult,
  WebAccessBenchmarkConfig,
  WebAccessBenchmarkResult,
  WebAccessTestConfig
} from "./types.js";

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

interface TestAttemptTask {
  test: WebAccessTestConfig;
  attemptIndex: number;
}

/** Wraps a provider's fetch in the shared timeout / latency / validation harness. */
export function makeExecutor(provider: Provider): RequestExecutorFn {
  return async (test, timeoutMs) => {
    const startTime = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const { body, statusCode } = await provider.fetch(test.url, { timeoutMs, signal: controller.signal });
      return validateResponse(body, statusCode, Date.now() - startTime, test.containsText);
    } catch (error) {
      return {
        success: false,
        latencyMs: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    } finally {
      clearTimeout(timer);
    }
  };
}

/** Limits parallel requests to avoid overwhelming target servers and getting rate-limited */
async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  delayMs: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const currentIndex = index++;
      const item = items[currentIndex];
      if (delayMs > 0) await sleep(delayMs);
      const result = await fn(item);
      results.push(result);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

/** Consolidates per-attempt data into a single result per test for easier comparison */
function aggregateTestResults(test: WebAccessTestConfig, attempts: AttemptResult[]): WebAccessAggregatedResult {
  const successCount = attempts.filter((a) => a.success).length;
  const latencies = attempts.map((a) => a.latencyMs);
  const errors = [...new Set(attempts.filter((a) => a.errorMessage).map((a) => a.errorMessage!))];

  return {
    testName: test.name,
    url: test.url,
    totalAttempts: attempts.length,
    successCount,
    successRate: successCount / attempts.length,
    avgLatencyMs: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    minLatencyMs: Math.min(...latencies),
    maxLatencyMs: Math.max(...latencies),
    errors,
    attempts
  };
}

/** Generic entry point for benchmarking web access APIs across test URLs */
export async function runWebAccessBenchmarkSuite(
  tests: WebAccessTestConfig[],
  executeRequest: RequestExecutorFn,
  config: WebAccessBenchmarkConfig,
  label: string
): Promise<WebAccessBenchmarkResult> {
  const startTime = Date.now();
  const { attemptsPerTest, timeoutMs, concurrency, delayBetweenRequestsMs } = config;
  const testArray = Array.isArray(tests) ? tests : [];

  console.log(
    `Starting ${label} benchmark — ${testArray.length} tests × ${attemptsPerTest} attempts (concurrency ${concurrency}, timeout ${timeoutMs}ms)`
  );

  const tasks: TestAttemptTask[] = testArray.flatMap((test) =>
    Array.from({ length: attemptsPerTest }, (_, i) => ({ test, attemptIndex: i }))
  );

  const resultsByTest = new Map<string, AttemptResult[]>();
  for (const test of testArray) {
    resultsByTest.set(test.name, []);
  }

  await runWithConcurrency(tasks, concurrency, delayBetweenRequestsMs, async (task) => {
    const result = await executeRequest(task.test, timeoutMs);
    resultsByTest.get(task.test.name)!.push(result);
    const status = result.success ? "✓" : "✗";
    const detail = result.errorMessage ? ` (${result.errorMessage})` : "";
    console.log(`  ${status} ${label}/${task.test.name} #${task.attemptIndex + 1} ${result.latencyMs}ms${detail}`);
    return result;
  });

  const aggregatedResults: WebAccessAggregatedResult[] = [];
  let totalSuccesses = 0;
  let totalRequests = 0;

  for (const test of testArray) {
    const attempts = resultsByTest.get(test.name)!;
    const aggregated = aggregateTestResults(test, attempts);
    aggregatedResults.push(aggregated);
    totalSuccesses += aggregated.successCount;
    totalRequests += aggregated.totalAttempts;
  }

  return {
    durationMs: Date.now() - startTime,
    totalRequests,
    successfulRequests: totalSuccesses,
    overallSuccessRate: totalRequests > 0 ? totalSuccesses / totalRequests : 0,
    results: aggregatedResults
  };
}
