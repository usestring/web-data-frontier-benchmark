import axios from "axios";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const client = lazy(() =>
  axios.create({
    baseURL: "https://api.scrapingdog.com",
    // Scrapingdog authenticates via the `api_key` query param
    params: { api_key: requireEnv("SCRAPINGDOG_API_KEY") }
  })
);

/** Scrapingdog — premium proxies, raw HTML. https://docs.scrapingdog.com/web-scraping-api */
export const scrapingdog: Provider = {
  name: "scrapingdog",
  envKeys: ["SCRAPINGDOG_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request<string>({
        url: "/scrape",
        method: "GET",
        // premium=true routes residential proxies (strongest anti-bot); dynamic=false returns raw HTML without JS render
        params: { url, premium: true, dynamic: false },
        responseType: "text",
        signal,
        timeout: timeoutMs
      });

      return { body: typeof response.data === "string" ? response.data : String(response.data ?? ""), statusCode: response.status };
    } catch (e) {
      throw new Error(httpErrorMessage("Scrapingdog", e));
    }
  }
};
