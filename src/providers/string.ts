import axios from "axios";
import { normalizeBody } from "../check.js";
import type { Provider } from "../types.js";
import { headerValue, httpErrorMessage, lazy, requireEnv } from "./_shared.js";

const STRING_BASE_URL = "https://request.usestring.ai/v1";
/** String returns this header on /fetch responses; quote it when reporting a failed request. */
const TRACE_HEADER = "x-trace-id";

const client = lazy(() =>
  axios.create({
    baseURL: STRING_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireEnv("STRING_API_KEY")}`,
    },
  }),
);

/** String — POST /fetch on the hosted service. */
export const string: Provider = {
  name: "string",
  envKeys: ["STRING_API_KEY"],
  async fetch(url, { timeoutMs, signal }) {
    try {
      const response = await client().request<Record<string, unknown> & { data?: unknown; statusCode?: number }>({
        url: "/fetch",
        method: "POST",
        data: { url, method: "GET" },
        signal,
        timeout: timeoutMs,
      });

      const payload = response.data;
      const body = normalizeBody(payload && typeof payload === "object" && "data" in payload ? payload.data : payload);
      const traceId = headerValue(response.headers, TRACE_HEADER);
      return { body, statusCode: payload?.statusCode ?? response.status, ...(traceId ? { traceId } : {}) };
    } catch (e) {
      const error = new Error(httpErrorMessage("String", e));
      const traceId = axios.isAxiosError(e) ? headerValue(e.response?.headers, TRACE_HEADER) : undefined;
      throw traceId ? Object.assign(error, { traceId }) : error;
    }
  },
};
