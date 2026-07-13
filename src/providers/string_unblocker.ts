import axios from "axios";
import { normalizeBody } from "../check.js";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const STRING_UNBLOCKER_BASE_URL = "https://request.usestring.ai/v1";

const client = lazy(() =>
  axios.create({
    baseURL: STRING_UNBLOCKER_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireEnv("STRING_UNBLOCKER_API_KEY")}`
    }
  })
);

/** String Unblocker — POST /fetch on the hosted service. */
export const stringUnblocker: Provider = {
  name: "string_unblocker",
  envKeys: ["STRING_UNBLOCKER_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request<{ data?: unknown; statusCode?: number }>({
        url: "/fetch",
        method: "POST",
        data: { url, method: "GET" },
        signal,
        timeout: timeoutMs
      });

      return { body: normalizeBody(response.data.data), statusCode: response.data.statusCode ?? response.status };
    } catch (e) {
      throw new Error(httpErrorMessage("String Unblocker", e));
    }
  }
};
