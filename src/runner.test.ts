import assert from "node:assert/strict";
import test from "node:test";
import { makeExecutor } from "./runner.js";
import type { Provider, WebAccessTestConfig } from "./types.js";

const target: WebAccessTestConfig = { name: "example", url: "https://example.test/", containsText: "Expected Product" };

function providerReturning(body: unknown, statusCode = 200): Provider {
  return {
    name: "fake",
    envKeys: [],
    // Adapters are typed to return a string, but some SDKs hand back objects or Buffers at run time.
    fetch: async () => ({ body: body as string, statusCode })
  };
}

test("executor normalizes an object body before checking for the expected text", async () => {
  const result = await makeExecutor(providerReturning({ data: { title: "Expected Product" } }))(target, 1_000);
  assert.equal(result.success, true, result.errorMessage);
});

test("executor normalizes a Buffer body before checking for the expected text", async () => {
  const result = await makeExecutor(providerReturning(Buffer.from("<h1>Expected Product</h1>")))(target, 1_000);
  assert.equal(result.success, true, result.errorMessage);
});

test("a normalized body without the expected text still fails on content, not a type error", async () => {
  const result = await makeExecutor(providerReturning({ data: "captcha" }))(target, 1_000);
  assert.equal(result.success, false);
  assert.equal(result.errorMessage, "Missing expected text");
});

test("a string body keeps working, and a non-2xx status still fails", async () => {
  assert.equal((await makeExecutor(providerReturning("<p>expected product</p>"))(target, 1_000)).success, true);
  const redirected = await makeExecutor(providerReturning("<p>Expected Product</p>", 302))(target, 1_000);
  assert.equal(redirected.success, false);
  assert.equal(redirected.errorMessage, "Status 302");
});
