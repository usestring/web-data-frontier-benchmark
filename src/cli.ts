import "dotenv/config";
import { extname, join } from "node:path";
import { formatComparisonReport, saveComparisonReport, saveResultsJSON, type ProviderRun } from "./format.js";
import { PROVIDERS } from "./providers/index.js";
import { makeExecutor, runWebAccessBenchmarkSuite } from "./runner.js";
import { WEB_ACCESS_BENCHMARK_CONFIG, WEB_ACCESS_SUITES } from "./tests.const.js";
import type { Provider, WebAccessBenchmarkConfig, WebAccessTestConfig } from "./types.js";

const DEFAULT_SUITE = "default";

interface CliOptions {
  providers?: string[];
  suite?: string;
  tests?: string[];
  attempts?: number;
  concurrency?: number;
  providerConcurrency?: number;
  out?: string;
  reportOut?: string;
  help: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = (): string => argv[++i];
    switch (arg) {
      case "--providers":
        opts.providers = next().split(",").map((s) => s.trim()).filter(Boolean);
        break;
      case "--suite":
        opts.suite = next().trim();
        break;
      case "--tests":
        opts.tests = next().split(",").map((s) => s.trim()).filter(Boolean);
        break;
      case "--attempts":
        opts.attempts = Number.parseInt(next(), 10);
        break;
      case "--concurrency":
        opts.concurrency = Number.parseInt(next(), 10);
        break;
      case "--provider-concurrency":
        opts.providerConcurrency = Number.parseInt(next(), 10);
        break;
      case "--out":
        opts.out = next();
        break;
      case "--report-out":
        opts.reportOut = next();
        break;
      case "-h":
      case "--help":
        opts.help = true;
        break;
      default:
        console.warn(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

const HELP = `
Web Data Frontier Benchmark — compare web access / scrape APIs against a fixed test suite.

Usage:
  npm run benchmark -- [options]      (Node)
  bun run src/cli.ts [options]        (Bun)

Options:
  --providers <a,b>    Only run these providers (default: all with keys set)
  --suite <name>       Target suite to draw from: ${Object.keys(WEB_ACCESS_SUITES).join(", ")} (default: ${DEFAULT_SUITE})
  --tests <a,b>        Only run these test fixtures by name (default: all in the suite)
  --attempts <n>       Attempts per test (default: ${WEB_ACCESS_BENCHMARK_CONFIG.attemptsPerTest})
  --concurrency <n>    Parallel requests per provider (default: ${WEB_ACCESS_BENCHMARK_CONFIG.concurrency})
  --provider-concurrency <n>  Providers to benchmark at once (default: ${WEB_ACCESS_BENCHMARK_CONFIG.providerConcurrency})
  --out <file>         Results JSON path (default: results/benchmark-<timestamp>.json)
  --report-out <file>  Rendered report path (default: the results path with a .txt extension)
  -h, --help           Show this help

Set provider API keys in a .env file (see .env.example). A provider runs only when all of
its required keys are present.
`;

function selectProviders(opts: CliOptions): { active: Provider[]; skipped: string[] } {
  const requested = opts.providers
    ? PROVIDERS.filter((p) => opts.providers!.some((name) => name.toLowerCase() === p.name.toLowerCase()))
    : PROVIDERS;

  const active: Provider[] = [];
  const skipped: string[] = [];
  for (const provider of requested) {
    const missing = provider.envKeys.filter((k) => !process.env[k]);
    if (missing.length === 0) active.push(provider);
    else skipped.push(`${provider.name} (missing ${missing.join(", ")})`);
  }
  return { active, skipped };
}

function selectTests(suite: WebAccessTestConfig[], opts: CliOptions): WebAccessTestConfig[] {
  if (!opts.tests) return suite;
  const wanted = new Set(opts.tests.map((t) => t.toLowerCase()));
  return suite.filter((t) => wanted.has(t.name.toLowerCase()));
}

function defaultReportPath(resultsPath: string): string {
  const extension = extname(resultsPath);
  return extension ? `${resultsPath.slice(0, -extension.length)}.txt` : `${resultsPath}.txt`;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(HELP);
    return;
  }

  const { active, skipped } = selectProviders(opts);
  const suiteName = opts.suite ?? DEFAULT_SUITE;
  const suite = WEB_ACCESS_SUITES[suiteName];
  if (!suite) {
    console.error(`Unknown suite "${suiteName}" — choose one of: ${Object.keys(WEB_ACCESS_SUITES).join(", ")}`);
    process.exitCode = 1;
    return;
  }
  const tests = selectTests(suite, opts);

  const config: WebAccessBenchmarkConfig = {
    ...WEB_ACCESS_BENCHMARK_CONFIG,
    ...(opts.attempts ? { attemptsPerTest: opts.attempts } : {}),
    ...(opts.concurrency ? { concurrency: opts.concurrency } : {}),
    ...(opts.providerConcurrency ? { providerConcurrency: opts.providerConcurrency } : {})
  };

  console.log(`\nActive providers (${active.length}): ${active.map((p) => p.name).join(", ") || "none"}`);
  if (skipped.length) console.log(`Skipped: ${skipped.join(", ")}`);
  console.log(
    `Suite: ${suiteName} | tests: ${tests.length} | attempts: ${config.attemptsPerTest} | concurrency: ${config.concurrency} | provider-concurrency: ${config.providerConcurrency}\n`
  );

  if (active.length === 0) {
    console.error("No active providers — set at least one provider's API key in .env. See --help.");
    process.exitCode = 1;
    return;
  }
  if (tests.length === 0) {
    console.error("No matching tests — check --tests names against the selected --suite in tests.const.ts.");
    process.exitCode = 1;
    return;
  }

  const runs: ProviderRun[] = new Array(active.length);
  let nextProvider = 0;
  async function providerWorker(): Promise<void> {
    while (nextProvider < active.length) {
      const providerIndex = nextProvider++;
      const provider = active[providerIndex];
      const result = await runWebAccessBenchmarkSuite(tests, makeExecutor(provider), config, provider.name);
      runs[providerIndex] = { provider: provider.name, result };
    }
  }
  const providerWorkers = Math.min(config.providerConcurrency, active.length);
  await Promise.all(Array.from({ length: providerWorkers }, () => providerWorker()));

  const report = formatComparisonReport(runs, config.timeoutMs);
  console.log("\n=== Comparison ===");
  console.log(report);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = opts.out ?? join("results", `benchmark-${timestamp}.json`);
  const reportPath = opts.reportOut ?? defaultReportPath(outPath);
  saveResultsJSON(runs, outPath);
  saveComparisonReport(report, reportPath);
  console.log(`\nSaved results to ${outPath}`);
  console.log(`Saved report to ${reportPath}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.stack : String(e));
  process.exitCode = 1;
});
