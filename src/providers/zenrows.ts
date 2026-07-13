import axios from "axios";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const client = lazy(() =>
  axios.create({
    baseURL: "https://api.zenrows.com",
    // ZenRows authenticates via the `apikey` query param
    params: { apikey: requireEnv("ZENROWS_API_KEY") }
  })
);

/** ZenRows Universal Scraper API — residential proxies + JS render. https://docs.zenrows.com */
export const zenrows: Provider = {
  name: "zenrows",
  envKeys: ["ZENROWS_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request<string>({
        url: "/v1/",
        method: "GET",
        // Highest-stealth combo: residential IPs + JS rendering unlocks most anti-bot pages; default body is raw HTML
        params: { url, premium_proxy: true, js_render: true },
        responseType: "text",
        signal,
        timeout: timeoutMs
      });

      return { body: typeof response.data === "string" ? response.data : String(response.data ?? ""), statusCode: response.status };
    } catch (e) {
      throw new Error(httpErrorMessage("ZenRows", e));
    }
  }
};
