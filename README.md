# Web Data Frontier Benchmark

Compare web access APIs (web unblockers / scrape APIs) head-to-head against a fixed suite of ~50
real-world, bot-protected URLs (Amazon, Walmart, Zillow, Cloudflare/PerimeterX-guarded retail and travel
sites, etc.). Each provider is sent the same URLs; a request **passes** when the API returns a `2xx`
status **and** the response body contains the page's expected text.

## Results

| Rank | Provider         | Success rate | Avg latency |  Passed |
| ---: | ---------------- | -----------: | ----------: | ------: |
|    1 | string_unblocker |        97.4% |      11.00s | 258/265 |
|    2 | scrapfly         |        83.4% |      15.80s | 221/265 |
|    3 | bright           |        79.2% |      24.14s | 210/265 |
|    4 | zenrows          |        76.2% |      23.47s | 202/265 |
|    5 | context_dev      |        75.5% |      13.69s | 200/265 |
|    6 | scraperapi       |        73.2% |      17.85s | 194/265 |
|    7 | firecrawl        |        72.1% |      12.82s | 191/265 |
|    8 | decodo           |        69.4% |      32.97s | 184/265 |
|    9 | oxylabs          |        69.1% |      20.89s | 183/265 |
|   10 | zyte             |        67.5% |      18.22s | 179/265 |
|   11 | nimble           |        58.5% |      31.18s | 155/265 |
|   12 | browserbase      |        50.6% |       2.03s | 134/265 |
|   13 | scrapingdog      |        47.9% |      10.17s | 127/265 |
|   14 | scrapingbee      |        35.1% |       5.83s |  93/265 |
|   15 | scrapingant      |        32.8% |       6.86s |  87/265 |

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
| string_unblocker                   | `STRING_UNBLOCKER_API_KEY`                                |

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
