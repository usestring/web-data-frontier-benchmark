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

/** Scrapingdog — premium proxies, stealth mode, raw HTML. https://www.scrapingdog.com/documentation/ */
export const scrapingdog: Provider = {
  name: "scrapingdog",
  envKeys: ["SCRAPINGDOG_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request<string>({
        url: "/scrape",
        method: "GET",
        // premium routes residential proxies and stealth_mode targets Cloudflare-class protection;
        // dynamic=false keeps the raw HTML. stealth_mode is documented at 10 credits, but its cost
        // alongside premium is unpublished.
        params: { url, premium: true, dynamic: false, stealth_mode: true },
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
