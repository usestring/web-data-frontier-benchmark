import type { WebAccessBenchmarkConfig, WebAccessTestConfig } from "./types.js";

export const WEB_ACCESS_BENCHMARK_CONFIG: WebAccessBenchmarkConfig = {
  attemptsPerTest: 5,
  timeoutMs: 90_000,
  concurrency: 2,
  providerConcurrency: 15,
  delayBetweenRequestsMs: 500,
};

/**
 * The scored suite: targets that separate providers. A target is table stakes, and stays out, when more
 * than 10 of the 17 providers in the October 30, 2026 run pass it (at least 3 of 5 attempts).
 * See "Target selection" in the README.
 */
export const WEB_ACCESS_HEADLINE_TESTS: WebAccessTestConfig[] = [
  {
    name: "indeed",
    url: "https://www.indeed.com/l-chicago,-il-jobs.html",
    antibot: "cloudflare",
    industry: "Jobs & hiring",
    containsText: "jobs in Chicago, IL",
  },
  {
    name: "lowes",
    url: "https://www.lowes.com/pd/James-Martin-Vanities-Bristol-72-in-Whitewashed-Walnut-Undermount-Double-Sink-Bathroom-Vanity-with-Eternal-Jasmine-Pearl-Quartz-Top/5013813827",
    antibot: "akamai",
    industry: "Retail & ecommerce",
    containsText:
      "James Martin Vanities Bristol 72-in Whitewashed Walnut Undermount Double Sink Bathroom Vanity with Eternal Jasmine Pearl Quartz Top",
  },
  {
    name: "saksfifthavenue",
    url: "https://www.saksfifthavenue.com/product/loewe-striped-slim-zip-front-top-0400026423433.html",
    antibot: "datadome",
    industry: "Fashion & luxury",
    containsText: "LOEWE's long-sleeve top features a staggered stripe print",
  },
  {
    name: "neimanmarcus",
    url: "https://www.neimanmarcus.com/p/gorski-reversible-toscana-lamb-shearling-jacket-prod282500173",
    antibot: "datadome",
    industry: "Fashion & luxury",
    containsText: "Reversible Toscana Lamb Shearling Jacket",
  },
  {
    name: "aa",
    url: "https://www.aa.com/homePage.do",
    antibot: "akamai",
    industry: "Travel",
    containsText: "Book low fares to destinations around the world and find the latest deals on airline tickets",
  },
  {
    name: "yelp",
    url: "https://www.yelp.com/search?find_desc=mexican+restuarant&find_loc=Chicago%2C+IL",
    antibot: "datadome",
    industry: "Reviews & local",
    containsText: "Top 10 Best mexican restaurant Near Chicago, Illinois",
  },
  {
    name: "louisvuitton",
    url: "https://us.louisvuitton.com/eng-us/products/lv-tilted-sneaker-nvprod7310009v/1AJS39",
    antibot: "akamai",
    industry: "Fashion & luxury",
    containsText: "LV Tilted Sneaker",
  },
  {
    name: "sallybeauty",
    url: "https://www.sallybeauty.com/hair-color/",
    antibot: "perimeterx",
    industry: "Retail & ecommerce",
    containsText: "Hair Dye",
  },
  {
    name: "autotrader",
    url: "https://www.autotrader.com/cars-for-sale/vehicle/763249459",
    antibot: "akamai",
    industry: "Marketplaces & classifieds",
    containsText: "Used 2024 Audi A7",
  },
  {
    name: "ysl",
    url: "https://www.ysl.com/en-us/shop-women/handbags",
    antibot: "akamai",
    industry: "Fashion & luxury",
    containsText: "HANDBAGS",
  },
  {
    name: "zoominfo",
    url: "https://www.zoominfo.com/c/microsoft/24904409",
    antibot: "perimeterx",
    industry: "Reviews & local",
    containsText: "About Microsoft",
  },
  {
    name: "emag",
    url: "https://www.emag.ro/telefon-mobil-apple-iphone-17-256gb-5g-black-mg6j4zd-a/pd/DGX9FV3BM/",
    antibot: "aws-waf",
    industry: "Retail & ecommerce",
    containsText: "Telefon mobil Apple iPhone 17, 256GB, 5G, Black",
  },
  {
    name: "transat",
    url: "https://www.transat.com/en-CA",
    antibot: "incapsula",
    industry: "Travel",
    containsText: "Why travel with us?",
  },
  {
    name: "mouser",
    url: "https://www.mouser.com/ProductDetail/DFRobot/FIT1030?qs=6avfeC6zeS76UUpWZZX%252B0w%3D%3D",
    antibot: "akamai",
    industry: "Retail & ecommerce",
    containsText: "426-FIT1030",
  },
  {
    name: "realtor",
    url: "https://www.realtor.com/realestateandhomes-search/Chicago_IL",
    antibot: "aws-waf",
    industry: "Real estate",
    containsText: "Chicago, IL homes for sale",
  },
  {
    name: "reuters",
    url: "https://www.reuters.com/",
    antibot: "datadome",
    industry: "News & finance",
    containsText: "Information you can trust",
  },
  {
    name: "coupang",
    url: "https://www.coupang.com/vp/products/7579231557",
    antibot: "akamai",
    industry: "Retail & ecommerce",
    containsText: "보스 QC 헤드폰",
  },
  {
    name: "chewy",
    url: "https://www.chewy.com/b/dry-food-294",
    antibot: "kasada",
    industry: "Retail & ecommerce",
    containsText: "Dry Dog Food",
  },
  {
    name: "stockx",
    url: "https://stockx.com/air-jordan-5-retro-black-university-blue-2026",
    antibot: "cloudflare",
    industry: "Marketplaces & classifieds",
    containsText: "Jordan 5 Retro",
  },
  {
    name: "cargurus",
    url: "https://www.cargurus.com/details/440130010",
    antibot: "datadome",
    industry: "Marketplaces & classifieds",
    containsText: "2008 Toyota Camry Solara",
  },
  {
    name: "Ticketmaster",
    url: "https://www.ticketmaster.com/taylor-swift-tickets/artist/1094215",
    antibot: "ticketmaster",
    industry: "Tickets & events",
    containsText: "Taylor Swift",
  },
  {
    name: "Best Buy",
    url: "https://www.bestbuy.com/site/apple-airpods-pro-2nd-generation-with-magsafe-case-usb-c-white/6447382.p?skuId=6447382",
    antibot: "akamai",
    industry: "Retail & ecommerce",
    containsText: "AirPods Pro",
  },
  {
    name: "compass",
    url: "https://www.compass.com/homes-for-sale/chicago-il/",
    antibot: "aws-waf",
    industry: "Real estate",
    containsText: "Discover Your Perfect Home",
  },
  {
    name: "imdb",
    url: "https://www.imdb.com/chart/top/",
    antibot: "aws-waf",
    industry: "Reviews & local",
    containsText: "IMDb Top 250 movies",
  },
  {
    name: "StubHub",
    url: "https://www.stubhub.com/taylor-swift-tickets",
    antibot: "aws-waf",
    industry: "Tickets & events",
    containsText: "Taylor Swift",
  },
  {
    name: "Skyscanner",
    url: "https://www.skyscanner.net/transport/flights/nyca/lond/",
    antibot: "perimeterx",
    industry: "Travel",
    containsText: "London",
  },
  {
    name: "binance",
    url: "https://www.binance.com/en/markets/overview",
    antibot: "aws-waf",
    industry: "News & finance",
    containsText: "Cryptocurrency Market",
  },
  {
    name: "seek",
    url: "https://www.seek.com.au/software-engineer-jobs",
    antibot: "cloudflare",
    industry: "Jobs & hiring",
    containsText: "Software Engineer Jobs",
  },
  {
    name: "Apartments.com",
    url: "https://www.apartments.com/new-york-ny/",
    antibot: "akamai",
    industry: "Real estate",
    containsText: "New York",
  },
  {
    name: "temu",
    url: "https://www.temu.com/60w-fast-charging-usb-to-type-c-cable-high-speed-data-sync-for-iphone-15-16-for--pro-for-ipad-for-samsung-for-xiaomi-other-devices-g-605554969821574.html",
    antibot: "temu",
    industry: "Retail & ecommerce",
    containsText: "60W Fast Charging USB to Type-C Cable, High-Speed Data Sync",
  },
  {
    name: "kroger",
    url: "https://www.kroger.com/p/kroger-vitamin-d-whole-milk/0001111041700",
    antibot: "akamai",
    industry: "Grocery & food",
    containsText: `"upc":"0001111041700"`,
  },
  {
    name: "axs",
    url: "https://www.axs.com/events",
    antibot: "cloudflare",
    industry: "Tickets & events",
    containsText: "Official Tickets and Your Source for Live Entertainment",
  },
  {
    name: "roblox",
    url: "https://www.roblox.com/discover",
    antibot: "fastly",
    industry: "Gaming & betting",
    containsText: "Top Roblox Games",
  },
  {
    name: "buybuybaby",
    url: "https://buybuybaby.bedbathandbeyond.com/Baby/Cloud-Muslin-Sage-WHite-5pc-Bedding-Set-Levtex-Baby/43435980/product.html",
    industry: "Retail & ecommerce",
    containsText: "Cloud Muslin Sage/WHite 5pc Bedding Set - Levtex Baby",
  },
];

/**
 * Well-known sites buyers ask about by name. Most providers pass them, so they fail the rule above and
 * never count toward the headline score. Each provider's result on them is reported on its own.
 */
export const WEB_ACCESS_BUYER_TESTS: WebAccessTestConfig[] = [
  {
    name: "walmart",
    url: "https://www.walmart.com/ip/Nike-Men-s-Short-Sleeve-Just-Do-It-Swoosh-Graphic-Active-T-Shirt-Navy-L/2501897203",
    antibot: "perimeterx",
    industry: "Retail & ecommerce",
    containsText: "Short Sleeve Just Do It Swoosh Graphic Active",
  },
  {
    name: "target",
    url: "https://www.target.com/p/1-39-6-34-x2-39-6-34-so-happy-you-39-re-here-doormat-natural-threshold-8482/-/A-82253413",
    antibot: "perimeterx",
    industry: "Retail & ecommerce",
    containsText: "So Happy You're Here Coir Doormat Natural",
  },
];
