import axios from "axios";
import type { Provider } from "../types.js";
import { httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const client = lazy(() =>
  axios.create({
    baseURL: "https://api.scrape.do",
    // Scrape.do authenticates via the `token` query param
    params: { token: requireEnv("SCRAPEDO_API_KEY") }
  })
);

/** Scrape.do — Residential & Mobile proxies, raw HTML. https://scrape.do/documentation */
export const scrapedo: Provider = {
  name: "scrapedo",
  envKeys: ["SCRAPEDO_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request<string>({
        url: "/",
        method: "GET",
        // super=true routes Residential & Mobile networks (strongest anti-bot); render=false returns raw HTML without JS render.
        // timeout aligns Scrape.do's internal budget (60s default) with the harness timeout so it isn't cut short early.
        params: { url, super: true, render: false, timeout: timeoutMs },
        responseType: "text",
        signal,
        timeout: timeoutMs
      });

      return { body: typeof response.data === "string" ? response.data : String(response.data ?? ""), statusCode: response.status };
    } catch (e) {
      throw new Error(httpErrorMessage("Scrape.do", e));
    }
  }
};
