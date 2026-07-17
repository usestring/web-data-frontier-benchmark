import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const P75 = 0.75;
const NO_SUCCESSFUL_PROVIDER_LATENCY_MS = 90_000;
const DEFAULT_INPUT_PATH = "official_results/benchmark-2026-07-15T21-36-21-625Z.json";
const DEFAULT_OUTPUT_DIR = "results/reproducibility";

interface Attempt {
  success: boolean;
  latencyMs: number;
}

interface TargetResult {
  testName: string;
  url: string;
  attempts: Attempt[];
}

interface ProviderResult {
  provider: string;
  totalRequests: number;
  successfulRequests: number;
  results: TargetResult[];
}

interface BenchmarkRun {
  generatedAt: string;
  providers: ProviderResult[];
}

interface Target {
  testName: string;
  url: string;
}

interface TargetEntry {
  provider: ProviderResult;
  target: TargetResult;
  successfulAttemptP75Ms: number | undefined;
}

type CsvValue = boolean | number | string | undefined;

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function nearestRank(values: readonly number[], percentile: number): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * percentile) - 1];
}

function successfulAttemptP75Ms(target: TargetResult): number | undefined {
  return nearestRank(
    target.attempts.filter((attempt) => attempt.success).map((attempt) => attempt.latencyMs),
    P75
  );
}

function csvCell(value: CsvValue): string {
  if (value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows: CsvValue[][]): string {
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

function toBenchmarkRun(value: unknown): BenchmarkRun {
  invariant(typeof value === "object" && value !== null, "The raw result must be a JSON object");
  const run = value as BenchmarkRun;
  invariant(Array.isArray(run.providers) && run.providers.length > 0, "The raw result must contain at least one provider");
  return run;
}

function buildArtifacts(run: BenchmarkRun): Map<string, string> {
  const providers = [...run.providers].sort((a, b) => a.provider.localeCompare(b.provider));
  const firstProvider = providers[0];
  invariant(firstProvider.results.length > 0, `${firstProvider.provider} has no target results`);

  const targets: Target[] = firstProvider.results.map(({ testName, url }) => ({ testName, url }));
  invariant(new Set(targets.map((target) => target.testName)).size === targets.length, "Target names must be unique");

  const targetResultsByProvider = new Map(
    providers.map((provider) => [provider.provider, new Map(provider.results.map((target) => [target.testName, target]))])
  );
  const maxAttempts = Math.max(...providers.flatMap((provider) => provider.results.map((target) => target.attempts.length)));
  invariant(maxAttempts > 0, "The raw result must contain attempts");

  const entriesByTarget = targets.map((target) => {
    const entries = providers.map((provider) => {
      const result = targetResultsByProvider.get(provider.provider)?.get(target.testName);
      invariant(result, `${provider.provider} is missing ${target.testName}`);
      return { provider, target: result, successfulAttemptP75Ms: successfulAttemptP75Ms(result) } satisfies TargetEntry;
    });
    return { target, entries };
  });

  const inputs: CsvValue[][] = [
    [
      "target",
      "url",
      "provider",
      ...Array.from({ length: maxAttempts }, (_, index) => [`attempt_${index + 1}_success`, `attempt_${index + 1}_latency_ms`]).flat()
    ]
  ];
  const targetScores: CsvValue[][] = [
    [
      "target",
      "url",
      "provider",
      "successful_attempt_count",
      "own_successful_attempt_p75_ms",
      "successful_provider_count",
      "successful_provider_p75_ms",
      "fallback_latency_ms",
      "fallback_source",
      "scoring_mode",
      "latency_score_ms",
      "latency_score_seconds"
    ]
  ];
  const providerScores = new Map(
    providers.map((provider) => [
      provider.provider,
      { provider, latencyScores: [] as number[], targetsWithoutSuccessfulContent: 0 }
    ])
  );

  for (const { target, entries } of entriesByTarget) {
    const successfulProviderScores = entries.flatMap((entry) =>
      entry.successfulAttemptP75Ms === undefined ? [] : [entry.successfulAttemptP75Ms]
    );
    const successfulProviderP75Ms = nearestRank(successfulProviderScores, P75);
    const fallbackLatencyMs = successfulProviderP75Ms ?? NO_SUCCESSFUL_PROVIDER_LATENCY_MS;
    const fallbackSource = successfulProviderP75Ms === undefined ? "timeout" : "successful-provider-p75";

    for (const entry of entries) {
      const inputRow: CsvValue[] = [target.testName, target.url, entry.provider.provider];
      for (let index = 0; index < maxAttempts; index += 1) {
        const attempt = entry.target.attempts[index];
        inputRow.push(attempt === undefined ? undefined : attempt.success ? 1 : 0, attempt?.latencyMs);
      }
      inputs.push(inputRow);

      const scoringMode = entry.successfulAttemptP75Ms === undefined ? fallbackSource : "successful-attempt-p75";
      const latencyScoreMs = entry.successfulAttemptP75Ms ?? fallbackLatencyMs;
      const providerScore = providerScores.get(entry.provider.provider);
      invariant(providerScore, `Missing score collector for ${entry.provider.provider}`);
      providerScore.latencyScores.push(latencyScoreMs);
      if (entry.successfulAttemptP75Ms === undefined) providerScore.targetsWithoutSuccessfulContent += 1;

      targetScores.push([
        target.testName,
        target.url,
        entry.provider.provider,
        entry.target.attempts.filter((attempt) => attempt.success).length,
        entry.successfulAttemptP75Ms,
        successfulProviderScores.length,
        successfulProviderP75Ms,
        fallbackLatencyMs,
        fallbackSource,
        scoringMode,
        latencyScoreMs,
        (latencyScoreMs / 1000).toFixed(6)
      ]);
    }
  }

  const providerSummary: CsvValue[][] = [
    [
      "provider",
      "successful_requests",
      "total_requests",
      "success_rate",
      "targets",
      "targets_without_successful_content",
      "latency_score_ms",
      "latency_score_seconds"
    ],
    ...[...providerScores.values()]
      .map(({ provider, latencyScores, targetsWithoutSuccessfulContent }) => {
        const latencyScoreMs = latencyScores.reduce((sum, score) => sum + score, 0) / latencyScores.length;
        return [
          provider.provider,
          provider.successfulRequests,
          provider.totalRequests,
          (provider.successfulRequests / provider.totalRequests).toFixed(6),
          latencyScores.length,
          targetsWithoutSuccessfulContent,
          latencyScoreMs.toFixed(6),
          (latencyScoreMs / 1000).toFixed(6)
        ] satisfies CsvValue[];
      })
      .sort((a, b) => Number(b[3]) - Number(a[3]))
  ];

  return new Map([
    ["benchmark-attempt-inputs.csv", csv(inputs)],
    ["benchmark-target-scores.csv", csv(targetScores)],
    ["benchmark-provider-scores.csv", csv(providerSummary)]
  ]);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode = args[0] === "--check" ? "check" : args[0] === "--dry-run" ? "dry-run" : "write";
  const positional = mode === "write" ? args : args.slice(1);
  invariant(positional.length <= 2, "Usage: export-reproducibility.ts [--check | --dry-run] [raw-json-path] [output-dir]");

  const inputPath = resolve(positional[0] ?? DEFAULT_INPUT_PATH);
  const outputDir = resolve(positional[1] ?? DEFAULT_OUTPUT_DIR);
  const run = toBenchmarkRun(JSON.parse(await readFile(inputPath, "utf8")));
  const artifacts = buildArtifacts(run);

  if (mode === "check") {
    await Promise.all(
      [...artifacts].map(async ([name, content]) => {
        const actual = await readFile(resolve(outputDir, name), "utf8");
        invariant(actual === content, `${name} is stale; run npm run export:reproducibility`);
      })
    );
  } else if (mode === "write") {
    await mkdir(outputDir, { recursive: true });
    await Promise.all([...artifacts].map(([name, content]) => writeFile(resolve(outputDir, name), content)));
  }

  console.log(
    JSON.stringify(
      {
        mode: mode === "check" ? "verified" : mode === "dry-run" ? "previewed" : "wrote",
        generatedAt: run.generatedAt,
        inputPath,
        outputDir,
        files: [...artifacts.keys()]
      },
      null,
      2
    )
  );
}

await main();
