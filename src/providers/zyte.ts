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

/** Zyte API — POST /v1/extract, browser-rendered HTML. https://docs.zyte.com/zyte-api/usage/browser.html */
export const zyte: Provider = {
  name: "zyte",
  envKeys: ["ZYTE_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request<{ browserHtml?: string; statusCode?: number }>({
        url: "/v1/extract",
        method: "POST",
        // browserHtml is Zyte's headless-browser tier and excludes httpResponseBody. Proxy type and
        // per-domain bypass difficulty are chosen server-side and are not caller-settable.
        data: { url, browserHtml: true },
        signal,
        timeout: timeoutMs
      });

      return { body: response.data.browserHtml ?? "", statusCode: response.data.statusCode ?? response.status };
    } catch (e) {
      throw new Error(httpErrorMessage("Zyte", e));
    }
  }
};
