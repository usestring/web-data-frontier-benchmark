import assert from "node:assert/strict";
import test from "node:test";
import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { APIFY_PROXY_USERNAME, apifyProxyUrl, createApifyProvider } from "./apify.js";

const PROXY_PASSWORD = "apify_proxy_secret:with/odd chars";
const TARGET = "https://example.com/page";

function fetchOptions() {
  return { timeoutMs: 1234, signal: new AbortController().signal };
}

function withProxyPassword(password: string | undefined, run: () => Promise<void>): Promise<void> {
  const previous = process.env.APIFY_PROXY_PASSWORD;
  if (password === undefined) delete process.env.APIFY_PROXY_PASSWORD;
  else process.env.APIFY_PROXY_PASSWORD = password;
  return run().finally(() => {
    if (previous === undefined) delete process.env.APIFY_PROXY_PASSWORD;
    else process.env.APIFY_PROXY_PASSWORD = previous;
  });
}

function stubRequest(outcome: { response?: Partial<AxiosResponse<string>>; error?: unknown }) {
  const calls: AxiosRequestConfig[] = [];
  const request = (async (config: AxiosRequestConfig) => {
    calls.push(config);
    if (outcome.error) throw outcome.error;
    return { data: "", status: 200, statusText: "OK", headers: {}, config, ...outcome.response };
  }) as typeof axios.request;
  return { calls, request };
}

function assertApifyProxy(proxy: URL) {
  assert.equal(proxy.protocol, "http:");
  assert.equal(proxy.hostname, "proxy.apify.com");
  assert.equal(proxy.port, "8000");
  assert.equal(proxy.username, APIFY_PROXY_USERNAME);
  assert.equal(decodeURIComponent(proxy.password), PROXY_PASSWORD);
}

test("builds the documented connection string with the password URL-encoded", () => {
  const url = apifyProxyUrl(PROXY_PASSWORD);

  assert.match(url, /:apify_proxy_secret%3Awith%2Fodd%20chars@/);
  assertApifyProxy(new URL(url));
});

test("registers on the proxy password, not the API token", () => {
  assert.deepEqual(createApifyProvider().envKeys, ["APIFY_PROXY_PASSWORD"]);
});

test("tunnels a plain GET of the target through the anti-bot proxy group", () =>
  withProxyPassword(PROXY_PASSWORD, async () => {
    const { calls, request } = stubRequest({ response: { data: "<html>ok</html>" } });
    const options = fetchOptions();

    const result = await createApifyProvider(request).fetch(TARGET, options);

    assert.deepEqual(result, { body: "<html>ok</html>", statusCode: 200 });
    assert.equal(calls.length, 1);
    const [config] = calls;
    assert.equal(config.url, TARGET);
    assert.equal(config.method, "GET");
    assert.equal(config.proxy, false);
    assert.equal(config.responseType, "text");
    assert.equal(config.timeout, options.timeoutMs);
    assert.equal(config.signal, options.signal);
    assert.ok(config.httpsAgent instanceof HttpsProxyAgent);
    assertApifyProxy((config.httpsAgent as HttpsProxyAgent<string>).proxy);
  }));

test("reports the target's own non-2xx status instead of throwing", () =>
  withProxyPassword(PROXY_PASSWORD, async () => {
    const { calls, request } = stubRequest({ response: { data: "<html>blocked</html>", status: 403 } });

    const result = await createApifyProvider(request).fetch(TARGET, fetchOptions());

    assert.deepEqual(result, { body: "<html>blocked</html>", statusCode: 403 });
    assert.equal(calls[0].validateStatus?.(403), true);
    assert.equal(calls[0].validateStatus?.(503), true);
  }));

test("surfaces a proxy-level HTTP failure by status", () =>
  withProxyPassword(PROXY_PASSWORD, async () => {
    const error = new AxiosError("Proxy Authentication Required", AxiosError.ERR_BAD_REQUEST, undefined, undefined, {
      status: 407
    } as AxiosResponse);
    const { request } = stubRequest({ error });

    await assert.rejects(createApifyProvider(request).fetch(TARGET, fetchOptions()), {
      message: "Apify Proxy request failed with status 407"
    });
  }));

test("wraps a transport error with the provider name", () =>
  withProxyPassword(PROXY_PASSWORD, async () => {
    const { request } = stubRequest({ error: new Error("socket hang up") });

    await assert.rejects(createApifyProvider(request).fetch(TARGET, fetchOptions()), {
      message: "Error making Apify Proxy request: socket hang up"
    });
  }));

test("fails before any request when the proxy password is missing", () =>
  withProxyPassword(undefined, async () => {
    const { calls, request } = stubRequest({});

    await assert.rejects(createApifyProvider(request).fetch(TARGET, fetchOptions()), {
      message: "Error making Apify Proxy request: Missing required env var APIFY_PROXY_PASSWORD"
    });
    assert.equal(calls.length, 0);
  }));
