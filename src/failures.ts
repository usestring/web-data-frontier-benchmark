import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeBody } from "./check.js";
import { makeExecutor } from "./runner.js";
import type { AttemptResult, Provider, ProviderFetchResult, RequestExecutorFn, WebAccessTestConfig } from "./types.js";

/** Bodies larger than this are truncated on disk; the sidecar records the full size. */
export const MAX_FAILURE_BODY_BYTES = 2 * 1024 * 1024;

/** What the provider handed back for one attempt, when it handed anything back. */
export interface FailureEvidence {
  body?: unknown;
  statusCode?: number;
  traceId?: string;
}

/** Sidecar written next to each failed attempt's body. */
export interface FailureRecord {
  provider: string;
  test: string;
  url: string;
  attempt: number;
  statusCode: number | null;
  latencyMs: number;
  errorMessage: string | null;
  traceId: string | null;
  timestamp: string;
  /** Body file name, relative to the sidecar; null when the attempt produced no body (timeout, network error). */
  bodyFile: string | null;
  bodyBytes: number;
  bodyTruncated: boolean;
}

function safeName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "unnamed";
}

/** File-system safe stem for a test name and 1-based attempt number. */
export function failureFileStem(testName: string, attempt: number): string {
  return `${safeName(testName)}-${attempt}`;
}

/**
 * Writes `<dir>/<provider>/<test>-<attempt>.json` for a failed attempt, plus the body it was scored on
 * (`.html` when it looks like markup, `.txt` otherwise), capped at MAX_FAILURE_BODY_BYTES.
 */
export function writeFailure(
  dir: string,
  provider: string,
  test: WebAccessTestConfig,
  attempt: number,
  result: AttemptResult,
  evidence: FailureEvidence,
  now: Date = new Date()
): FailureRecord {
  const providerDir = join(dir, safeName(provider));
  mkdirSync(providerDir, { recursive: true });
  const stem = failureFileStem(test.name, attempt);

  let bodyFile: string | null = null;
  let bodyBytes = 0;
  let bodyTruncated = false;
  if (evidence.body !== undefined) {
    const body = Buffer.from(normalizeBody(evidence.body));
    bodyBytes = body.length;
    bodyTruncated = body.length > MAX_FAILURE_BODY_BYTES;
    bodyFile = `${stem}${/^\s*</.test(body.subarray(0, 512).toString()) ? ".html" : ".txt"}`;
    writeFileSync(join(providerDir, bodyFile), bodyTruncated ? body.subarray(0, MAX_FAILURE_BODY_BYTES) : body);
  }

  const record: FailureRecord = {
    provider,
    test: test.name,
    url: test.url,
    attempt,
    statusCode: evidence.statusCode ?? null,
    latencyMs: result.latencyMs,
    errorMessage: result.errorMessage ?? null,
    traceId: evidence.traceId ?? null,
    timestamp: now.toISOString(),
    bodyFile,
    bodyBytes,
    bodyTruncated
  };
  writeFileSync(join(providerDir, `${stem}.json`), `${JSON.stringify(record, null, 2)}\n`);
  return record;
}

function traceIdOf(error: unknown): string | undefined {
  if (error && typeof error === "object" && "traceId" in error && typeof error.traceId === "string") return error.traceId;
  return undefined;
}

/**
 * Same executor as `makeExecutor`, but every failed attempt also leaves its evidence under `dir`.
 * It observes the adapter's single fetch; it never adds a request, a retry or a request parameter.
 */
export function makeRecordingExecutor(provider: Provider, dir: string): RequestExecutorFn {
  return async (test, timeoutMs, attemptIndex = 0) => {
    let fetched: ProviderFetchResult | undefined;
    let thrown: unknown;
    const observed: Provider = {
      ...provider,
      fetch: async (url, opts) => {
        try {
          fetched = await provider.fetch(url, opts);
          return fetched;
        } catch (error) {
          thrown = error;
          throw error;
        }
      }
    };

    const result = await makeExecutor(observed)(test, timeoutMs);
    if (result.success) return result;

    const traceId = fetched?.traceId ?? traceIdOf(thrown);
    try {
      writeFailure(dir, provider.name, test, attemptIndex + 1, result, {
        body: fetched?.body,
        statusCode: fetched?.statusCode,
        traceId
      });
    } catch (error) {
      console.warn(`  could not record failure for ${provider.name}/${test.name}: ${error instanceof Error ? error.message : error}`);
    }
    return traceId ? { ...result, traceId } : result;
  };
}
