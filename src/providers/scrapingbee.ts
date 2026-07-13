import scrapingbee from "scrapingbee";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const client = lazy(() => new scrapingbee.ScrapingBeeClient(requireEnv("SCRAPINGBEE_API_KEY")));

interface ScrapingBeeJsonResponse {
  body?: string;
  "initial-status-code"?: number;
}

/** ScrapingBee — official SDK `htmlApi`, JS render + JSON response. https://www.scrapingbee.com/documentation */
export const scrapingbeeProvider: Provider = {
  name: "scrapingbee",
  envKeys: ["SCRAPINGBEE_API_KEY"],
  async fetch(url) {
    try {
      const response = await client().htmlApi({
        url,
        params: { render_js: true, json_response: true }
      });

      const decoded = new TextDecoder().decode(response.data);
      const json = JSON.parse(decoded) as ScrapingBeeJsonResponse;
      return { body: json.body ?? "", statusCode: json["initial-status-code"] ?? 200 };
    } catch (e) {
      throw new Error(httpErrorMessage("ScrapingBee", e));
    }
  }
};
