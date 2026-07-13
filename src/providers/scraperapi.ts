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

/** ScraperAPI — GET / with the target url. https://docs.scraperapi.com/making-requests */
export const scraperapi: Provider = {
  name: "scraperapi",
  envKeys: ["SCRAPERAPI_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request({
        url: "/",
        method: "GET",
        params: { url },
        signal,
        timeout: timeoutMs
      });

      return { body: normalizeBody(response.data), statusCode: response.status };
    } catch (e) {
      throw new Error(httpErrorMessage("ScraperAPI", e));
    }
  }
};
