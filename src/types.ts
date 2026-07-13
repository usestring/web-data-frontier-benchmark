/** A web access / scrape API provider the benchmark can exercise. */
export interface Provider {
  /** Short identifier, used on the CLI (`--providers`) and in output. */
  name: string;
  /** Env vars that must all be present for the provider to be considered active. */
  envKeys: string[];
  /** Fetch the URL through the provider and return its raw body + the upstream status code. */
  fetch(url: string, opts: ProviderFetchOptions): Promise<ProviderFetchResult>;
}

export interface ProviderFetchOptions {
  timeoutMs: number;
  signal: AbortSignal;
}

export interface ProviderFetchResult {
  body: string;
  statusCode: number;
}

/** Test configuration for web access benchmarks */
export interface WebAccessTestConfig {
  name: string;
  url: string;
  /** Text that must appear in the response body for success */
  containsText?: string;
}

/** Result of a single benchmark attempt */
export interface AttemptResult {
  success: boolean;
  latencyMs: number;
  errorMessage?: string;
}

/** Aggregated results for a web access test */
export interface WebAccessAggregatedResult {
  testName: string;
  url: string;
  totalAttempts: number;
  successCount: number;
  successRate: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  errors: string[];
  attempts: AttemptResult[];
}

/** Full web access benchmark suite results */
export interface WebAccessBenchmarkResult {
  durationMs: number;
  totalRequests: number;
  successfulRequests: number;
  overallSuccessRate: number;
  results: WebAccessAggregatedResult[];
}

/** Benchmark suite configuration */
export interface WebAccessBenchmarkConfig {
  attemptsPerTest: number;
  timeoutMs: number;
  /** Parallel requests made within a single provider's run. */
  concurrency: number;
  /** How many providers to benchmark simultaneously. */
  providerConcurrency: number;
  delayBetweenRequestsMs: number;
}

/** Function that executes a single request and returns the result */
export type RequestExecutorFn = (test: WebAccessTestConfig, timeoutMs: number) => Promise<AttemptResult>;
