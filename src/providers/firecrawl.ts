import axios from "axios";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const client = lazy(() =>
  axios.create({
    baseURL: "https://api.firecrawl.dev",
    headers: {
      Authorization: `Bearer ${requireEnv("FIRECRAWL_API_KEY")}`,
      "Content-Type": "application/json"
    }
  })
);

interface FirecrawlScrapeData {
  rawHtml?: string;
  metadata?: { statusCode?: number };
}

/** Firecrawl — POST /v2/scrape, rawHtml format, enhanced proxy, cache disabled. https://docs.firecrawl.dev */
export const firecrawl: Provider = {
  name: "firecrawl",
  envKeys: ["FIRECRAWL_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request<{ success: boolean; data: FirecrawlScrapeData; error?: string }>({
        url: "/v2/scrape",
        method: "POST",
        data: {
          url,
          formats: ["rawHtml"],
          onlyMainContent: false,
          // Always fetch a fresh page response — disable Firecrawl's cache lookup
          maxAge: 0,
          // Highest tier anti-bot/captcha bypass
          proxy: "enhanced"
        },
        signal,
        timeout: timeoutMs
      });

      if (!response.data.success) {
        throw new Error(`Firecrawl request failed: ${response.data.error ?? "unknown error"}`);
      }

      const data = response.data.data;
      return { body: data.rawHtml ?? "", statusCode: data.metadata?.statusCode ?? response.status };
    } catch (e) {
      throw new Error(httpErrorMessage("Firecrawl", e));
    }
  }
};
