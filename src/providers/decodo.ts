import axios from "axios";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

/**
 * Decodo issues two credentials for the same scrape: the dashboard's API key (64 hex characters),
 * sent as a Bearer token to the Web Data API, and the older base64 Basic token, sent to the Web
 * Scraping API. Both take the same request body and answer with the same `results` array.
 */
const DATA_API_KEY = /^[0-9a-f]{64}$/i;

export function decodoEndpoint(key: string): { baseURL: string; path: string; authorization: string } {
  return DATA_API_KEY.test(key)
    ? { baseURL: "https://data.decodo.com", path: "/v1/scrape", authorization: `Bearer ${key}` }
    : { baseURL: "https://scraper-api.decodo.com", path: "/v2/scrape", authorization: `Basic ${key}` };
}

const endpoint = lazy(() => decodoEndpoint(requireEnv("DECODO_API_KEY")));

const client = lazy(() =>
  axios.create({
    baseURL: endpoint().baseURL,
    headers: { Authorization: endpoint().authorization, "Content-Type": "application/json" }
  })
);

/** Decodo Web Scraping API — universal target, premium pool, raw HTML. https://help.decodo.com/docs */
export const decodo: Provider = {
  name: "decodo",
  envKeys: ["DECODO_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request<{ results?: Array<{ content?: string; status_code?: number }> }>({
        url: endpoint().path,
        method: "POST",
        // universal target + premium proxy pool + JS rendering = strongest anti-bot bypass returning raw HTML
        data: { url, target: "universal", proxy_pool: "premium", headless: "html" },
        signal,
        timeout: timeoutMs
      });

      const result = response.data.results?.[0];
      return { body: result?.content ?? "", statusCode: result?.status_code ?? response.status };
    } catch (e) {
      throw new Error(httpErrorMessage("Decodo", e));
    }
  }
};
