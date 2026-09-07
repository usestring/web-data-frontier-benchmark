import axios from "axios";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const client = lazy(() =>
  axios.create({
    baseURL: "https://api.scrapfly.io",
    // Scrapfly authenticates via the `key` query param
    params: { key: requireEnv("SCRAPFLY_API_KEY") }
  })
);

/** Scrapfly Scrape API — ASP on, residential pool, raw HTML. https://scrapfly.io/docs/scrape-api/getting-started */
export const scrapfly: Provider = {
  name: "scrapfly",
  envKeys: ["SCRAPFLY_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request<{ result?: { content?: string; status_code?: number } }>({
        url: "/scrape",
        method: "GET",
        // ASP bypasses anti-bot and upgrades proxy_pool itself, but only after a block; pinning the
        // residential pool starts every request there. render_js=false returns the raw HTTP HTML.
        params: { url, asp: true, render_js: false, proxy_pool: "public_residential_pool" },
        signal,
        timeout: timeoutMs
      });

      return {
        body: response.data.result?.content ?? "",
        statusCode: response.data.result?.status_code ?? response.status
      };
    } catch (e) {
      throw new Error(httpErrorMessage("Scrapfly", e));
    }
  }
};
