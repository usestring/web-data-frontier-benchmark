import scrapingbee from "scrapingbee";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const client = lazy(() => new scrapingbee.ScrapingBeeClient(requireEnv("SCRAPINGBEE_API_KEY")));

interface ScrapingBeeJsonResponse {
  body?: string;
  "initial-status-code"?: number;
}

/** ScrapingBee — official SDK `htmlApi`, Auto Mode with a 75-credit ceiling. */
export const scrapingbeeProvider: Provider = {
  name: "scrapingbee",
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
      throw new Error(httpErrorMessage("ScrapingBee", e));
    }
  }
};
