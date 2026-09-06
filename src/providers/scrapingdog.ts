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

/** Scrapingdog — premium proxies, JS render, stealth mode. https://www.scrapingdog.com/documentation/ */
export const scrapingdog: Provider = {
  name: "scrapingdog",
  envKeys: ["SCRAPINGDOG_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request<string>({
        url: "/scrape",
        method: "GET",
        // premium routes residential proxies, dynamic renders JS, stealth_mode targets Cloudflare-class
        // protection. Scrapingdog prices premium+dynamic at 25 credits and stealth_mode at 10; the
        // combined figure is unpublished, so treat 35 as the worst case.
        params: { url, premium: true, dynamic: true, stealth_mode: true },
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
