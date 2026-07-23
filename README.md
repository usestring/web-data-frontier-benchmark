# Web Data Frontier Benchmark

Compare web access APIs (web unblockers / scrape APIs) head-to-head against a fixed suite of 90
real-world, bot-protected URLs (Amazon, Walmart, Zillow, Cloudflare/PerimeterX-guarded retail and travel
sites, etc.). Each provider is sent the same URLs; a request **passes** when the API returns a `2xx`
status **and** the response body contains the page's expected text.

Read the full write-up: [The Web Scraping Benchmark Problem](https://www.usestring.ai/blog/web-scraping-benchmark-problem).

## Results

Official run: **July 15, 2026** (90 targets × 5 attempts × 15 providers = 6,750 requests;
raw data in [`official_results/benchmark-2026-07-15T21-36-21-625Z.json`](official_results/benchmark-2026-07-15T21-36-21-625Z.json)).

| Rank | Provider         | Success rate | Latency score |  Passed |
| ---: | ---------------- | -----------: | ------------: | ------: |
|    1 | string           |        95.8% |        11.07s | 431/450 |
|    2 | scrapfly         |        83.6% |        14.28s | 376/450 |
|    3 | bright           |        80.9% |        24.33s | 364/450 |
|    4 | context_dev      |        78.7% |        13.62s | 354/450 |
|    5 | firecrawl        |        70.9% |        14.70s | 319/450 |
|    6 | scraperapi       |        69.3% |        13.31s | 312/450 |
|    7 | oxylabs          |        68.9% |        20.85s | 310/450 |
|    8 | zyte             |        68.2% |        17.50s | 307/450 |
|    9 | decodo           |        67.8% |        29.74s | 305/450 |
|   10 | nimble           |        59.3% |        21.43s | 267/450 |
|   11 | browserbase      |        50.0% |        15.25s | 225/450 |
|   12 | zenrows          |        44.2% |        21.35s | 199/450 |
|   13 | scrapingant      |        35.1% |        15.46s | 158/450 |
|   14 | scrapingdog      |        35.1% |        15.01s | 158/450 |
|   15 | scrapingbee      |        33.3% |        18.15s | 150/450 |

## Latency scoring

Latency is an equal-weighted average across target URLs. For a provider that returns verified content,
the target score is the nearest-rank 75th percentile of its successful attempt latencies; failed attempts
do not contribute a fast response time. For a provider with no verified-content response for a target, the
score is the nearest-rank 75th percentile of the successful providers' target scores. If nobody succeeds
on a target, the score is the benchmark's 90-second timeout. Nearest-rank p75 uses
`ceil(0.75 × n)`: one successful value uses that value, two use the slower value, and five use the fourth
value after sorting fastest to slowest.

The CLI's per-provider, per-target output labels the value included in the leaderboard as `Resolved latency`
and identifies whether it came from successful attempts, successful providers, or the timeout.

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
```

A smoke test against a single provider and a single fixture:

```bash
npm run benchmark -- --providers scrapfly --tests amazon --attempts 1
```

## CLI options

| Option              | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `--providers <a,b>` | Only run these providers (default: all with keys set)             |
| `--tests <a,b>`     | Only run these fixtures by name (default: all)                    |
| `--attempts <n>`    | Attempts per test (default: 5)                                    |
| `--concurrency <n>` | Parallel requests per provider (default: 5)                       |
| `--out <file>`      | Results JSON path (default: `results/benchmark-<timestamp>.json`) |
| `-h, --help`        | Show help                                                         |

Output is a comparison leaderboard plus a per-provider, per-test breakdown printed to the console, and the
full structured results (every attempt) written to `results/`.

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
