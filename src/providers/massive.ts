import axios from "axios";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const client = lazy(() =>
  axios.create({
    baseURL: "https://render.joinmassive.com",
    headers: { Authorization: `Bearer ${requireEnv("MASSIVE_API_KEY")}` },
  }),
);

/** Massive Web Render Browser API — GET /browser, HTML returned directly. https://docs.joinmassive.com/web-render/browser */
export const massive: Provider = {
  name: "massive",
  envKeys: ["MASSIVE_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request<string>({
        url: "/browser",
        method: "GET",
        // Disable caching so every attempt measures a fresh fetch.
        params: { url, difficulty: "high", format: "raw", mode: "sync", expiration: 0 },
        responseType: "text",
        signal,
        timeout: timeoutMs,
      });

      if (response.status !== 200) {
        throw new Error(`Expected completed page content, received status ${response.status}`);
      }

      return { body: typeof response.data === "string" ? response.data : String(response.data ?? ""), statusCode: response.status };
    } catch (e) {
      throw new Error(httpErrorMessage("Massive", e));
    }
  },
};
