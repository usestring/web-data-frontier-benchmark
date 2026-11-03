# Web Data Frontier Benchmark

Compare web access APIs (web unblockers / scrape APIs) head-to-head against a fixed suite of 34
real-world, bot-protected URLs spanning 11 industries, chosen because they separate providers, plus a
separate buyer list of two well-known sites (see [Target sites](#target-sites) for the full list and the
selection rule). Each provider is sent
the same URLs; a request **passes** when the API returns a `2xx` status **and** the response body contains
the page's expected text.

Read the full write-up: [The Web Scraping Benchmark Problem](https://www.usestring.ai/blog/web-scraping-benchmark-problem).

## Results

Official run: **October 30, 2026** (100 targets × 5 attempts × 17 providers = 8,500 requests;
raw data in [`official_results/benchmark-2026-10-30T18-48-18-489Z.json`](official_results/benchmark-2026-10-30T18-48-18-489Z.json)).
This run used the earlier 100-target suite. It predates the [current target set](#target-selection).

| Rank | Provider    | Success rate | Latency score |  Passed |
| ---: | ----------- | -----------: | ------------: | ------: |
|    1 | string      |        98.6% |         4.24s | 493/500 |
|    2 | scrapedo    |        94.0% |         5.08s | 470/500 |
|    3 | context_dev |        93.0% |        10.96s | 465/500 |
|    4 | scrapfly    |        86.8% |        19.62s | 434/500 |
|    5 | scrapingbee |        85.2% |        20.30s | 426/500 |
|    6 | firecrawl   |        81.2% |         8.87s | 406/500 |
|    7 | zyte        |        79.6% |        14.43s | 398/500 |
|    8 | apify       |        79.4% |        24.87s | 397/500 |
|    9 | scraperapi  |        76.4% |        15.19s | 382/500 |
|   10 | bright      |        75.4% |        27.88s | 377/500 |
|   11 | decodo      |        71.2% |        28.29s | 356/500 |
|   12 | nimble      |        68.0% |        22.65s | 340/500 |
|   13 | oxylabs     |        67.4% |        16.62s | 337/500 |
|   14 | browserbase |        43.0% |        18.01s | 215/500 |
|   15 | zenrows     |        41.8% |        21.91s | 209/500 |
|   16 | scrapingant |        40.0% |        18.39s | 200/500 |
|   17 | scrapingdog |        27.6% |        31.52s | 138/500 |

Notes on this run:

- Scrape.do is new this month. Massive is not included: its account could not be provisioned before the run.
- Every provider ran with the default settings (concurrency 2, 90-second timeout).

Previous official run: September 15, 2026 ([`official_results/benchmark-2026-09-16T01-03-47-074Z.json`](official_results/benchmark-2026-09-16T01-03-47-074Z.json)).

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

- **Test suite** (`src/tests.const.ts`): the headline targets and the buyer list, each fixture `{ name, url, antibot?, industry?, containsText? }`. See [Target sites](#target-sites).
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
npm run analyze -- --in official_results/benchmark-2026-10-30T18-48-18-489Z.json --out results/recalculated-latency.txt
```

A smoke test against a single provider and a single fixture:

```bash
npm run benchmark -- --providers scrapfly --tests temu --attempts 1
```

## Benchmark CLI options

| Option                       | Description                                                       |
| ---------------------------- | ----------------------------------------------------------------- |
| `--providers <a,b>`          | Only run these providers (default: all with keys set)             |
| `--tests <a,b>`              | Only run these fixtures by name, from either list (default: all)  |
| `--attempts <n>`             | Attempts per test (default: 5)                                    |
| `--concurrency <n>`          | Parallel requests per provider (default: 2)                       |
| `--provider-concurrency <n>` | Providers to benchmark at once (default: 15)                      |
| `--out <file>`               | Results JSON path (default: `results/benchmark-<timestamp>.json`) |
| `--report-out <file>`        | Rendered report path (default: results path with `.txt`)          |
| `--failures-dir <dir>`       | Keep evidence for every failed attempt (off by default; see below) |
| `--dry-run`                  | Print the targets and request counts, then exit without sending   |
| `-h, --help`                 | Show help                                                         |

Each benchmark run writes the full structured results (every attempt) to JSON and its comparison leaderboard
plus per-provider, per-test breakdown to a companion text report. Use `--report-out` to choose another path.

The results JSON keeps only an error message per failed attempt. To diagnose a miss from the run itself,
pass `--failures-dir <dir>`. For each failed attempt (successes are not written) the runner saves:

- `<dir>/<provider>/<test>-<attempt>.html` (or `.txt`): the body exactly as the checker saw it, capped at 2 MB.
  Absent when the attempt produced no body, such as a timeout or a network error.
- `<dir>/<provider>/<test>-<attempt>.json`: provider, test, URL, attempt, status code, latency, error
  message, the provider's request/trace id when its API returns one (String's `x-trace-id` header), and a
  timestamp.

Recording only observes the adapter's single request; it adds no requests, retries or request parameters.
Failed attempts also carry `traceId` in the results JSON when one was captured.

## Results analysis

Recalculate the current scoring from a stored benchmark JSON file without calling providers:

```bash
npm run analyze -- --in official_results/benchmark-2026-10-30T18-48-18-489Z.json --out results/recalculated-latency.txt
```

| Option                   | Description                                                        |
| ------------------------ | ------------------------------------------------------------------ |
| `--in`, `--input <file>` | Benchmark results JSON to analyze                                  |
| `--out <file>`           | Rendered report path (default: `results/analysis-<timestamp>.txt`) |
| `-h, --help`             | Show help                                                          |

## Supported providers

| Provider                           | Required `.env` var(s)                                    |
| ---------------------------------- | --------------------------------------------------------- |
| apify (Web Fetch Actor)            | `APIFY_TOKEN`                                             |
| bright (Bright Data Web Unblocker) | `BRIGHT_API_KEY` + `BRIGHT_ZONE`                          |
| zyte                               | `ZYTE_API_KEY`                                            |
| scrapfly                           | `SCRAPFLY_API_KEY`                                        |
| scrapedo (Scrape.do)               | `SCRAPEDO_API_KEY`                                        |
| scraperapi                         | `SCRAPERAPI_API_KEY`                                      |
| scrapingant                        | `SCRAPINGANT_API_KEY`                                     |
| scrapingbee                        | `SCRAPINGBEE_API_KEY`                                     |
| scrapingdog                        | `SCRAPINGDOG_API_KEY`                                     |
| zenrows                            | `ZENROWS_API_KEY`                                         |
| oxylabs                            | `OXYLABS_WEB_UNBLOCKER_CREDENTIALS` (`username:password`) |
| firecrawl                          | `FIRECRAWL_API_KEY`                                       |
| massive                            | `MASSIVE_API_KEY`                                         |
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
  WEB_ACCESS_HEADLINE_TESTS,
  WEB_ACCESS_BENCHMARK_CONFIG,
} from "web-data-frontier-benchmark";

const scrapfly = PROVIDERS.find((p) => p.name === "scrapfly")!;
const result = await runWebAccessBenchmarkSuite(WEB_ACCESS_HEADLINE_TESTS, makeExecutor(scrapfly), WEB_ACCESS_BENCHMARK_CONFIG, "scrapfly");
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

- Apify sends every target to the [Web Fetch](https://apify.com/apify/web-fetch) Actor's Standby endpoint
  with `formats: ["raw"]` and `unwrap: true`, so the body is the original HTML and the status code is the
  target's own. The Actor exposes no stealth setting: all fetches go through Apify Proxy's Unblocker group,
  which escalates to browser rendering on its own when a site needs it.
- Each attempt is a single request to the provider's fetch API: no client-side retries and no browser
  sessions driven over CDP. See [CONTRIBUTING.md](CONTRIBUTING.md#what-an-adapter-may-do).
- All requests carry a per-attempt timeout (default 90s). The runner enforces it with an `AbortController`;
  adapters built on an SDK that takes no signal pass the same value as a client-side socket deadline instead.
- Each provider is sent the strongest anti-bot configuration its public API offers: the best proxy pool
  the vendor sells, plus any explicit stealth or bypass switch. JS rendering is a separate axis and is not
  part of the bypass, so it stays off wherever the vendor allows both and every provider is compared on the
  same artifact. ScrapingBee uses Auto Mode with `max_cost: 75`, letting the vendor choose the proxy pool
  and rendering;
  ZenRows and Decodo render because their adapters predate this note.
- Rendering is mostly not the bypass. Among the six caller-selected providers — the ones whose adapter
  sets the flag, so we know what was requested — 32 of the 100 targets were passed by an unrendered
  provider alone, against none passed by a rendering provider alone. Requiring a majority of attempts makes
  it 37 against 0; requiring all five, 45 against 2. So rendering earns its place on a couple of targets
  and costs on most. Bot protection keys on IP reputation and TLS fingerprint before it looks at content,
  so a headless browser mostly buys cost, latency and one more thing to fingerprint — and latency is a
  scored column here. A more expensive tier is not automatically a stronger one. Providers that choose
  rendering server-side are excluded from this comparison; they cannot be sorted into either column
  without guessing.
- In the recorded run, providers fell into two groups, and the distinction matters when reading the numbers:
  - **Caller-selected tier.** ScraperAPI, ScrapingAnt, Scrapingdog, ZenRows, Decodo and Scrapfly expose
    the proxy pool as a request parameter. Each adapter pinned the top pool, so every attempt started
    there rather than escalating into it after a block.
  - **Server-side escalation.** ScrapingBee (Auto Mode), Apify, Zyte, Nimble, Firecrawl, Bright Data,
    Oxylabs, Context.dev, Browserbase and String decide the bypass strategy themselves. The adapter asks
    for the strongest mode it can name and the vendor picks the rest, so the configuration is not fully
    observable from this repo.
  Because String is in the second group, its result reflects our own server-side routing and is not
  parameter-comparable with a pinned-tier provider. Read it as the service's default behaviour.
- See the per-file comments for the exact request shape and the credit cost it implies.
- Running the full suite across many providers makes real, billable API calls. Start with `--attempts 1`
  and a small `--tests` subset.
- Yeah much vibecoding (so catch the AI-isms) but we did read all of the code + verify :)

## Target sites

The suite has two parts, both defined in [`src/tests.const.ts`](src/tests.const.ts): 34 headline targets
that make up the score, and a separate 2-site buyer list. Every provider is sent the same lists, in the
order below. **Site** is the fixture name `--tests` accepts. **Industry** is the fixture's `industry` field, an
editorial grouping of the suite by the kind of data behind the URL; every target carries exactly one.
**Anti-bot** is the fixture's `antibot` field; `Not classified` means the fixture carries no `antibot` value,
not that the site is unprotected.

### Target selection

Web data buyers learn little from a site nearly every provider returns, so the headline set keeps only
targets that separate providers.

**The rule.** A target is table stakes when more than 10 of 17 providers pass it, where a provider passes
with at least 3 of 5 attempts. Table stakes targets are out of the headline set. The rule only counts
providers, and it treats every provider alike.

**The evidence.** Targets in the [October 30, 2026 run](official_results/benchmark-2026-10-30T18-48-18-489Z.json)
are counted from that run. The 12 targets swapped in after it have no official run, so:

- † Counted from a 3-attempt trial across the same 17 providers, where 2 of 3 attempts is the pass mark.
  Three attempts is a thin sample: compass, chewy and transat sit on the limit, and tesla is one provider over it.
- ‡ zoominfo has no all-provider data. It stays in the set provisionally, and the rule has not been applied to it.

**The effect.**

| | Targets | Attempts | Providers | Requests per run |
| --- | ---: | ---: | ---: | ---: |
| Previous suite | 100 | 5 | 17 | 8,500 |
| Headline set | 34 | 5 | 17 | 2,890 |
| Buyer list | 2 | 5 | 17 | 170 |
| **Now** | **36** | | | **3,060** |

`npm run benchmark -- --dry-run` prints the plan for the providers you select, without sending a request. It
counts every registered adapter, including Massive, which sat out the October 30 run, so the default shows 18.

Success rates on this set are not comparable with runs on the 100-target suite. The set was drawn from the
October 30 results and the trials, so rescoring those same results favours whoever did well on them; a score on
this set needs a fresh run. The narrowed set also has no target in Developer & research, Government, Health & pharmacy,
Search engines or Social media, and none behind F5 / Shape or an in-house / custom anti-bot other than Temu and Ticketmaster.

Table stakes targets removed, with providers passing: Allmenus 16, draftkings 16, GOAT 16, safeway 16, X (Twitter) 16, zillow 16, att 15, barrons 15, bloomberg 15, canadagoose 15, etsy 15, github 15, marketwatch 15, nike 15, nytimes 15, YouTube 15, Zoopla 15, Airbnb 14, Amazon 14, asda 14, cars.com 14, delta 14, Foot Locker 14, glassdoor 14, goodrx 14, hyatt 14, Instacart 14, Instagram 14, Leboncoin 14, Pinterest 14, Redfin 14, tripadvisor 14, wsj 14, Yahoo Finance 14, allegro 13, arxiv 13, Capterra 13, crunchbase 13, ralphlauren 13, Reddit 13, Yellow Pages 13, autozone 12, DigiKey 12, ebay 12, Facebook 12, g2 12, homedepot 12, Idealista 12, Kayak 12, LinkedIn 12, stackoverflow 12, TikTok 12, ZipRecruiter 12, bing 11, booking.com 11, Congress.gov 11, Google Search 11, lululemon 11, monster 11, SeatGeek 11, Trustpilot 11, zara 11. From the trials: nordstrom 12, costco 12, tesla 11.

### Headline targets

Vendor spread: Akamai Bot Manager 10, AWS WAF 6, DataDome 5, Cloudflare 4, PerimeterX / HUMAN 3, Fastly Bot Management 1, Imperva Incapsula 1, Kasada 1, Not classified 1, Temu (in-house) 1, Ticketmaster (in-house) 1.

Industry spread: Retail & ecommerce 9, Fashion & luxury 4, Marketplaces & classifieds 3, Real estate 3, Reviews & local 3, Tickets & events 3, Travel 3, Jobs & hiring 2, News & finance 2, Gaming & betting 1, Grocery & food 1.

| # | Site | Domain | Target URL | Industry | Anti-bot | Providers passing (of 17) |
| ---: | --- | --- | --- | --- | --- | ---: |
| 1 | indeed | www.indeed.com | [link](https://www.indeed.com/l-chicago,-il-jobs.html) | Jobs & hiring | Cloudflare | 10 |
| 2 | lowes | www.lowes.com | [link](https://www.lowes.com/pd/James-Martin-Vanities-Bristol-72-in-Whitewashed-Walnut-Undermount-Double-Sink-Bathroom-Vanity-with-Eternal-Jasmine-Pearl-Quartz-Top/5013813827) | Retail & ecommerce | Akamai Bot Manager | 9 |
| 3 | saksfifthavenue | www.saksfifthavenue.com | [link](https://www.saksfifthavenue.com/product/loewe-striped-slim-zip-front-top-0400026423433.html) | Fashion & luxury | DataDome | 10 |
| 4 | neimanmarcus | www.neimanmarcus.com | [link](https://www.neimanmarcus.com/p/gorski-reversible-toscana-lamb-shearling-jacket-prod282500173) | Fashion & luxury | DataDome | 10 |
| 5 | aa | www.aa.com | [link](https://www.aa.com/homePage.do) | Travel | Akamai Bot Manager | 5 |
| 6 | yelp | www.yelp.com | [link](https://www.yelp.com/search?find_desc=mexican+restuarant&find_loc=Chicago%2C+IL) | Reviews & local | DataDome | 7 |
| 7 | louisvuitton | us.louisvuitton.com | [link](https://us.louisvuitton.com/eng-us/products/lv-tilted-sneaker-nvprod7310009v/1AJS39) | Fashion & luxury | Akamai Bot Manager | 7 |
| 8 | sallybeauty | www.sallybeauty.com | [link](https://www.sallybeauty.com/hair-color/) | Retail & ecommerce | PerimeterX / HUMAN | 9 † |
| 9 | autotrader | www.autotrader.com | [link](https://www.autotrader.com/cars-for-sale/vehicle/763249459) | Marketplaces & classifieds | Akamai Bot Manager | 10 |
| 10 | ysl | www.ysl.com | [link](https://www.ysl.com/en-us/shop-women/handbags) | Fashion & luxury | Akamai Bot Manager | 7 † |
| 11 | zoominfo | www.zoominfo.com | [link](https://www.zoominfo.com/c/microsoft/24904409) | Reviews & local | PerimeterX / HUMAN | no data ‡ |
| 12 | emag | www.emag.ro | [link](https://www.emag.ro/telefon-mobil-apple-iphone-17-256gb-5g-black-mg6j4zd-a/pd/DGX9FV3BM/) | Retail & ecommerce | AWS WAF | 9 |
| 13 | transat | www.transat.com | [link](https://www.transat.com/en-CA) | Travel | Imperva Incapsula | 10 † |
| 14 | mouser | www.mouser.com | [link](https://www.mouser.com/ProductDetail/DFRobot/FIT1030?qs=6avfeC6zeS76UUpWZZX%252B0w%3D%3D) | Retail & ecommerce | Akamai Bot Manager | 4 |
| 15 | realtor | www.realtor.com | [link](https://www.realtor.com/realestateandhomes-search/Chicago_IL) | Real estate | AWS WAF | 8 |
| 16 | reuters | www.reuters.com | [link](https://www.reuters.com/) | News & finance | DataDome | 10 |
| 17 | coupang | www.coupang.com | [link](https://www.coupang.com/vp/products/7579231557) | Retail & ecommerce | Akamai Bot Manager | 6 |
| 18 | chewy | www.chewy.com | [link](https://www.chewy.com/b/dry-food-294) | Retail & ecommerce | Kasada | 10 † |
| 19 | stockx | stockx.com | [link](https://stockx.com/air-jordan-5-retro-black-university-blue-2026) | Marketplaces & classifieds | Cloudflare | 10 |
| 20 | cargurus | www.cargurus.com | [link](https://www.cargurus.com/details/452063396?) | Marketplaces & classifieds | DataDome | 9 |
| 21 | Ticketmaster | www.ticketmaster.com | [link](https://www.ticketmaster.com/taylor-swift-tickets/artist/1094215) | Tickets & events | Ticketmaster (in-house) | 10 |
| 22 | Best Buy | www.bestbuy.com | [link](https://www.bestbuy.com/site/apple-airpods-pro-2nd-generation-with-magsafe-case-usb-c-white/6447382.p?skuId=6447382) | Retail & ecommerce | Akamai Bot Manager | 7 |
| 23 | compass | www.compass.com | [link](https://www.compass.com/homes-for-sale/chicago-il/) | Real estate | AWS WAF | 10 † |
| 24 | imdb | www.imdb.com | [link](https://www.imdb.com/chart/top/) | Reviews & local | AWS WAF | 7 † |
| 25 | StubHub | www.stubhub.com | [link](https://www.stubhub.com/taylor-swift-tickets) | Tickets & events | AWS WAF | 10 |
| 26 | Skyscanner | www.skyscanner.net | [link](https://www.skyscanner.net/transport/flights/nyca/lond/) | Travel | PerimeterX / HUMAN | 8 |
| 27 | binance | www.binance.com | [link](https://www.binance.com/en/markets/overview) | News & finance | AWS WAF | 8 † |
| 28 | seek | www.seek.com.au | [link](https://www.seek.com.au/software-engineer-jobs) | Jobs & hiring | Cloudflare | 7 † |
| 29 | Apartments.com | www.apartments.com | [link](https://www.apartments.com/new-york-ny/) | Real estate | Akamai Bot Manager | 10 |
| 30 | temu | www.temu.com | [link](https://www.temu.com/60w-fast-charging-usb-to-type-c-cable-high-speed-data-sync-for-iphone-15-16-for--pro-for-ipad-for-samsung-for-xiaomi-other-devices-g-605554969821574.html) | Retail & ecommerce | Temu (in-house) | 1 |
| 31 | kroger | www.kroger.com | [link](https://www.kroger.com/p/kroger-vitamin-d-whole-milk/0001111041700) | Grocery & food | Akamai Bot Manager | 7 |
| 32 | axs | www.axs.com | [link](https://www.axs.com/events) | Tickets & events | Cloudflare | 8 |
| 33 | roblox | www.roblox.com | [link](https://www.roblox.com/discover) | Gaming & betting | Fastly Bot Management | 10 |
| 34 | buybuybaby | buybuybaby.bedbathandbeyond.com | [link](https://buybuybaby.bedbathandbeyond.com/Baby/Cloud-Muslin-Sage-WHite-5pc-Bedding-Set-Levtex-Baby/43435980/product.html) | Retail & ecommerce | Not classified | 9 |

### Buyer list

Well-known sites buyers ask about by name. Both are table stakes under the rule above, so neither counts toward
the headline score. The report shows each provider's attempts on each site in its own section, and the results
JSON keeps them under each provider's `buyerList`, apart from `results`, `overallSuccessRate` and the latency
score.

| Site | Domain | Target URL | Industry | Anti-bot | Providers passing (of 17) |
| --- | --- | --- | --- | --- | ---: |
| walmart | www.walmart.com | [link](https://www.walmart.com/ip/Nike-Men-s-Short-Sleeve-Just-Do-It-Swoosh-Graphic-Active-T-Shirt-Navy-L/2501897203) | Retail & ecommerce | PerimeterX / HUMAN | 16 |
| target | www.target.com | [link](https://www.target.com/p/1-39-6-34-x2-39-6-34-so-happy-you-39-re-here-doormat-natural-threshold-8482/-/A-82253413) | Retail & ecommerce | PerimeterX / HUMAN | 16 |

## License

[MIT](LICENSE)
