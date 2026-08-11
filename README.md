# Web Data Frontier Benchmark

Compare web access APIs (web unblockers / scrape APIs) head-to-head against a fixed suite of 99
real-world, bot-protected URLs (Amazon, Walmart, Zillow, Cloudflare/PerimeterX-guarded retail and travel
sites, etc.). Each provider is sent the same URLs; a request **passes** when the API returns a `2xx`
status **and** the response body contains the page's expected text.

Read the full write-up: [The Web Scraping Benchmark Problem](https://www.usestring.ai/blog/web-scraping-benchmark-problem).

## Results

Official run: **August 11, 2026** (99 targets × 5 attempts × 15 providers = 7,425 requests;
raw data in [`official_results/benchmark-2026-08-11T22-44-25-322Z.json`](official_results/benchmark-2026-08-11T22-44-25-322Z.json)).

| Rank | Provider    | Success rate | Latency score |  Passed |
| ---: | ----------- | -----------: | ------------: | ------: |
|    1 | string      |        97.0% |         9.98s | 480/495 |
|    2 | scrapfly    |        82.0% |        18.35s | 406/495 |
|    3 | context_dev |        79.2% |        12.68s | 392/495 |
|    4 | firecrawl   |        78.6% |         9.21s | 389/495 |
|    5 | bright      |        78.0% |        26.14s | 386/495 |
|    6 | oxylabs     |        76.8% |        14.67s | 380/495 |
|    7 | zyte        |        72.7% |        14.85s | 360/495 |
|    8 | decodo      |        70.7% |        22.63s | 350/495 |
|    9 | nimble      |        66.3% |        18.41s | 328/495 |
|   10 | scraperapi  |        64.2% |        13.65s | 318/495 |
|   11 | scrapingdog |        54.3% |        12.51s | 269/495 |
|   12 | browserbase |        42.2% |        14.19s | 209/495 |
|   13 | zenrows     |        34.3% |        17.60s | 170/495 |
|   14 | scrapingant |        30.7% |        16.08s | 152/495 |
|   15 | scrapingbee |        29.7% |        16.97s | 147/495 |

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

# Recalculate a report from stored results without sending provider requests
npm run analyze -- --in official_results/benchmark-2026-08-11T22-44-25-322Z.json --out results/recalculated-latency.txt
```

A smoke test against a single provider and a single fixture:

```bash
npm run benchmark -- --providers scrapfly --tests amazon --attempts 1
```

## Benchmark CLI options

| Option                       | Description                                                       |
| ---------------------------- | ----------------------------------------------------------------- |
| `--providers <a,b>`          | Only run these providers (default: all with keys set)             |
| `--tests <a,b>`              | Only run these fixtures by name (default: all)                    |
| `--attempts <n>`             | Attempts per test (default: 5)                                    |
| `--concurrency <n>`          | Parallel requests per provider (default: 2)                       |
| `--provider-concurrency <n>` | Providers to benchmark at once (default: 15)                      |
| `--out <file>`               | Results JSON path (default: `results/benchmark-<timestamp>.json`) |
| `--report-out <file>`        | Rendered report path (default: results path with `.txt`)          |
| `-h, --help`                 | Show help                                                         |

Each benchmark run writes the full structured results (every attempt) to JSON and its comparison leaderboard
plus per-provider, per-test breakdown to a companion text report. Use `--report-out` to choose another path.

## Results analysis

Recalculate the current scoring from a stored benchmark JSON file without calling providers:

```bash
npm run analyze -- --in official_results/benchmark-2026-08-11T22-44-25-322Z.json --out results/recalculated-latency.txt
```

| Option                   | Description                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| `--in`, `--input <file>` | Benchmark results JSON to analyze                                  |
| `--out <file>`           | Rendered report path (default: `results/analysis-<timestamp>.txt`) |
| `-h, --help`             | Show help                                                          |

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

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Maintainers approve provider
configuration changes from external contributors only after verifying current affiliation with the
affected provider's company, unless a repository maintainer explicitly takes responsibility for
the change.

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
- Yeah much vibecoding (so catch the AI-isms) but we did read all of the code + verify :)

## License

[MIT](LICENSE)
