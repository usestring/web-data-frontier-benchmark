import axios from "axios";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const client = lazy(() =>
  axios.create({
    baseURL: "https://api.zyte.com",
    // Zyte authenticates via HTTP basic auth: API key as username, empty password
    auth: { username: requireEnv("ZYTE_API_KEY"), password: "" },
    headers: { "Content-Type": "application/json" }
  })
);

/** Zyte API — POST /v1/extract, base64 httpResponseBody. https://docs.zyte.com/zyte-api/usage/http.html */
export const zyte: Provider = {
  name: "zyte",
  envKeys: ["ZYTE_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    for (;;) {
      try {
        const response = await client().request<{ httpResponseBody?: string; statusCode?: number }>({
          url: "/v1/extract",
          method: "POST",
          data: { url, httpResponseBody: true },
          signal,
          timeout: timeoutMs
        });

        const body = response.data.httpResponseBody
          ? Buffer.from(response.data.httpResponseBody, "base64").toString("utf-8")
          : "";

        return { body, statusCode: response.data.statusCode ?? response.status };
      } catch (e) {
        // Retry retryable errors until timeout. https://docs.zyte.com/zyte-api/usage/errors.html
        const status = axios.isAxiosError(e) ? e.response?.status : undefined;
        if (signal.aborted || (status !== undefined && status < 500 && status !== 429)) {
          throw new Error(httpErrorMessage("Zyte", e));
        }
      }
    }
  }
};
