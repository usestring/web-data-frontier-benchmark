import axios from "axios";
import { normalizeBody } from "../check.js";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

type ApifyActorInput = Record<string, unknown>;

interface ApifyActorRoute {
  actorId: string;
  input(url: URL): ApifyActorInput;
}

interface ApifyActorRun {
  actorId: string;
  input: ApifyActorInput;
}

type UrlInputShape = "request-list" | "request" | "strings" | "string";

function urlRoute(
  actorId: string,
  inputKey: string,
  shape: UrlInputShape,
  limitKey?: string,
  extra: ApifyActorInput = {}
): ApifyActorRoute {
  return {
    actorId,
    input(url) {
      let value: unknown;
      switch (shape) {
        case "request-list":
          value = [{ url: url.href }];
          break;
        case "request":
          value = { url: url.href };
          break;
        case "strings":
          value = [url.href];
          break;
        case "string":
          value = url.href;
          break;
      }

      return { ...extra, [inputKey]: value, ...(limitKey ? { [limitKey]: 1 } : {}) };
    }
  };
}

function customRoute(actorId: string, input: (url: URL) => ApifyActorInput): ApifyActorRoute {
  return { actorId, input };
}

function pathPart(url: URL, index: number): string {
  return url.pathname.split("/").filter(Boolean)[index] ?? "";
}

// Store search ranking changes over time, so each supported host has one fixed source-specific Actor.
const APIFY_ACTOR_ROUTES: Record<string, ApifyActorRoute> = {
  "allegro.pl": urlRoute("memo23~allegro-scraper", "startUrls", "request-list"),
  "www.amazon.com": urlRoute("junglee~amazon-crawler", "categoryOrProductUrls", "request-list", "maxItemsPerStartUrl"),
  "www.indeed.com": urlRoute("misceres~indeed-scraper", "startUrls", "request-list", "maxItemsPerSearch"),
  "www.lowes.com": urlRoute("gio21~lowes-scraper", "startUrls", "strings", "maxResults"),
  "www.walmart.com": urlRoute(
    "e-commerce~walmart-product-detail-scraper",
    "startUrls",
    "request-list",
    "maxProductsPerStartUrl"
  ),
  "www.zillow.com": urlRoute("maxcopell~zillow-scraper", "searchUrls", "request-list", "resultsLimit"),
  "www.g2.com": customRoute("jupri~g2-explorer", (url) => ({
    query: pathPart(url, 1),
    mode: "categories",
    software_categories: [pathPart(url, 1)],
    limit: 1
  })),
  "www.asda.com": urlRoute("solidcode~asda-scraper", "startUrls", "strings", "maxResults"),
  "shop.lululemon.com": urlRoute("autofacts~lululemon-scraper", "startUrls", "request"),
  "www.hyatt.com": customRoute("mrdoe~hyatt-hotel-scraper", () => ({ hotel: "Park Hyatt New York", limit: 1 })),
  "www.macys.com": urlRoute("lexis-solutions~macys-scraper", "startUrls", "request-list", "maxItems"),
  "www.etsy.com": urlRoute("crawlerbros~etsy-scraper", "startUrls", "request-list", "maxItems"),
  "www.yelp.com": urlRoute("tri_angle~yelp-scraper", "directUrls", "strings"),
  "www.zara.com": urlRoute("shahidirfan~zara-product-scraper", "startUrl", "string"),
  "www.homedepot.com": urlRoute("khadinakbar~home-depot-scraper", "productUrls", "strings", "maxResults"),
  "www.booking.com": urlRoute("voyager~booking-scraper", "startUrls", "request-list", "maxItems"),
  "www.emag.ro": urlRoute("extractify-labs~emag-scraper", "startUrls", "request-list", "maxItems"),
  "www.expedia.com": urlRoute("memo23~expedia-scraper", "startUrls", "strings", "maxItems"),
  "www.glassdoor.com": urlRoute("memo23~glassdoor-scraper-ppr", "startUrls", "request-list", "maxItems"),
  "www.marketwatch.com": urlRoute("lexis-solutions~marketwatch-scraper", "startUrls", "request-list", "maxItems"),
  "www.barrons.com": urlRoute("xtracto~barrons-scraper", "urls", "strings", "limit"),
  "www.monster.com": urlRoute("blackfalcondata~monster-scraper", "startUrls", "strings", "maxResults"),
  "www.mouser.com": urlRoute("gio21~mouser-scraper", "startUrls", "strings", "maxResults"),
  "www.nytimes.com": urlRoute("xtracto~nytimes-scraper", "urls", "strings", "limit"),
  "www.realtor.com": urlRoute("crawlerbros~realtor-scraper", "startUrls", "request-list", "maxItems"),
  "www.tripadvisor.com": urlRoute("maxcopell~tripadvisor", "startUrls", "request-list"),
  "www.bloomberg.com": urlRoute("piotrv1001~bloomberg-category-news-scraper", "searchUrls", "strings", "maxItemsPerUrl"),
  "www.reuters.com": urlRoute("xtracto~reuters-scraper", "urls", "strings", "limit"),
  "www.coupang.com": urlRoute("abotapi~coupang-scraper", "urls", "strings"),
  "www.ebay.com": urlRoute("ivanvs~ebay-scraper-pay-per-result", "urls", "request-list"),
  "www.target.com": urlRoute("automation-lab~target-scraper", "productUrls", "strings"),
  "www.nike.com": urlRoute("fatihtahta~nike-scraper", "startUrls", "strings", "limit"),
  "stockx.com": urlRoute("piotrv1001~stockx-listings-scraper", "productUrls", "strings", "maxItems"),
  "www.cargurus.com": urlRoute("fayoussef~cargurus-listings-scraper", "startUrls", "request-list"),
  "www.cars.com": urlRoute("fatihtahta~cars-com-scraper", "startUrls", "strings", "limit"),
  "www.crunchbase.com": customRoute("curious_coder~crunchbase-scraper", (url) => ({
    search: { url: url.href },
    maxItems: 1
  })),
  "www.goodrx.com": customRoute("fortuitous_pirate~goodrx-scraper", (url) => ({
    drugName: pathPart(url, 0),
    maxResults: 1
  })),
  "www.linkedin.com": urlRoute("pratikdani~linkedin-company-profile-scraper", "url", "string"),
  "x.com": urlRoute("apidojo~tweet-scraper", "startUrls", "strings", "maxItems"),
  "www.instagram.com": urlRoute("apify~instagram-scraper", "directUrls", "strings", "resultsLimit", {
    resultsType: "details"
  }),
  "www.ticketmaster.com": urlRoute("lentic_clockss~ticketmaster-scraper", "startUrls", "strings", "maxResults"),
  "www.reddit.com": urlRoute("trudax~reddit-scraper-lite", "startUrls", "request-list", "maxItems"),
  "www.google.com": customRoute("apify~google-search-scraper", (url) => ({
    queries: url.searchParams.get("q") ?? url.href,
    maxPagesPerQuery: 1
  })),
  "www.youtube.com": urlRoute("streamers~youtube-scraper", "startUrls", "request-list", "maxResults"),
  "www.tiktok.com": customRoute("clockworks~tiktok-profile-scraper", (url) => ({
    profiles: [pathPart(url, 0).replace(/^@/, "")],
    resultsPerPage: 1
  })),
  "www.airbnb.com": urlRoute("tri_angle~airbnb-scraper", "startUrls", "request-list", "maxResults"),
  "www.bestbuy.com": urlRoute("crawlerbros~bestbuy-scraper", "productUrls", "strings", "maxResults"),
  "www.redfin.com": urlRoute("lukass~redfin-scraper", "startUrls", "request-list", "maxItems"),
  "www.footlocker.com": urlRoute("dazzling_quantifier~footlocker-scraper", "startUrls", "request-list", "maxProducts"),
  "seatgeek.com": urlRoute("lentic_clockss~seatgeek-scraper", "startUrls", "strings", "maxResults"),
  "www.facebook.com": urlRoute("apify~facebook-posts-scraper", "startUrls", "request-list", "resultsLimit"),
  "www.goat.com": urlRoute("abotapi~goat-sneaker-scraper", "urls", "strings", "maxItems"),
  "finance.yahoo.com": customRoute("architjn~yahoo-finance", (url) => ({ tickers: [pathPart(url, 1)] })),
  "www.digikey.com": customRoute("maximedupre~digikey", (url) => ({
    target: "products",
    productInputs: [url.href],
    maxItems: 1
  })),
  "www.rightmove.co.uk": urlRoute("memo23~rightmove-scraper", "startUrls", "request-list", "maxItems"),
  "www.instacart.com": urlRoute("piotrv1001~instacart-scraper", "startUrls", "request-list", "maxItems"),
  "www.pinterest.com": urlRoute("fatihtahta~pinterest-scraper-search", "startUrls", "strings", "limit"),
  "www.ziprecruiter.com": customRoute("orgupdate~ziprecruiter-jobs-scraper", (url) => ({
    country: "United States",
    location: "",
    includeKeyword: pathPart(url, 1).replaceAll("-", " "),
    pages: 1
  })),
  "www.vinted.fr": urlRoute("epicscrapers~vinted-search-scraper", "startUrls", "request-list"),
  "www.idealista.com": urlRoute("dz_omar~idealista-scraper-api", "Property_urls", "request-list"),
  "www.leboncoin.fr": urlRoute("fatihtahta~leboncoin-fr-scraper", "startUrls", "strings", "limit"),
  "www.stubhub.com": urlRoute("parseforge~stubhub-scraper", "startUrls", "strings", "maxItems"),
  "www.skyscanner.net": urlRoute("memo23~skyscanner-scraper", "startUrls", "request-list", "maxItems"),
  "www.temu.com": customRoute("amit123~temu-products-scraper", (url) => ({
    searchQueries: [pathPart(url, 1).replace(/-g-\d+\.html$/, "").replaceAll("-", " ")],
    maxResults: 20
  })),
  "www.tradingview.com": urlRoute("crawlerbros~tradingview-scraper", "url", "string", "maxItems"),
  "coinmarketcap.com": urlRoute("shahidirfan~coinmarketcap-scraper", "url", "string"),
  "www.apartments.com": urlRoute("epctex~apartments-scraper-api", "startUrls", "strings", "maxItems"),
  "www.zoopla.co.uk": urlRoute("shahidirfan~zoopla-scraper", "startUrl", "string"),
  "www.trustpilot.com": urlRoute("memo23~trustpilot-scraper-ppe", "startUrls", "strings", "maxItems"),
  "www.yellowpages.com": urlRoute("trudax~yellow-pages-us-scraper", "startUrls", "request-list", "maxItems"),
  "www.kayak.com": urlRoute("solidcode~kayak-scraper", "startUrls", "strings", "maxResults"),
  "www.kroger.com": urlRoute("e-commerce~kroger-product-details-scraper", "productUrlsOrUpcsDetails", "strings"),
  "www.axs.com": urlRoute("lentic_clockss~axs-scraper", "startUrls", "strings", "maxResults"),
  "sportsbook.draftkings.com": customRoute("zen-studio~draftkings-odds", () => ({
    sport: "football",
    leagueIds: ["88808"],
    market: "game_lines",
    maxItems: 1
  })),
  "www.bing.com": customRoute("tri_angle~bing-search-scraper", (url) => ({ queries: url.href, maxPages: 1 })),
  "github.com": urlRoute("benthepythondev~github-repository-intelligence", "repositoryUrls", "string", undefined, {
    mode: "specific",
    includeReadme: true
  }),
  "stackoverflow.com": urlRoute("extremescrapes~stackoverflow-extractor", "startUrls", "request-list"),
  "arxiv.org": urlRoute("parseforge~arxiv-scraper", "startUrl", "string", "maxItems")
};

export const APIFY_ACTOR_COUNT = Object.keys(APIFY_ACTOR_ROUTES).length;

export function apifyActorRunFor(rawUrl: string): ApifyActorRun {
  const url = new URL(rawUrl);
  const route = APIFY_ACTOR_ROUTES[url.hostname];
  if (!route) {
    throw new Error(`No compatible source-specific Apify Actor for ${url.hostname}`);
  }

  return { actorId: route.actorId, input: route.input(url) };
}

const client = lazy(() =>
  axios.create({
    baseURL: "https://api.apify.com/v2",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireEnv("APIFY_TOKEN")}`
    }
  })
);

/** Apify Store, using one fixed source-specific Actor for each supported benchmark target. */
export const apify: Provider = {
  name: "apify",
  envKeys: ["APIFY_TOKEN"],
  async fetch(rawUrl, { timeoutMs, signal }) {
    try {
      const run = apifyActorRunFor(rawUrl);
      const response = await client().post(`/actors/${run.actorId}/run-sync-get-dataset-items`, run.input, {
        params: {
          clean: true,
          limit: 1,
          maxItems: 1,
          timeout: Math.max(1, Math.min(300, Math.floor(timeoutMs / 1000)))
        },
        signal,
        timeout: timeoutMs
      });

      return { body: normalizeBody(response.data), statusCode: response.status };
    } catch (e) {
      throw new Error(httpErrorMessage("Apify", e));
    }
  }
};
