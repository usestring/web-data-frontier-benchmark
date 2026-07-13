import type { WebAccessBenchmarkConfig, WebAccessTestConfig } from "./types.js";

export const WEB_ACCESS_BENCHMARK_CONFIG: WebAccessBenchmarkConfig = {
  attemptsPerTest: 5,
  timeoutMs: 90_000,
  concurrency: 4,
  providerConcurrency: 4,
  delayBetweenRequestsMs: 500,
};

export const WEB_ACCESS_ALL_TESTS: WebAccessTestConfig[] = [
  {
    name: "allegro",
    url: "https://allegro.pl/oferta/bukiet-roz-roze-sztuczne-kwiaty-jak-zywe-prezent-walentynki-piekne-mydlane-16842279548",
    containsText: "BUKIET RÓŻ RÓŻE SZTUCZNE KWIATY JAK ŻYWE PREZENT",
  },
  {
    name: "Amazon",
    url: "https://www.amazon.com/Combination-Lock-Shackle-Security-Mounting-Bicycle-Secure/dp/B08KCWFMRS",
    containsText:
      "Bike Lock Heavy Duty Anti Theft, Keyed Bike U Lock with 4FT Security Cable and Mounting Bracket for Road Bike, Mountain Bike, Folding Bike",
  },
  {
    name: "canadagoose",
    url: "https://www.canadagoose.com/us/en/pr/macmillan-parka-2080M.html",
    containsText: "The MacMillan Parka provides protection for city living regardless of the weather.",
  },
  {
    name: "indeed",
    url: "https://www.indeed.com/l-chicago,-il-jobs.html",
    containsText: "jobs in Chicago, IL",
  },
  {
    name: "lowes",
    url: "https://www.lowes.com/pd/James-Martin-Vanities-Bristol-72-in-Whitewashed-Walnut-Undermount-Double-Sink-Bathroom-Vanity-with-Eternal-Jasmine-Pearl-Quartz-Top/5013813827",
    containsText:
      "James Martin Vanities Bristol 72-in Whitewashed Walnut Undermount Double Sink Bathroom Vanity with Eternal Jasmine Pearl Quartz Top",
  },
  {
    name: "safeway",
    url: "https://www.safeway.com/shop/product-details.960457331.html",
    containsText: "Waterfront Bistro Shrimp Coconut With Sweet Chili Sauce",
  },
  {
    name: "walmart",
    url: "https://www.walmart.com/ip/Nike-Men-s-Short-Sleeve-Just-Do-It-Swoosh-Graphic-Active-T-Shirt-Navy-L/2501897203",
    containsText: "Short Sleeve Just Do It Swoosh Graphic Active",
  },
  {
    name: "zillow",
    url: "https://www.zillow.com/homes/for_sale/",
  },
  {
    name: "saksfifthavenue",
    url: "https://www.saksfifthavenue.com/product/loewe-striped-slim-zip-front-top-0400026423433.html",
    containsText: "LOEWE's long-sleeve top features a staggered stripe print",
  },
  {
    name: "neimanmarcus",
    url: "https://www.neimanmarcus.com/p/gorski-reversible-toscana-lamb-shearling-jacket-prod282500173",
    containsText: "Reversible Toscana Lamb Shearling Jacket",
  },
  {
    name: "g2",
    url: "https://www.g2.com/categories/emerging-ai-software?order=g2_score&page=92&_pjax=%23ajax-container#product-list",
  },
  {
    name: "aa",
    url: "https://www.aa.com/homePage.do",
  },
  {
    name: "asda",
    url: "https://www.asda.com/groceries/product/frozen-waffles-shapes-wedges/mccain-potato-smiles-454g/478142",
    containsText: "McCain Potato Smiles 454g",
  },
  {
    name: "lululemon",
    url: "https://shop.lululemon.com/p/mens-jackets-and-hoodies-hoodies/Ease-The-Day-Hoodie/_/prod20009295",
    containsText: "Ease The Day Hoodie",
  },
  {
    name: "hyatt",
    url: "https://www.hyatt.com/loyalty/en-US",
  },
  {
    name: "macys",
    url: "https://www.macys.com/xapi/discover/v1/page?pathname=/shop/womens/clothing/pants/Upc_bops_purchasable/10&id=157&_navigationType=BROWSE&_shoppingMode=SITE&sortBy=BEST_SELLERS&productsPerPage=120&_application=SITE&_regionCode=US&currencyCode=USD&_deviceType=DESKTOP&_customerState=GUEST&_additionalStoreLocations=10&pageIndex=1",
    containsText: "Build your wardrobe with Macy's Women's Pants, offering a variety of styles from tailored trousers",
  },
  {
    name: "etsy",
    url: "https://www.etsy.com/listing/4409872205/linen-sheer-cafe-curtains-farmhouse",
    containsText: "Linen Sheer Cafe Curtains",
  },
  {
    name: "yelp",
    url: "https://www.yelp.com/search?find_desc=mexican+restuarant&find_loc=Chicago%2C+IL",
    containsText: "Top 10 Best mexican restaurant Near Chicago, Illinois",
  },
  {
    name: "zara",
    url: "https://www.zara.com/us/en/100-linen-pocket-overshirt-p00706754.html",
    containsText: "100% LINEN POCKET OVERSHIRT",
  },
  {
    name: "louisvuitton",
    url: "https://us.louisvuitton.com/eng-us/products/lv-tilted-sneaker-nvprod7310009v/1AJS39",
    containsText: "LV Tilted Sneaker",
  },
  {
    name: "autozone",
    url: "https://www.autozone.com/p/valvoline-maxlife-full-synthetic-motor-oil-vv179/539362",
    containsText: "Valvoline Full Synthetic High Mileage Full Synthetic 5W-30 Motor Oil 1 Quart",
  },
  {
    name: "homedepot",
    url: "https://www.homedepot.com/p/Milwaukee-M18-FUEL-18-Volt-Lithium-Ion-Brushless-Cordless-Gen-II-18-Gauge-Brad-Nailer-Tool-Only-2746-20/309752194",
    containsText: "M18 FUEL 18-Volt Lithium-Ion Brushless Cordless Gen II 18-Gauge Brad Nailer (Tool-Only)",
  },
  {
    name: "ashleyfurniture",
    url: "https://www.ashleyfurniture.com/p/roanhowe_dining_table_and_4_chairs/APG-D76935-5P.html",
    containsText: "Roanhowe Dining Table and 4 Chairs",
  },
  {
    name: "autotrader",
    url: "https://www.autotrader.com/cars-for-sale/vehicle/717276609",
    containsText: "New 2024 Chevrolet Silverado 1500 W/T AWD/4WD",
  },
  {
    name: "booking.com",
    url: "https://flights.booking.com/flights/NYC.CITY-CHI.CITY/?type=ROUNDTRIP&adults=1&cabinClass=ECONOMY&children=&from=NYC.CITY&to=CHI.CITY&fromCountry=US&toCountry=US&fromLocationName=New+York&toLocationName=Chicago&depart=2026-06-17&return=2026-06-20&sort=BEST&travelPurpose=leisure&ca_source=flights_index_sb&aid=304142&label=gen173nr-10CAEoggI46AdIM1gEaKcCiAEBmAEzuAEHyAEP2AED6AEB-AEBiAIBqAIBuAKevtXOBsACAdICJGYyMTQxZGNkLTY1MDAtNDE4NC05Y2ZlLWM4YjhjNTM0ODNiZdgCAeACAQ",
  },
  {
    name: "carters",
    url: "https://www.carters.com/p/toddler-boy-polo-shirt-made-with-organic-cotton-in-stripes/V_2U855510",
    containsText: "Toddler Boy Polo Shirt Made with Organic Cotton in Stripes",
  },
  {
    name: "databricks",
    url: "https://www.databricks.com/company/careers/open-positions?department=Engineering&location=all",
    containsText: "Current job openings at Databricks",
  },
  {
    name: "emag",
    url: "https://www.emag.ro/telefon-mobil-apple-iphone-17-256gb-5g-black-mg6j4zd-a/pd/DGX9FV3BM/",
    containsText: "Telefon mobil Apple iPhone 17, 256GB, 5G, Black",
  },
  {
    name: "expedia",
    url: "https://www.expedia.com/Hotel-Search?destination=Miami%20Beach%252C%20Florida%252C%20United%20States%20of%20America&regionId=8833&latLong=25.790653%252C-80.130043&flexibility=0_DAY&d1=2026-05-21&startDate=2026-05-21&d2=2026-05-23&endDate=2026-05-23&adults=2&rooms=1&typeaheadCollationId=da070ad5-8315-4ab4-aa84-69b275f288cc",
  },
  {
    name: "glassdoor",
    url: "https://www.glassdoor.com/Job/chicago-software-engineer-jobs-SRCH_IL.0,7_IC1128808_KO8,25.htm",
    containsText: "software engineer Jobs in Chicago, IL",
  },
  {
    name: "marketwatch",
    url: "https://www.marketwatch.com/investing/stock/psky",
    containsText: "Paramount Skydance Corp",
  },
  {
    name: "barrons",
    url: "https://www.barrons.com/articles/micron-stock-price-memory-chips-trump-5c6f7870",
    containsText: "Micron Stock Hits $1 Trillion. Trump and Wall Street Unite Behind the Chip Titan.",
  },
  {
    name: "monster",
    url: "https://www.monster.com/jobs/search?q=Software+Engineer&where=New+York%2C+NY&page=1&so=m.h.s",
    containsText: "Search results for",
  },
  {
    name: "mouser",
    url: "https://www.mouser.com/ProductDetail/DFRobot/FIT1030?qs=6avfeC6zeS76UUpWZZX%252B0w%3D%3D",
    containsText: "426-FIT1030",
  },
  {
    name: "nytimes",
    url: "https://www.nytimes.com/live/2026/04/07/world/iran-war-trump-news",
    containsText: "The United States and Israel stepped up their attacks on Iran",
  },
  {
    name: "ralphlauren",
    url: "https://www.ralphlauren.com/men-clothing-button-down-shirts/garment-dyed-oxford-shirt/460022.html",
    containsText: "Garment-Dyed Oxford Shirt",
  },
  {
    name: "realtor",
    url: "https://www.realtor.com/realestateandhomes-search/Chicago_IL",
    containsText: "Chicago, IL homes for sale",
  },
  {
    name: "tripadvisor",
    url: "https://www.tripadvisor.com/Hotels-g35805-Chicago_Illinois-Hotels.html",
    containsText: "Chicago Hotels",
  },
  {
    name: "wsj",
    url: "https://www.wsj.com/livecoverage/iran-war-2026-trump-deadline-latest-news",
    containsText: "This coverage is now concluded. For the latest developments on the war with Iran",
  },
  {
    name: "bloomberg",
    url: "https://www.bloomberg.com/markets",
    containsText: "Bloomberg L.P. All Rights Reserved.",
  },
  {
    name: "reuters",
    url: "https://www.reuters.com/",
    containsText: "Information you can trust",
  },
  {
    name: "alibaba",
    url: "https://www.alibaba.com/product-detail/Composite-Material-Breathable-Lumbar-Back-Brace_1601619518415.html",
    containsText: "Invisible Double X-Strap Posture Corrector for Women Men",
  },
  {
    name: "coupang",
    url: "https://www.coupang.com/vp/products/7579231557",
    containsText: "보스 QC 헤드폰",
  },
  {
    name: "ebay",
    url: "https://www.ebay.com/itm/227305215584",
    containsText: "PNY GeForce RTX 4090 XLR8 Epic-X RGB OC 24GB GDDR6X GPU - Gaming Graphic Cards",
  },
  {
    name: "target",
    url: "https://www.target.com/p/1-39-6-34-x2-39-6-34-so-happy-you-39-re-here-doormat-natural-threshold-8482/-/A-82253413",
    containsText: "So Happy You're Here Coir Doormat Natural",
  },
  {
    name: "nike",
    url: "https://www.nike.com/t/kd19-purple-stuff-basketball-shoes-vrLfPVAT/IH1117-500",
    containsText: "Purple Stuff",
  },
  {
    name: "stockx",
    url: "https://stockx.com/air-jordan-5-retro-black-university-blue-2026",
    containsText: "Jordan 5 Retro",
  },
  {
    name: "cargurus",
    url: "https://www.cargurus.com/details/451977844",
    containsText: "2018 Ford F-150 King Ranch SuperCrew 4WD",
  },
  {
    name: "cars.com",
    url: "https://www.cars.com/vehicledetail/2c5991ed-0923-41c8-86f4-32c04cec7dcf/",
    containsText: "$83,990",
  },
  {
    name: "crunchbase",
    url: "https://www.crunchbase.com/organization/string-ai-5443",
    containsText: "String AI is an enterprise that provides PaaS and SaaS platform services",
  },
  {
    name: "verizon",
    url: "https://www.verizon.com/smartphones/apple-iphone-17-pro-max/",
    containsText: "Apple iPhone 17 Pro Max",
  },
  {
    name: "att",
    url: "https://www.att.com/buy/phones/samsung-galaxy-s26-ultra.html",
    containsText: "Samsung Galaxy S26 Ultra",
  },
  {
    name: "goodrx",
    url: "https://www.goodrx.com/advil",
    containsText: "About generic Advil",
  },
];
