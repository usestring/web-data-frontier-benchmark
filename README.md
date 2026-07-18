# Web Data Frontier Benchmark

Compare web access APIs (web unblockers / scrape APIs) head-to-head against a fixed suite of ~50
real-world, bot-protected URLs (Amazon, Walmart, Zillow, Cloudflare/PerimeterX-guarded retail and travel
sites, etc.). Each provider is sent the same URLs; a request **passes** when the API returns a `2xx`
status **and** the response body contains the page's expected text.

Read the full write-up: [The Web Scraping Benchmark Problem](https://www.usestring.ai/blog/web-scraping-benchmark-problem).

## Results

| Rank | Provider         | Success rate | Avg latency |  Passed |
| ---: | ---------------- | -----------: | ----------: | ------: |
|    1 | string           |        95.8% |       9.70s | 431/450 |
|    2 | scrapfly         |        83.6% |      12.01s | 376/450 |
|    3 | bright           |        80.9% |      24.23s | 364/450 |
|    4 | context_dev      |        78.7% |      11.86s | 354/450 |
|    5 | firecrawl        |        70.9% |       8.38s | 319/450 |
|    6 | scraperapi       |        69.3% |      13.71s | 312/450 |
|    7 | oxylabs          |        68.9% |      20.73s | 310/450 |
|    8 | zyte             |        68.2% |      15.15s | 307/450 |
|    9 | decodo           |        67.8% |      31.54s | 305/450 |
|   10 | nimble           |        59.3% |      27.21s | 267/450 |
|   11 | browserbase      |        50.0% |       2.43s | 225/450 |
|   12 | zenrows          |        44.2% |      14.97s | 199/450 |
|   13 | scrapingant      |        35.1% |       5.09s | 158/450 |
|   14 | scrapingdog      |        35.1% |       4.61s | 158/450 |
|   15 | scrapingbee      |        33.3% |       7.20s | 150/450 |

## How it works

- **Test suite** (`src/tests.const.ts`): each fixture is `{ name, url, containsText? }`.
- **Providers** (`src/providers/*.ts`): one thin adapter per service that fetches a URL through that
  provider's API and returns `{ body, statusCode }`.
- **Runner** (`src/runner.ts`): runs every test × N attempts per provider with bounded concurrency, then
  aggregates success rate and latency.
- A provider only runs when **all** of its API keys are present in `.env`.

## Quick start

```bash
# 1. Install
npm install            # or: bun install

# 2. Configure keys
cp .env.example .env   # then fill in keys for the providers you want to test

# 3. Run
npm run benchmark      # Node (tsx)
# or
bun run src/cli.ts     # Bun

# Recalculate a report from stored results without sending provider requests
npm run analyze -- --in official_results/benchmark-2026-07-15T21-36-21-625Z.json --out results/recalculated-latency.txt
```

A smoke test against a single provider and a single fixture:

```bash
npm run benchmark -- --providers scrapfly --tests amazon --attempts 1
```

## Benchmark CLI options

| Option              | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `--providers <a,b>` | Only run these providers (default: all with keys set)             |
| `--tests <a,b>`     | Only run these fixtures by name (default: all)                    |
| `--attempts <n>`    | Attempts per test (default: 5)                                    |
| `--concurrency <n>` | Parallel requests per provider (default: 2)                       |
| `--provider-concurrency <n>` | Providers to benchmark at once (default: 15)             |
| `--out <file>`      | Results JSON path (default: `results/benchmark-<timestamp>.json`) |
| `--report-out <file>` | Rendered report path (default: results path with `.txt`)        |
| `-h, --help`        | Show help                                                         |

Each benchmark run writes the full structured results (every attempt) to JSON and its comparison leaderboard
plus per-provider, per-test breakdown to a companion text report. Use `--report-out` to choose another path.

## Results analysis

Recalculate the current scoring from a stored benchmark JSON file without calling providers:

```bash
npm run analyze -- --in official_results/benchmark-2026-07-15T21-36-21-625Z.json --out results/recalculated-latency.txt
```

| Option                    | Description                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `--in`, `--input <file>`  | Benchmark results JSON to analyze                                 |
| `--out <file>`            | Rendered report path (default: `results/analysis-<timestamp>.txt`) |
| `-h, --help`              | Show help                                                         |

## Supported providers

| Provider                           | Required `.env` var(s)                                    |
| ---------------------------------- | --------------------------------------------------------- |
| bright (Bright Data Web Unblocker) | `BRIGHT_API_KEY` + `BRIGHT_ZONE`                          |
| zyte                               | `ZYTE_API_KEY`                                            |
| scrapfly                           | `SCRAPFLY_API_KEY`                                        |
| scraperapi                         | `SCRAPERAPI_API_KEY`                                      |
| scrapingant                        | `SCRAPINGANT_API_KEY`                                     |
| scrapingbee                        | `SCRAPINGBEE_API_KEY`                                     |
| scrapingdog                        | `SCRAPINGDOG_API_KEY`                                     |
| zenrows                            | `ZENROWS_API_KEY`                                         |
| oxylabs                            | `OXYLABS_WEB_UNBLOCKER_CREDENTIALS` (`username:password`) |
| firecrawl                          | `FIRECRAWL_API_KEY`                                       |
| decodo                             | `DECODO_API_KEY`                                          |
| nimble                             | `NIMBLE_API_KEY`                                          |
| context_dev                        | `CONTEXT_DEV_API_KEY`                                     |
| browserbase                        | `BROWSERBASE_API_KEY`                                     |
| string                             | `STRING_API_KEY`                                          |

## Programmatic use

```ts
import {
  PROVIDERS,
  makeExecutor,
  runWebAccessBenchmarkSuite,
  WEB_ACCESS_ALL_TESTS,
  WEB_ACCESS_BENCHMARK_CONFIG,
} from "web-data-frontier-benchmark";

const scrapfly = PROVIDERS.find((p) => p.name === "scrapfly")!;
const result = await runWebAccessBenchmarkSuite(WEB_ACCESS_ALL_TESTS, makeExecutor(scrapfly), WEB_ACCESS_BENCHMARK_CONFIG, "scrapfly");
console.log(result.overallSuccessRate);
```

## Adding a provider

1. Create `src/providers/<name>.ts` exporting a `Provider` (`name`, `envKeys`, `fetch`).
2. Register it in the `PROVIDERS` array in `src/providers/index.ts`.
3. Document its key in `.env.example` and the table above.

## Notes

- All requests carry a per-attempt timeout (default 90s) enforced via `AbortController`.
- Each provider is configured for its strongest anti-bot / proxy mode and raw-HTML (not JS-rendered, except
  where a provider only offers rendered output). See the per-file comments for the exact request shape.
- Running the full suite across many providers makes real, billable API calls. Start with `--attempts 1`
  and a small `--tests` subset.
