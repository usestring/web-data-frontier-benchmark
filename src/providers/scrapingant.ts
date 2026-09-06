import axios from "axios";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const client = lazy(() =>
  axios.create({
    baseURL: "https://api.scrapingant.com",
    // ScrapingAnt authenticates via the `x-api-key` header
    headers: { "x-api-key": requireEnv("SCRAPINGANT_API_KEY") }
  })
);

/** ScrapingAnt — /v2/general, residential pool + headless browser. https://docs.scrapingant.com/api-basics */
export const scrapingant: Provider = {
  name: "scrapingant",
  envKeys: ["SCRAPINGANT_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request<string>({
        url: "/v2/general",
        method: "GET",
        // Residential pool plus headless rendering is ScrapingAnt's strongest combination (125 credits)
        params: { url, browser: true, proxy_type: "residential" },
        signal,
        timeout: timeoutMs
      });

      return { body: typeof response.data === "string" ? response.data : "", statusCode: response.status };
    } catch (e) {
      throw new Error(httpErrorMessage("ScrapingAnt", e));
    }
  }
};
