import { readFileSync } from "node:fs";
import { join } from "node:path";
import { formatComparisonReport, saveComparisonReport, type ProviderRun } from "./format.js";
import type { WebAccessBenchmarkResult } from "./types.js";

interface CliOptions {
  input?: string;
  out?: string;
  help: boolean;
}

interface ResultsFile {
  providers: Array<{ provider: string } & WebAccessBenchmarkResult>;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = (): string => argv[++i];
    switch (arg) {
      case "--in":
      case "--input":
        opts.input = next();
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
Web Data Frontier Benchmark — recalculate a report from stored benchmark results.

Usage:
  npm run analyze -- --in <results.json> [options]
  bun run src/analyze.ts --in <results.json> [options]

Options:
  --in, --input <file>  Benchmark results JSON to analyze
  --out <file>          Rendered report path (default: results/analysis-<timestamp>.txt)
  -h, --help            Show this help

This command reads stored attempts only. It does not call benchmark providers.
`;

function readRuns(inputPath: string): ProviderRun[] {
  const resultsFile = JSON.parse(readFileSync(inputPath, "utf8")) as ResultsFile;
  if (!Array.isArray(resultsFile.providers) || resultsFile.providers.some((run) => typeof run.provider !== "string")) {
    throw new Error(`Invalid results file: ${inputPath}`);
  }
  return resultsFile.providers.map(({ provider, ...result }) => ({ provider, result }));
}

function main(): void {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(HELP);
    return;
  }
  if (!opts.input) {
    console.error("Missing --in <results.json>. See --help.");
    process.exitCode = 1;
    return;
  }

  const runs = readRuns(opts.input);
  const report = formatComparisonReport(runs);
  const outPath = opts.out ?? join("results", `analysis-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`);
  saveComparisonReport(report, outPath);
  console.log(report);
  console.log(`\nSaved report to ${outPath}`);
}

try {
  main();
} catch (e) {
  console.error(e instanceof Error ? e.stack : String(e));
  process.exitCode = 1;
}
