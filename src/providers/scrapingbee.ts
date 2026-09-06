import scrapingbee from "scrapingbee";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const client = lazy(() => new scrapingbee.ScrapingBeeClient(requireEnv("SCRAPINGBEE_API_KEY")));

interface ScrapingBeeJsonResponse {
  body?: string;
  "initial-status-code"?: number;
}

/** ScrapingBee — official SDK `htmlApi`, stealth proxy pool + JS render. https://www.scrapingbee.com/documentation */
export const scrapingbeeProvider: Provider = {
  name: "scrapingbee",
  envKeys: ["SCRAPINGBEE_API_KEY"],
  async fetch(url, { timeoutMs }) {
    try {
      const response = await client().htmlApi({
        url,
        // stealth_proxy is ScrapingBee's hardest pool and only works with JS rendering on (75 credits)
        params: { stealth_proxy: true, render_js: true, json_response: true },
        // Client-side socket deadline. ScrapingBee's own `timeout` param is unsupported on the
        // stealth pool, and the SDK takes no AbortSignal, so this is the only bound available.
        timeout: timeoutMs
      });

      const decoded = new TextDecoder().decode(response.data);
      const json = JSON.parse(decoded) as ScrapingBeeJsonResponse;
      return { body: json.body ?? "", statusCode: json["initial-status-code"] ?? 200 };
    } catch (e) {
      throw new Error(httpErrorMessage("ScrapingBee", e));
    }
  }
};

/**
 * ScrapingBee Auto Mode — the same account, escalating tiers instead of a pinned one.
 * A second entry rather than a replacement: Auto Mode stops at the first configuration ScrapingBee
 * judges successful, and it cannot see this benchmark's containsText marker, so it may stop below the
 * tier that would have passed here. Running both measures that gap instead of assuming it.
 * https://www.scrapingbee.com/blog/introducing-auto-mode/
 */
export const scrapingbeeAutoProvider: Provider = {
  name: "scrapingbee_auto",
  envKeys: ["SCRAPINGBEE_API_KEY"],
  async fetch(url, { timeoutMs }) {
    try {
      const response = await client().htmlApi({
        url,
        // Auto Mode picks render_js/premium_proxy/stealth_proxy itself and rejects them with a 400 if
        // sent. max_cost pins the ceiling at the stealth tier so the entry stays cost-bounded.
        params: { mode: "auto", max_cost: 75, json_response: true },
        timeout: timeoutMs
      });

      const decoded = new TextDecoder().decode(response.data);
      const json = JSON.parse(decoded) as ScrapingBeeJsonResponse;
      return { body: json.body ?? "", statusCode: json["initial-status-code"] ?? 200 };
    } catch (e) {
      throw new Error(httpErrorMessage("ScrapingBee Auto Mode", e));
    }
  }
};
