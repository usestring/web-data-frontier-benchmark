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

/** Scrapfly Scrape API — ASP on, residential pool, JS render. https://scrapfly.io/docs/scrape-api/getting-started */
export const scrapfly: Provider = {
  name: "scrapfly",
  envKeys: ["SCRAPFLY_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request<{ result?: { content?: string; status_code?: number } }>({
        url: "/scrape",
        method: "GET",
        // ASP already upgrades proxy_pool and browser on its own, but only after a block. Pinning the
        // residential pool and rendering starts every request at Scrapfly's top tier (25 credits).
        params: { url, asp: true, render_js: true, proxy_pool: "public_residential_pool" },
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
