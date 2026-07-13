import "dotenv/config";
import { join } from "node:path";
import { formatComparisonTable, formatProviderSummary, saveResultsJSON, type ProviderRun } from "./format.js";
import { PROVIDERS } from "./providers/index.js";
import { makeExecutor, runWebAccessBenchmarkSuite } from "./runner.js";
import { WEB_ACCESS_ALL_TESTS, WEB_ACCESS_BENCHMARK_CONFIG } from "./tests.const.js";
import type { Provider, WebAccessBenchmarkConfig, WebAccessTestConfig } from "./types.js";

interface CliOptions {
  providers?: string[];
  tests?: string[];
  attempts?: number;
  concurrency?: number;
  providerConcurrency?: number;
  out?: string;
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
  --tests <a,b>        Only run these test fixtures by name (default: all)
  --attempts <n>       Attempts per test (default: ${WEB_ACCESS_BENCHMARK_CONFIG.attemptsPerTest})
  --concurrency <n>    Parallel requests per provider (default: ${WEB_ACCESS_BENCHMARK_CONFIG.concurrency})
  --provider-concurrency <n>  Providers to benchmark at once (default: ${WEB_ACCESS_BENCHMARK_CONFIG.providerConcurrency})
  --out <file>         Results JSON path (default: results/benchmark-<timestamp>.json)
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

function selectTests(opts: CliOptions): WebAccessTestConfig[] {
  if (!opts.tests) return WEB_ACCESS_ALL_TESTS;
  const wanted = new Set(opts.tests.map((t) => t.toLowerCase()));
  return WEB_ACCESS_ALL_TESTS.filter((t) => wanted.has(t.name.toLowerCase()));
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(HELP);
    return;
  }

  const { active, skipped } = selectProviders(opts);
  const tests = selectTests(opts);

  const config: WebAccessBenchmarkConfig = {
    ...WEB_ACCESS_BENCHMARK_CONFIG,
    ...(opts.attempts ? { attemptsPerTest: opts.attempts } : {}),
    ...(opts.concurrency ? { concurrency: opts.concurrency } : {}),
    ...(opts.providerConcurrency ? { providerConcurrency: opts.providerConcurrency } : {})
  };

  console.log(`\nActive providers (${active.length}): ${active.map((p) => p.name).join(", ") || "none"}`);
  if (skipped.length) console.log(`Skipped: ${skipped.join(", ")}`);
  console.log(
    `Tests: ${tests.length} | attempts: ${config.attemptsPerTest} | concurrency: ${config.concurrency} | provider-concurrency: ${config.providerConcurrency}\n`
  );

  if (active.length === 0) {
    console.error("No active providers — set at least one provider's API key in .env. See --help.");
    process.exitCode = 1;
    return;
  }
  if (tests.length === 0) {
    console.error("No matching tests — check --tests names against .env.example / tests.const.ts.");
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

  console.log("\n=== Comparison ===");
  console.log(formatComparisonTable(runs));
  for (const run of runs) console.log(formatProviderSummary(run));

  const outPath = opts.out ?? join("results", `benchmark-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  saveResultsJSON(runs, outPath);
  console.log(`\nSaved results to ${outPath}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.stack : String(e));
  process.exitCode = 1;
});
