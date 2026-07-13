import axios from "axios";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const client = lazy(() =>
  axios.create({
    baseURL: "https://sdk.nimbleway.com",
    headers: {
      Authorization: `Bearer ${requireEnv("NIMBLE_API_KEY")}`,
      "Content-Type": "application/json"
    }
  })
);

/** Nimble Web API — POST /v1/extract, raw HTML over residential IP. https://docs.nimbleway.com */
export const nimble: Provider = {
  name: "nimble",
  envKeys: ["NIMBLE_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request<{ data?: { html?: string }; status_code?: number }>({
        url: "/v1/extract",
        method: "POST",
        // render:false returns raw HTML over residential Nimble IP (premium proxy, no headless)
        data: { url, render: false },
        signal,
        timeout: timeoutMs
      });

      return { body: response.data.data?.html ?? "", statusCode: response.data.status_code ?? response.status };
    } catch (e) {
      throw new Error(httpErrorMessage("Nimble", e));
    }
  }
};
