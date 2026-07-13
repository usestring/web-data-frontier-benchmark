import type { ClientRequest } from "node:http";
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { normalizeBody } from "../check.js";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const OXYLABS_WEB_UNBLOCKER_HOST = "unblock.oxylabs.io";
const OXYLABS_WEB_UNBLOCKER_PORT = 60000;

class WebUnblockerAgent extends HttpsProxyAgent<string> {
  connect(req: ClientRequest, opts: Parameters<HttpsProxyAgent<string>["connect"]>[1]) {
    return super.connect(req, { ...opts, rejectUnauthorized: false } as typeof opts);
  }
}

const agent = lazy(() => {
  // Secret holds the full `username:password` pair (split on the first colon so passwords containing ":" survive).
  const credentials = requireEnv("OXYLABS_WEB_UNBLOCKER_CREDENTIALS");
  const separatorIndex = credentials.indexOf(":");
  if (separatorIndex === -1) {
    throw new Error("OXYLABS_WEB_UNBLOCKER_CREDENTIALS must be in 'username:password' format");
  }
  const username = credentials.slice(0, separatorIndex);
  const password = credentials.slice(separatorIndex + 1);
  const proxyUrl = `https://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${OXYLABS_WEB_UNBLOCKER_HOST}:${OXYLABS_WEB_UNBLOCKER_PORT}`;
  return new WebUnblockerAgent(proxyUrl, { rejectUnauthorized: false });
});

/** Oxylabs Web Unblocker — proxy that returns the target page. https://developers.oxylabs.io/products/web-unblocker */
export const oxylabs: Provider = {
  name: "oxylabs",
  envKeys: ["OXYLABS_WEB_UNBLOCKER_CREDENTIALS"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await axios.request<string>({
        url,
        method: "GET",
        headers: { "X-Oxylabs-Geo-Location": "United States" },
        httpsAgent: agent(),
        proxy: false,
        responseType: "text",
        signal,
        timeout: timeoutMs,
        // Inspect blocked/non-2xx bodies instead of throwing on them
        validateStatus: () => true
      });

      return { body: normalizeBody(response.data), statusCode: response.status };
    } catch (e) {
      throw new Error(httpErrorMessage("Oxylabs Web Unblocker", e));
    }
  }
};
