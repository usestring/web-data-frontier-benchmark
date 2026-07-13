import axios from "axios";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const client = lazy(() =>
  axios.create({
    baseURL: "https://scraper-api.decodo.com",
    headers: {
      // Decodo authenticates via HTTP Basic with the base64 token as-is
      Authorization: `Basic ${requireEnv("DECODO_API_KEY")}`,
      "Content-Type": "application/json"
    }
  })
);

/** Decodo Web Scraping API — universal target, premium pool, raw HTML. https://help.decodo.com/docs */
export const decodo: Provider = {
  name: "decodo",
  envKeys: ["DECODO_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request<{ results?: Array<{ content?: string; status_code?: number }> }>({
        url: "/v2/scrape",
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
