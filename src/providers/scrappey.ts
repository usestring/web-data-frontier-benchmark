import axios from "axios";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const SCRAPPEY_BASE_URL = "https://publisher.scrappey.com/api/v1";

/**
 * Scrappey exposes one fetch endpoint with several engines behind it, and which engine a site needs
 * differs by site. `request` skips rendering and answers in seconds; `browser` renders; `hq` and `cc`
 * are the stealth browsers; `cccloud` is the hosted one. SITE_SETTINGS records the engine Scrappey
 * recommends per domain, plus whether the site fronts an interactive challenge (so the solver is
 * armed only where one can appear) and any page to load first to pick up cookies.
 *
 * Domains not listed fall back to DEFAULT_ENGINE.
 */
interface SiteSettings {
  engine: "request" | "browser" | "hq" | "cc" | "cccloud";
  solveCaptchas?: boolean;
  warmUp?: string;
}

const DEFAULT_ENGINE: SiteSettings["engine"] = "browser";

const SITE_SETTINGS: Record<string, SiteSettings> = {
  "allegro.pl": { engine: "hq", solveCaptchas: true },
  "www.amazon.com": { engine: "request", solveCaptchas: true },
  "www.canadagoose.com": { engine: "request", solveCaptchas: true },
  "www.indeed.com": { engine: "hq", solveCaptchas: true },
  "www.lowes.com": { engine: "browser" },
  "www.safeway.com": { engine: "request", solveCaptchas: true },
  "www.walmart.com": { engine: "request", solveCaptchas: true },
  "www.zillow.com": { engine: "browser", solveCaptchas: true },
  "www.saksfifthavenue.com": { engine: "hq", solveCaptchas: true },
  "www.neimanmarcus.com": { engine: "hq", solveCaptchas: true },
  "www.g2.com": { engine: "browser", solveCaptchas: true },
  "www.aa.com": { engine: "request" },
  "www.asda.com": { engine: "hq", solveCaptchas: true },
  "shop.lululemon.com": { engine: "hq" },
  "www.hyatt.com": { engine: "browser", solveCaptchas: true },
  "www.macys.com": { engine: "browser" },
  "www.etsy.com": { engine: "browser", solveCaptchas: true },
  "www.yelp.com": { engine: "hq", solveCaptchas: true },
  "www.zara.com": { engine: "hq" },
  "us.louisvuitton.com": { engine: "request" },
  "www.autozone.com": { engine: "hq", solveCaptchas: true },
  "www.homedepot.com": { engine: "cc" },
  "www.ashleyfurniture.com": { engine: "request", solveCaptchas: true },
  "www.autotrader.com": { engine: "hq" },
  "www.booking.com": { engine: "browser", solveCaptchas: true },
  "www.carters.com": { engine: "request", solveCaptchas: true },
  "www.databricks.com": { engine: "browser" },
  "www.emag.ro": { engine: "request", solveCaptchas: true },
  "www.expedia.com": { engine: "browser" },
  "www.glassdoor.com": { engine: "browser", solveCaptchas: true },
  "www.marketwatch.com": { engine: "cccloud", solveCaptchas: true },
  "www.barrons.com": { engine: "browser", solveCaptchas: true },
  "www.monster.com": { engine: "browser", solveCaptchas: true },
  "www.mouser.com": { engine: "hq" },
  "www.nytimes.com": { engine: "browser", solveCaptchas: true },
  "www.ralphlauren.com": { engine: "browser", solveCaptchas: true },
  "www.realtor.com": { engine: "browser", solveCaptchas: true },
  "www.tripadvisor.com": { engine: "hq", solveCaptchas: true },
  "www.wsj.com": { engine: "browser", solveCaptchas: true },
  "www.bloomberg.com": { engine: "browser", solveCaptchas: true },
  "www.reuters.com": { engine: "browser", solveCaptchas: true },
  "www.alibaba.com": { engine: "browser" },
  "www.coupang.com": { engine: "browser" },
  "www.ebay.com": { engine: "hq", warmUp: "https://www.ebay.com/" },
  "www.target.com": { engine: "browser", solveCaptchas: true },
  "www.nike.com": { engine: "request" },
  "stockx.com": { engine: "cc", solveCaptchas: true },
  "www.cargurus.com": { engine: "hq", solveCaptchas: true },
  "www.cars.com": { engine: "browser", solveCaptchas: true },
  "www.crunchbase.com": { engine: "hq", solveCaptchas: true },
  "www.verizon.com": { engine: "browser" },
  "www.att.com": { engine: "request" },
  "www.goodrx.com": { engine: "request", solveCaptchas: true },
  "www.linkedin.com": { engine: "browser" },
  "x.com": { engine: "browser" },
  "www.instagram.com": { engine: "browser" },
  "www.ticketmaster.com": { engine: "browser" },
  "www.capterra.com": { engine: "browser", solveCaptchas: true },
  "www.reddit.com": { engine: "browser" },
  "www.google.com": { engine: "request" },
  "www.youtube.com": { engine: "request" },
  "www.tiktok.com": { engine: "browser" },
  "www.airbnb.com": { engine: "browser", solveCaptchas: true },
  "www.bestbuy.com": { engine: "browser" },
  "www.redfin.com": { engine: "browser", solveCaptchas: true },
  "www.footlocker.com": { engine: "browser", solveCaptchas: true },
  "seatgeek.com": { engine: "browser", solveCaptchas: true },
  "www.facebook.com": { engine: "browser" },
  "www.goat.com": { engine: "browser", solveCaptchas: true },
  "finance.yahoo.com": { engine: "browser" },
  "www.digikey.com": { engine: "browser", solveCaptchas: true },
  "www.rightmove.co.uk": { engine: "browser" },
  "www.instacart.com": { engine: "browser" },
  "www.pinterest.com": { engine: "browser" },
  "www.ziprecruiter.com": { engine: "browser", solveCaptchas: true },
  "www.vinted.fr": { engine: "browser", solveCaptchas: true },
  "www.idealista.com": { engine: "browser", solveCaptchas: true },
  "www.leboncoin.fr": { engine: "browser", solveCaptchas: true },
  "www.stubhub.com": { engine: "request", solveCaptchas: true },
  "www.skyscanner.net": { engine: "request", solveCaptchas: true },
  "www.congress.gov": { engine: "request", solveCaptchas: true },
  "www.tradingview.com": { engine: "browser" },
  "coinmarketcap.com": { engine: "request" },
  "www.apartments.com": { engine: "browser" },
  "www.zoopla.co.uk": { engine: "browser", solveCaptchas: true },
  "www.trustpilot.com": { engine: "hq", solveCaptchas: true },
  "www.yellowpages.com": { engine: "hq", solveCaptchas: true },
  "www.kayak.com": { engine: "request" },
  "www.allmenus.com": { engine: "browser" },
  "www.temu.com": { engine: "cccloud" },
  "www.delta.com": { engine: "request" },
  "www.kroger.com": { engine: "hq" },
  "www.axs.com": { engine: "hq", solveCaptchas: true },
  "www.roblox.com": { engine: "request" },
  "sportsbook.draftkings.com": { engine: "browser" },
  "www.bing.com": { engine: "browser" },
  "github.com": { engine: "request" },
  "stackoverflow.com": { engine: "cc", solveCaptchas: true },
  "arxiv.org": { engine: "request" },
  "buybuybaby.bedbathandbeyond.com": { engine: "browser" },};

/** ccTLDs sold as generic names: they say nothing about where a site's users are. */
const GENERIC_CCTLDS = new Set(["ai", "cc", "co", "fm", "gg", "io", "ly", "me", "so", "to", "tv", "ws"]);

/** Scrappey names exit countries in full, e.g. "UnitedStates". */
const CCTLD_COUNTRY: Record<string, string> = {
  au: "Australia",
  ca: "Canada",
  de: "Germany",
  es: "Spain",
  fr: "France",
  it: "Italy",
  kr: "SouthKorea",
  nl: "Netherlands",
  pl: "Poland",
  ro: "Romania",
  uk: "UnitedKingdom"
};

/** Exit from the site's own country where its ccTLD names one, otherwise the US, where most targets are. */
function proxyCountryFor(hostname: string): string {
  const tld = hostname.split(".").pop() ?? "";
  if (tld.length === 2 && !GENERIC_CCTLDS.has(tld)) return CCTLD_COUNTRY[tld] ?? "UnitedStates";
  return "UnitedStates";
}

function requestBody(url: string): Record<string, unknown> {
  const hostname = new URL(url).hostname;
  const settings = SITE_SETTINGS[hostname] ?? { engine: DEFAULT_ENGINE };

  const body: Record<string, unknown> = {
    cmd: "request.get",
    url,
    proxyCountry: proxyCountryFor(hostname)
  };

  if (settings.engine === "request") body.requestType = "request";
  else {
    body.requestType = "browser";
    if (settings.engine !== "browser") body[settings.engine] = true;
  }

  if (settings.solveCaptchas) body.automaticallySolveCaptchas = true;
  // Loads this page first in the same browser context, so the target is requested with its cookies.
  if (settings.warmUp) body.pageUrl = settings.warmUp;

  return body;
}

interface ScrappeyResponse {
  data?: string;
  error?: string;
  solution?: { statusCode?: number; response?: string };
}

const client = lazy(() => axios.create({ baseURL: SCRAPPEY_BASE_URL, headers: { "Content-Type": "application/json" } }));

/**
 * Scrappey — one POST per attempt, no retries. The page is `solution.response` and the target's own
 * status is `solution.statusCode`. https://docs.scrappey.com
 */
export const scrappey: Provider = {
  name: "scrappey",
  envKeys: ["SCRAPPEY_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().post<ScrappeyResponse>("", requestBody(url), {
        params: { key: requireEnv("SCRAPPEY_API_KEY") },
        signal,
        timeout: timeoutMs
      });

      const payload = response.data;
      if (payload.data !== "success" || !payload.solution) {
        throw new Error(`Scrappey error: ${payload.error ?? "no solution"}`);
      }

      return { body: payload.solution.response ?? "", statusCode: payload.solution.statusCode ?? response.status };
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Scrappey error")) throw e;
      throw new Error(httpErrorMessage("Scrappey", e));
    }
  }
};
