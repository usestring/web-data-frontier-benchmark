import axios from "axios";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const client = lazy(() =>
  axios.create({
    baseURL: "https://api.context.dev/v1",
    headers: { Authorization: `Bearer ${requireEnv("CONTEXT_DEV_API_KEY")}` }
  })
);

/** Context.dev Scrape HTML API — bot-detection bypass + proxy escalation are automatic. https://docs.context.dev */
export const contextDev: Provider = {
  name: "context_dev",
  envKeys: ["CONTEXT_DEV_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request<{ html?: string }>({
        url: "/web/scrape/html",
        method: "GET",
        // maxAgeMs:0 forces a fresh live scrape so benchmark latency/blocking reflects a real fetch, not a cached hit
        params: { url, maxAgeMs: 0 },
        signal,
        timeout: timeoutMs
      });

      return { body: response.data.html ?? "", statusCode: response.status };
    } catch (e) {
      throw new Error(httpErrorMessage("Context.dev", e));
    }
  }
};
