import axios from "axios";
import { normalizeBody } from "../check.js";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const client = lazy(() =>
  axios.create({
    baseURL: "https://api.scraperapi.com",
    params: { api_key: requireEnv("SCRAPERAPI_API_KEY") }
  })
);

/** ScraperAPI — GET /, ultra-premium bypass, raw HTML, cache off. https://docs.scraperapi.com/making-requests */
export const scraperapi: Provider = {
  name: "scraperapi",
  envKeys: ["SCRAPERAPI_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request({
        url: "/",
        method: "GET",
        // ultra_premium is the advanced-bypass tier and excludes `premium` (30 credits). Rendering is a
        // separate axis from the bypass, so it stays off and the response is raw HTML.
        // ultra_premium caches by default, which would break attempt independence, so caching is disabled.
        params: { url, ultra_premium: true, cache_control: "no-cache" },
        signal,
        timeout: timeoutMs
      });

      return { body: normalizeBody(response.data), statusCode: response.status };
    } catch (e) {
      throw new Error(httpErrorMessage("ScraperAPI", e));
    }
  }
};
