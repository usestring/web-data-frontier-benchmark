import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { normalizeBody } from "../check.js";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const APIFY_PROXY_HOST = "proxy.apify.com";
const APIFY_PROXY_PORT = 8000;
/**
 * The proxy username carries Apify's routing parameters. Only the anti-bot group is named: it has no sessions, and
 * pinning a country shrinks the pool it can bypass with.
 */
export const APIFY_PROXY_USERNAME = "groups-UNBLOCKER";

/** The password is the Console's Proxy password, not the API token. */
export function apifyProxyUrl(proxyPassword: string): string {
  return `http://${APIFY_PROXY_USERNAME}:${encodeURIComponent(proxyPassword)}@${APIFY_PROXY_HOST}:${APIFY_PROXY_PORT}`;
}

/** Builds the provider around an injectable transport so request shaping and failure handling are testable offline. */
export function createApifyProvider(request: typeof axios.request = axios.request): Provider {
  const agent = lazy(() => new HttpsProxyAgent(apifyProxyUrl(requireEnv("APIFY_PROXY_PASSWORD"))));

  return {
    name: "apify",
    envKeys: ["APIFY_PROXY_PASSWORD"],
    async fetch(url, { timeoutMs, signal }) {
      try {
        const response = await request<string>({
          url,
          method: "GET",
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
        throw new Error(httpErrorMessage("Apify Proxy", e));
      }
    }
  };
}

/** Apify Proxy's anti-bot group — a proxy that returns the target page. https://docs.apify.com/proxy */
export const apify = createApifyProvider();
