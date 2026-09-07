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

/** Firecrawl — POST /v2/scrape, rawHtml format, vendor-default proxy path, cache disabled. https://docs.firecrawl.dev */
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
          // Deliberately no `proxy`. An earlier adapter forced `proxy: "enhanced"` on the theory that
          // every provider should run its highest tier. A Firecrawl engineer showed the default path
          // performs better; we removed it and their success rate rose 7.7 points in the August 2026
          // run. Leaving it unset also keeps us on Firecrawl's own default, which already retries on
          // the enhanced pool when the basic one is blocked. Do not re-add it.
          // https://www.usestring.ai/blog/web-data-frontier-benchmark-august-2026
          // Always fetch a fresh page response — disable Firecrawl's cache lookup
          maxAge: 0
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
