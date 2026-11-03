import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { formatComparisonReport, formatComparisonTable, type ProviderRun } from "./format.js";
import { WEB_ACCESS_BENCHMARK_CONFIG, WEB_ACCESS_BUYER_TESTS, WEB_ACCESS_HEADLINE_TESTS } from "./tests.const.js";
import type { WebAccessBenchmarkResult } from "./types.js";

const MIN_PASSING_ATTEMPTS = 3;
const TABLE_STAKES_ABOVE = 10;
const OCTOBER_RUN = new URL("../official_results/benchmark-2026-10-30T18-48-18-489Z.json", import.meta.url);

/** Providers passing each target in the October 30 run, the stored evidence for the selection rule. */
function passingProviders(): Map<string, { passing: number; url: string }> {
  const run = JSON.parse(readFileSync(OCTOBER_RUN, "utf8")) as { providers: WebAccessBenchmarkResult[] };
  const byTarget = new Map<string, { passing: number; url: string }>();
  for (const provider of run.providers) {
    for (const result of provider.results) {
      const entry = byTarget.get(result.testName) ?? { passing: 0, url: result.url };
      if (result.successCount >= MIN_PASSING_ATTEMPTS) entry.passing++;
      byTarget.set(result.testName, entry);
    }
  }
  return byTarget;
}

const suite = (name: string, successCount: number): WebAccessBenchmarkResult => ({
  durationMs: 1,
  totalRequests: 5,
  successfulRequests: successCount,
  overallSuccessRate: successCount / 5,
  results: [
    {
      testName: name,
      url: `https://${name}.test/`,
      totalAttempts: 5,
      successCount,
      successRate: successCount / 5,
      avgLatencyMs: 1,
      minLatencyMs: 1,
      maxLatencyMs: 1,
      errors: [],
      attempts: []
    }
  ]
});

test("the suite is 34 headline targets and a 2-site buyer list, with no name in both", () => {
  const names = [...WEB_ACCESS_HEADLINE_TESTS, ...WEB_ACCESS_BUYER_TESTS].map((t) => t.name.toLowerCase());
  assert.equal(WEB_ACCESS_HEADLINE_TESTS.length, 34);
  assert.deepEqual(WEB_ACCESS_BUYER_TESTS.map((t) => t.name), ["walmart", "target"]);
  assert.equal(new Set(names).size, names.length);
});

test("no headline target from the October 30 run is table stakes", () => {
  const evidence = passingProviders();
  const fromRun = WEB_ACCESS_HEADLINE_TESTS.filter((t) => evidence.has(t.name));
  assert.equal(fromRun.length, 25);
  for (const target of fromRun) {
    const { passing, url } = evidence.get(target.name)!;
    assert.ok(passing <= TABLE_STAKES_ABOVE, `${target.name}: ${passing} providers pass`);
    assert.equal(target.url, url, `${target.name} changed URL since the run that scored it`);
  }
});

test("every other target from the October 30 run is table stakes", () => {
  const headline = new Set(WEB_ACCESS_HEADLINE_TESTS.map((t) => t.name));
  const kept = [...passingProviders()].filter(([name, { passing }]) => !headline.has(name) && passing <= TABLE_STAKES_ABOVE);
  assert.deepEqual(kept, [], "a target the rule keeps is missing from the headline set");
});

test("buyer-list sites are table stakes under the rule, so they can only be reported on their own", () => {
  const evidence = passingProviders();
  for (const target of WEB_ACCESS_BUYER_TESTS) {
    assert.ok(evidence.get(target.name)!.passing > TABLE_STAKES_ABOVE, target.name);
    assert.equal(target.url, evidence.get(target.name)!.url);
  }
});

test("a run sends 3,060 requests across 17 providers, 170 of them to the buyer list", () => {
  const { attemptsPerTest } = WEB_ACCESS_BENCHMARK_CONFIG;
  assert.equal(WEB_ACCESS_HEADLINE_TESTS.length * attemptsPerTest * 17, 2_890);
  assert.equal(WEB_ACCESS_BUYER_TESTS.length * attemptsPerTest * 17, 170);
});

test("the leaderboard ignores the buyer list, and the report shows it in its own section", () => {
  const runs: ProviderRun[] = [
    { provider: "alpha", result: suite("hard", 1), buyerList: suite("walmart", 5) },
    { provider: "beta", result: suite("hard", 4), buyerList: suite("walmart", 0) }
  ];
  const leaderboard = formatComparisonTable(runs);
  assert.ok(leaderboard.indexOf("beta") < leaderboard.indexOf("alpha"), "ranked on the headline targets alone");
  assert.match(leaderboard, /80\.0%/);
  assert.doesNotMatch(leaderboard, /100\.0%|walmart/);

  const report = formatComparisonReport(runs);
  const section = report.slice(report.indexOf("Buyer list (not part of the headline score)"));
  assert.match(section, /alpha\s+\| 5\/5/);
  assert.match(section, /beta\s+\| 0\/5/);
});

test("a stored run from before the buyer list reports without the section", () => {
  assert.doesNotMatch(formatComparisonReport([{ provider: "alpha", result: suite("hard", 1) }]), /Buyer list/);
});

test("--dry-run prints the plan and exits without keys or requests", () => {
  const cli = new URL("./cli.js", import.meta.url).pathname;
  const run = spawnSync(process.execPath, [cli, "--dry-run"], { encoding: "utf8", env: { PATH: process.env.PATH }, cwd: new URL(".", import.meta.url).pathname });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /Tests: 34 headline \+ 2 buyer list/);
  assert.match(run.stdout, /170 headline \+ 10 buyer list = 180/);
  assert.match(run.stdout, /no requests sent/);
  assert.doesNotMatch(run.stdout, /Starting /);
});
