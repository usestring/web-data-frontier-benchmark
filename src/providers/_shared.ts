import axios from "axios";

/** Returns the env var or throws — providers are only invoked once their keys are confirmed present. */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var ${key}`);
  return value;
}

/** Builds the value on first access and caches it — defers env reads / client creation until run time. */
export function lazy<T>(factory: () => T): () => T {
  let cached: T;
  let built = false;
  return () => {
    if (!built) {
      cached = factory();
      built = true;
    }
    return cached;
  };
}

/** Uniform error text: surface the upstream HTTP status when axios has one, otherwise the raw message. */
export function httpErrorMessage(provider: string, e: unknown): string {
  if (axios.isAxiosError(e) && e.response?.status) {
    return `${provider} request failed with status ${e.response.status}`;
  }
  return `Error making ${provider} request: ${e instanceof Error ? e.message : String(e)}`;
}

/** Reads one response header from an axios response (or error response), if present. */
export function headerValue(headers: unknown, name: string): string | undefined {
  if (!headers || typeof headers !== "object") return undefined;
  const value = (headers as Record<string, unknown>)[name.toLowerCase()];
  return typeof value === "string" && value ? value : undefined;
}
