import axios from "axios";
import { normalizeBody } from "../check.js";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const client = lazy(() =>
  axios.create({
    baseURL: "https://api.brightdata.com",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireEnv("BRIGHT_API_KEY")}`
    }
  })
);

/** Bright Data Web Unblocker — POST /request to the user's zone, raw HTML back. */
export const bright: Provider = {
  name: "bright",
  // Zone is provisioned per Bright account, so it's configured separately from the API key.
  envKeys: ["BRIGHT_API_KEY", "BRIGHT_ZONE"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().post(
        "/request",
        { zone: requireEnv("BRIGHT_ZONE"), format: "raw", url, method: "GET", country: "US" },
        { signal, timeout: timeoutMs }
      );

      const brdError = response.headers["x-brd-error"] || response.headers["x-luminati-error"];
      const brdStatusCode = Number.parseInt(response.headers["x-brd-status-code"]);
      if (brdError) {
        throw new Error(`Bright Data error: ${brdError}`);
      }

      return {
        body: normalizeBody(response.data),
        statusCode: Number.isNaN(brdStatusCode) ? response.status : brdStatusCode
      };
    } catch (e) {
      throw new Error(httpErrorMessage("Bright Unblocker", e));
    }
  }
};
