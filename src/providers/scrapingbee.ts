import scrapingbee from "scrapingbee";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const client = lazy(() => new scrapingbee.ScrapingBeeClient(requireEnv("SCRAPINGBEE_API_KEY")));

interface ScrapingBeeJsonResponse {
  body?: string;
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
      // Score the final status: ScrapingBee's own HTTP status (any 2xx is 200; 404/410/413 pass through;
      // any other target status becomes a 500, which axios throws on). initial-status-code in the JSON is
      // the pre-redirect status, so a page that redirected and then loaded would read as a 3xx failure.
      return { body: json.body ?? "", statusCode: response.status };
    } catch (e) {
      throw new Error(httpErrorMessage("ScrapingBee", e));
    }
  }
};
