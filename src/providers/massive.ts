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
        // difficulty=medium routes a stronger anti-bot pool; format=rendered returns HTML after JS execution (raw skips the browser render);
        // expiration=0 disables caching so every attempt hits the origin
        params: { url, difficulty: "medium", format: "rendered", expiration: 0 },
        responseType: "text",
        signal,
        timeout: timeoutMs,
      });

      return { body: typeof response.data === "string" ? response.data : String(response.data ?? ""), statusCode: response.status };
    } catch (e) {
      throw new Error(httpErrorMessage("Massive", e));
    }
  },
};
