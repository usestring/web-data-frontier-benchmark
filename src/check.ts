import type { AttemptResult } from "./types.js";

/** Fetchers return strings, but a few providers hand back JSON objects — normalize before inspection. */
export function normalizeBody(data: unknown): string {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (Buffer.isBuffer(data)) return data.toString();
  return JSON.stringify(data);
}

/**
 * A request passes on a 2xx status plus (when specified) the expected text appearing in the body.
 * Block detection is intentionally omitted — the public benchmark relies on status + containsText alone.
 */
export function validateResponse(
  body: string,
  statusCode: number,
  latencyMs: number,
  containsText?: string
): AttemptResult {
  if (statusCode < 200 || statusCode >= 300) {
    return { success: false, latencyMs, errorMessage: `Status ${statusCode}` };
  }

  if (containsText && !body.toLowerCase().includes(containsText.toLowerCase())) {
    return { success: false, latencyMs, errorMessage: "Missing expected text" };
  }

  return { success: true, latencyMs };
}
