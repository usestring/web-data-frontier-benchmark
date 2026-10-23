import { Browserbase } from "@browserbasehq/sdk";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

// The SDK retries 408/409/429/5xx and connection errors twice by default. Adapters send one request per attempt.
const client = lazy(() => new Browserbase({ apiKey: requireEnv("BROWSERBASE_API_KEY"), maxRetries: 0 }));

/** Browserbase Fetch API — cloud browser fetch with proxies. https://docs.browserbase.com */
export const browserbase: Provider = {
  name: "browserbase",
  envKeys: ["BROWSERBASE_API_KEY"],
  async fetch(url, { timeoutMs }) {
    try {
      const response = await client().fetchAPI.create({ url, proxies: true }, { timeout: timeoutMs });
      return { body: response.content ?? "", statusCode: response.statusCode };
    } catch (e) {
      throw new Error(httpErrorMessage("Browserbase", e));
    }
  }
};
