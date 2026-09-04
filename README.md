# Web Data Frontier Benchmark

Compare web access APIs (web unblockers / scrape APIs) head-to-head against a fixed suite of 99
real-world, bot-protected URLs (Amazon, Walmart, Zillow, Cloudflare/PerimeterX-guarded retail and travel
sites, etc. — see [Target sites](#target-sites) for the full list). Each provider is sent the same URLs; a request **passes** when the API returns a `2xx`
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

- **Test suite** (`src/tests.const.ts`): each fixture is `{ name, url, antibot?, containsText? }`. See [Target sites](#target-sites).
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

## Target sites

The suite is 99 domains, one target URL each, defined in [`src/tests.const.ts`](src/tests.const.ts).
Every provider is sent this same list.

### Domains

```text
www.aa.com
www.airbnb.com
www.alibaba.com
allegro.pl
www.allmenus.com
www.amazon.com
www.apartments.com
arxiv.org
www.asda.com
www.ashleyfurniture.com
www.att.com
www.autotrader.com
www.autozone.com
www.axs.com
www.barrons.com
www.bestbuy.com
www.bing.com
www.bloomberg.com
www.booking.com
www.canadagoose.com
www.capterra.com
www.cargurus.com
www.cars.com
www.carters.com
coinmarketcap.com
www.congress.gov
www.coupang.com
www.crunchbase.com
www.databricks.com
www.delta.com
www.digikey.com
sportsbook.draftkings.com
www.ebay.com
www.emag.ro
www.etsy.com
www.expedia.com
www.facebook.com
www.footlocker.com
www.g2.com
github.com
www.glassdoor.com
www.goat.com
www.goodrx.com
www.google.com
www.homedepot.com
www.hyatt.com
www.idealista.com
www.indeed.com
www.instacart.com
www.instagram.com
www.kayak.com
www.kroger.com
www.leboncoin.fr
www.linkedin.com
us.louisvuitton.com
www.lowes.com
shop.lululemon.com
www.macys.com
www.marketwatch.com
www.monster.com
www.mouser.com
www.neimanmarcus.com
www.nike.com
www.nytimes.com
www.pinterest.com
www.ralphlauren.com
www.realtor.com
www.reddit.com
www.redfin.com
www.reuters.com
www.rightmove.co.uk
www.roblox.com
www.safeway.com
www.saksfifthavenue.com
seatgeek.com
www.skyscanner.net
stackoverflow.com
stockx.com
www.stubhub.com
www.target.com
www.temu.com
www.ticketmaster.com
www.tiktok.com
www.tradingview.com
www.tripadvisor.com
www.trustpilot.com
www.verizon.com
www.vinted.fr
www.walmart.com
www.wsj.com
x.com
finance.yahoo.com
www.yellowpages.com
www.yelp.com
www.youtube.com
www.zara.com
www.zillow.com
www.ziprecruiter.com
www.zoopla.co.uk
```

### Domains by anti-bot vendor

The vendor each target is classified against in the fixture's `antibot` field. `Not classified` means the
fixture carries no `antibot` value, not that the site is unprotected.

**Akamai Bot Manager** (20)

```text
www.aa.com
www.apartments.com
www.att.com
www.autotrader.com
www.bestbuy.com
www.coupang.com
www.delta.com
sportsbook.draftkings.com
www.ebay.com
www.expedia.com
www.homedepot.com
www.kroger.com
us.louisvuitton.com
www.lowes.com
shop.lululemon.com
www.macys.com
www.mouser.com
www.nike.com
www.verizon.com
www.zara.com
```

**DataDome** (20)

```text
www.airbnb.com
allegro.pl
www.autozone.com
www.barrons.com
www.cargurus.com
www.etsy.com
www.g2.com
www.idealista.com
www.leboncoin.fr
www.marketwatch.com
www.monster.com
www.neimanmarcus.com
www.nytimes.com
www.reuters.com
www.saksfifthavenue.com
seatgeek.com
www.tripadvisor.com
www.vinted.fr
www.wsj.com
www.yelp.com
```

**Cloudflare** (15)

```text
www.asda.com
www.axs.com
www.capterra.com
www.cars.com
www.congress.gov
www.crunchbase.com
www.digikey.com
www.glassdoor.com
www.goat.com
www.indeed.com
stackoverflow.com
stockx.com
www.yellowpages.com
www.ziprecruiter.com
www.zoopla.co.uk
```

**In-house / custom** (9)

```text
www.facebook.com
www.google.com
www.instagram.com
www.linkedin.com
www.pinterest.com
www.reddit.com
www.tiktok.com
x.com
www.youtube.com
```

**PerimeterX / HUMAN** (9)

```text
www.ashleyfurniture.com
www.bloomberg.com
www.carters.com
www.goodrx.com
www.ralphlauren.com
www.skyscanner.net
www.target.com
www.walmart.com
www.zillow.com
```

**AWS WAF** (7)

```text
www.amazon.com
www.booking.com
www.emag.ro
www.realtor.com
www.redfin.com
www.stubhub.com
www.trustpilot.com
```

**Kasada** (3)

```text
www.canadagoose.com
www.footlocker.com
www.hyatt.com
```

**Fastly Bot Management** (1)

```text
www.roblox.com
```

**Imperva Incapsula** (1)

```text
www.safeway.com
```

**Temu (in-house)** (1)

```text
www.temu.com
```

**Ticketmaster (in-house)** (1)

```text
www.ticketmaster.com
```

**Not classified** (12)

```text
www.alibaba.com
www.allmenus.com
arxiv.org
www.bing.com
coinmarketcap.com
www.databricks.com
github.com
www.instacart.com
www.kayak.com
www.rightmove.co.uk
www.tradingview.com
finance.yahoo.com
```

### Exact target URLs

Suite order. **Site** is the fixture name `--tests` accepts.

| # | Site | Domain | Target URL | Anti-bot |
| ---: | --- | --- | --- | --- |
| 1 | allegro | allegro.pl | [link](https://allegro.pl/oferta/bukiet-roz-roze-sztuczne-kwiaty-jak-zywe-prezent-walentynki-piekne-mydlane-16842279548) | DataDome |
| 2 | Amazon | www.amazon.com | [link](https://www.amazon.com/Combination-Lock-Shackle-Security-Mounting-Bicycle-Secure/dp/B08KCWFMRS) | AWS WAF |
| 3 | canadagoose | www.canadagoose.com | [link](https://www.canadagoose.com/us/en/pr/macmillan-parka-2080M.html) | Kasada |
| 4 | indeed | www.indeed.com | [link](https://www.indeed.com/l-chicago,-il-jobs.html) | Cloudflare |
| 5 | lowes | www.lowes.com | [link](https://www.lowes.com/pd/James-Martin-Vanities-Bristol-72-in-Whitewashed-Walnut-Undermount-Double-Sink-Bathroom-Vanity-with-Eternal-Jasmine-Pearl-Quartz-Top/5013813827) | Akamai Bot Manager |
| 6 | safeway | www.safeway.com | [link](https://www.safeway.com/shop/product-details.960457331.html) | Imperva Incapsula |
| 7 | walmart | www.walmart.com | [link](https://www.walmart.com/ip/Nike-Men-s-Short-Sleeve-Just-Do-It-Swoosh-Graphic-Active-T-Shirt-Navy-L/2501897203) | PerimeterX / HUMAN |
| 8 | zillow | www.zillow.com | [link](https://www.zillow.com/new-york-ny/) | PerimeterX / HUMAN |
| 9 | saksfifthavenue | www.saksfifthavenue.com | [link](https://www.saksfifthavenue.com/product/loewe-striped-slim-zip-front-top-0400026423433.html) | DataDome |
| 10 | neimanmarcus | www.neimanmarcus.com | [link](https://www.neimanmarcus.com/p/gorski-reversible-toscana-lamb-shearling-jacket-prod282500173) | DataDome |
| 11 | g2 | www.g2.com | [link](https://www.g2.com/categories/emerging-ai-software?order=g2_score&page=92&_pjax=%23ajax-container#product-list) | DataDome |
| 12 | aa | www.aa.com | [link](https://www.aa.com/homePage.do) | Akamai Bot Manager |
| 13 | asda | www.asda.com | [link](https://www.asda.com/groceries/product/frozen-waffles-shapes-wedges/mccain-potato-smiles-454g/478142) | Cloudflare |
| 14 | lululemon | shop.lululemon.com | [link](https://shop.lululemon.com/p/mens-jackets-and-hoodies-hoodies/Ease-The-Day-Hoodie/_/prod20009295) | Akamai Bot Manager |
| 15 | hyatt | www.hyatt.com | [link](https://www.hyatt.com/park-hyatt/en-US/nycph-park-hyatt-new-york) | Kasada |
| 16 | macys | www.macys.com | [link](https://www.macys.com/xapi/discover/v1/page?pathname=/shop/womens/clothing/pants/Upc_bops_purchasable/10&id=157&_navigationType=BROWSE&_shoppingMode=SITE&sortBy=BEST_SELLERS&productsPerPage=120&_application=SITE&_regionCode=US&currencyCode=USD&_deviceType=DESKTOP&_customerState=GUEST&_additionalStoreLocations=10&pageIndex=1) | Akamai Bot Manager |
| 17 | etsy | www.etsy.com | [link](https://www.etsy.com/listing/4409872205/linen-sheer-cafe-curtains-farmhouse) | DataDome |
| 18 | yelp | www.yelp.com | [link](https://www.yelp.com/search?find_desc=mexican+restuarant&find_loc=Chicago%2C+IL) | DataDome |
| 19 | zara | www.zara.com | [link](https://www.zara.com/us/en/100-linen-pocket-overshirt-p00706754.html) | Akamai Bot Manager |
| 20 | louisvuitton | us.louisvuitton.com | [link](https://us.louisvuitton.com/eng-us/products/lv-tilted-sneaker-nvprod7310009v/1AJS39) | Akamai Bot Manager |
| 21 | autozone | www.autozone.com | [link](https://www.autozone.com/p/valvoline-maxlife-full-synthetic-motor-oil-vv179/539362) | DataDome |
| 22 | homedepot | www.homedepot.com | [link](https://www.homedepot.com/p/Milwaukee-M18-FUEL-18-Volt-Lithium-Ion-Brushless-Cordless-Gen-II-18-Gauge-Brad-Nailer-Tool-Only-2746-20/309752194) | Akamai Bot Manager |
| 23 | ashleyfurniture | www.ashleyfurniture.com | [link](https://www.ashleyfurniture.com/p/roanhowe_dining_table_and_4_chairs/APG-D76935-5P.html) | PerimeterX / HUMAN |
| 24 | autotrader | www.autotrader.com | [link](https://www.autotrader.com/cars-for-sale/vehicle/763249459) | Akamai Bot Manager |
| 25 | booking.com | www.booking.com | [link](https://www.booking.com/hotel/us/the-plaza.html) | AWS WAF |
| 26 | carters | www.carters.com | [link](https://www.carters.com/p/toddler-boy-polo-shirt-made-with-organic-cotton-in-stripes/V_2U855510) | PerimeterX / HUMAN |
| 27 | databricks | www.databricks.com | [link](https://www.databricks.com/company/careers/open-positions?department=Engineering&location=all) | Not classified |
| 28 | emag | www.emag.ro | [link](https://www.emag.ro/telefon-mobil-apple-iphone-17-256gb-5g-black-mg6j4zd-a/pd/DGX9FV3BM/) | AWS WAF |
| 29 | expedia | www.expedia.com | [link](https://www.expedia.com/Hotel-Search?destination=Miami%20Beach) | Akamai Bot Manager |
| 30 | glassdoor | www.glassdoor.com | [link](https://www.glassdoor.com/Job/chicago-software-engineer-jobs-SRCH_IL.0,7_IC1128808_KO8,25.htm) | Cloudflare |
| 31 | marketwatch | www.marketwatch.com | [link](https://www.marketwatch.com/investing/stock/psky) | DataDome |
| 32 | barrons | www.barrons.com | [link](https://www.barrons.com/articles/micron-stock-price-memory-chips-trump-5c6f7870) | DataDome |
| 33 | monster | www.monster.com | [link](https://www.monster.com/jobs/search?q=Software+Engineer&where=New+York%2C+NY&page=1&so=m.h.s) | DataDome |
| 34 | mouser | www.mouser.com | [link](https://www.mouser.com/ProductDetail/DFRobot/FIT1030?qs=6avfeC6zeS76UUpWZZX%252B0w%3D%3D) | Akamai Bot Manager |
| 35 | nytimes | www.nytimes.com | [link](https://www.nytimes.com/live/2026/04/07/world/iran-war-trump-news) | DataDome |
| 36 | ralphlauren | www.ralphlauren.com | [link](https://www.ralphlauren.com/men-clothing-button-down-shirts/garment-dyed-oxford-shirt/460022.html) | PerimeterX / HUMAN |
| 37 | realtor | www.realtor.com | [link](https://www.realtor.com/realestateandhomes-search/Chicago_IL) | AWS WAF |
| 38 | tripadvisor | www.tripadvisor.com | [link](https://www.tripadvisor.com/Hotels-g35805-Chicago_Illinois-Hotels.html) | DataDome |
| 39 | wsj | www.wsj.com | [link](https://www.wsj.com/livecoverage/iran-war-2026-trump-deadline-latest-news) | DataDome |
| 40 | bloomberg | www.bloomberg.com | [link](https://www.bloomberg.com/markets) | PerimeterX / HUMAN |
| 41 | reuters | www.reuters.com | [link](https://www.reuters.com/) | DataDome |
| 42 | alibaba | www.alibaba.com | [link](https://www.alibaba.com/product-detail/Composite-Material-Breathable-Lumbar-Back-Brace_1601619518415.html) | Not classified |
| 43 | coupang | www.coupang.com | [link](https://www.coupang.com/vp/products/7579231557) | Akamai Bot Manager |
| 44 | ebay | www.ebay.com | [link](https://www.ebay.com/itm/227305215584) | Akamai Bot Manager |
| 45 | target | www.target.com | [link](https://www.target.com/p/1-39-6-34-x2-39-6-34-so-happy-you-39-re-here-doormat-natural-threshold-8482/-/A-82253413) | PerimeterX / HUMAN |
| 46 | nike | www.nike.com | [link](https://www.nike.com/t/kd19-purple-stuff-basketball-shoes-vrLfPVAT/IH1117-500) | Akamai Bot Manager |
| 47 | stockx | stockx.com | [link](https://stockx.com/air-jordan-5-retro-black-university-blue-2026) | Cloudflare |
| 48 | cargurus | www.cargurus.com | [link](https://www.cargurus.com/details/452063396?) | DataDome |
| 49 | cars.com | www.cars.com | [link](https://www.cars.com/vehicledetail/2c5991ed-0923-41c8-86f4-32c04cec7dcf/) | Cloudflare |
| 50 | crunchbase | www.crunchbase.com | [link](https://www.crunchbase.com/organization/string-ai-5443) | Cloudflare |
| 51 | verizon | www.verizon.com | [link](https://www.verizon.com/smartphones/apple-iphone-17-pro-max/) | Akamai Bot Manager |
| 52 | att | www.att.com | [link](https://www.att.com/buy/phones/samsung-galaxy-s26-ultra.html) | Akamai Bot Manager |
| 53 | goodrx | www.goodrx.com | [link](https://www.goodrx.com/advil) | PerimeterX / HUMAN |
| 54 | LinkedIn | www.linkedin.com | [link](https://www.linkedin.com/company/microsoft/) | In-house / custom |
| 55 | X (Twitter) | x.com | [link](https://x.com/NASA) | In-house / custom |
| 56 | Instagram | www.instagram.com | [link](https://www.instagram.com/nasa/) | In-house / custom |
| 57 | Ticketmaster | www.ticketmaster.com | [link](https://www.ticketmaster.com/taylor-swift-tickets/artist/1094215) | Ticketmaster (in-house) |
| 58 | Capterra | www.capterra.com | [link](https://www.capterra.com/project-management-software/) | Cloudflare |
| 59 | Reddit | www.reddit.com | [link](https://www.reddit.com/r/webscraping/) | In-house / custom |
| 60 | Google Search | www.google.com | [link](https://www.google.com/search?q=openai) | In-house / custom |
| 61 | YouTube | www.youtube.com | [link](https://www.youtube.com/watch?v=dQw4w9WgXcQ) | In-house / custom |
| 62 | TikTok | www.tiktok.com | [link](https://www.tiktok.com/@nba) | In-house / custom |
| 63 | Airbnb | www.airbnb.com | [link](https://www.airbnb.com/s/Paris--France/homes) | DataDome |
| 64 | Best Buy | www.bestbuy.com | [link](https://www.bestbuy.com/site/apple-airpods-pro-2nd-generation-with-magsafe-case-usb-c-white/6447382.p?skuId=6447382) | Akamai Bot Manager |
| 65 | Redfin | www.redfin.com | [link](https://www.redfin.com/city/30749/NY/New-York) | AWS WAF |
| 66 | Foot Locker | www.footlocker.com | [link](https://www.footlocker.com/category/mens/shoes.html) | Kasada |
| 67 | SeatGeek | seatgeek.com | [link](https://seatgeek.com/taylor-swift-tickets) | DataDome |
| 68 | Facebook | www.facebook.com | [link](https://www.facebook.com/NASA) | In-house / custom |
| 69 | GOAT | www.goat.com | [link](https://www.goat.com/brand/air-jordan) | Cloudflare |
| 70 | Yahoo Finance | finance.yahoo.com | [link](https://finance.yahoo.com/quote/AAPL/) | Not classified |
| 71 | DigiKey | www.digikey.com | [link](https://www.digikey.com/en/products/detail/texas-instruments/NE555P/277057) | Cloudflare |
| 72 | Rightmove | www.rightmove.co.uk | [link](https://www.rightmove.co.uk/property-for-sale/London.html) | Not classified |
| 73 | Instacart | www.instacart.com | [link](https://www.instacart.com/store/costco/storefront) | Not classified |
| 74 | Pinterest | www.pinterest.com | [link](https://www.pinterest.com/nasa/) | In-house / custom |
| 75 | ZipRecruiter | www.ziprecruiter.com | [link](https://www.ziprecruiter.com/Jobs/Software-Engineer) | Cloudflare |
| 76 | Vinted | www.vinted.fr | [link](https://www.vinted.fr/catalog?search_text=nike) | DataDome |
| 77 | Idealista | www.idealista.com | [link](https://www.idealista.com/venta-viviendas/madrid-madrid/) | DataDome |
| 78 | Leboncoin | www.leboncoin.fr | [link](https://www.leboncoin.fr/c/voitures) | DataDome |
| 79 | StubHub | www.stubhub.com | [link](https://www.stubhub.com/taylor-swift-tickets) | AWS WAF |
| 80 | Skyscanner | www.skyscanner.net | [link](https://www.skyscanner.net/transport/flights/nyca/lond/) | PerimeterX / HUMAN |
| 81 | Congress.gov | www.congress.gov | [link](https://www.congress.gov/bill/117th-congress/house-bill/3684) | Cloudflare |
| 82 | TradingView | www.tradingview.com | [link](https://www.tradingview.com/symbols/NASDAQ-AAPL/) | Not classified |
| 83 | CoinMarketCap | coinmarketcap.com | [link](https://coinmarketcap.com/currencies/bitcoin/) | Not classified |
| 84 | Apartments.com | www.apartments.com | [link](https://www.apartments.com/new-york-ny/) | Akamai Bot Manager |
| 85 | Zoopla | www.zoopla.co.uk | [link](https://www.zoopla.co.uk/for-sale/property/london/) | Cloudflare |
| 86 | Trustpilot | www.trustpilot.com | [link](https://www.trustpilot.com/review/amazon.com) | AWS WAF |
| 87 | Yellow Pages | www.yellowpages.com | [link](https://www.yellowpages.com/chicago-il/restaurants) | Cloudflare |
| 88 | Kayak | www.kayak.com | [link](https://www.kayak.com/flights/NYC-CHI) | Not classified |
| 89 | Allmenus | www.allmenus.com | [link](https://www.allmenus.com/il/chicago/223447-chicagoland-pizza-pasta/menu/) | Not classified |
| 90 | temu | www.temu.com | [link](https://www.temu.com/60w-fast-charging-usb-to-type-c-cable-high-speed-data-sync-for-iphone-15-16-for--pro-for-ipad-for-samsung-for-xiaomi-other-devices-g-605554969821574.html) | Temu (in-house) |
| 91 | delta | www.delta.com | [link](https://www.delta.com/flight-status/search) | Akamai Bot Manager |
| 92 | kroger | www.kroger.com | [link](https://www.kroger.com/p/kroger-vitamin-d-whole-milk/0001111041700) | Akamai Bot Manager |
| 93 | axs | www.axs.com | [link](https://www.axs.com/events) | Cloudflare |
| 94 | roblox | www.roblox.com | [link](https://www.roblox.com/discover) | Fastly Bot Management |
| 95 | draftkings | sportsbook.draftkings.com | [link](https://sportsbook.draftkings.com/leagues/football/nfl) | Akamai Bot Manager |
| 96 | bing | www.bing.com | [link](https://www.bing.com/search?q=openai) | Not classified |
| 97 | github | github.com | [link](https://github.com/facebook/react) | Not classified |
| 98 | stackoverflow | stackoverflow.com | [link](https://stackoverflow.com/questions/11227809/why-is-processing-a-sorted-array-faster-than-processing-an-unsorted-array) | Cloudflare |
| 99 | arxiv | arxiv.org | [link](https://arxiv.org/abs/1706.03762) | Not classified |

## License

[MIT](LICENSE)
