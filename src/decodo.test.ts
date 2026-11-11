import assert from "node:assert/strict";
import test from "node:test";
import { decodoEndpoint } from "./providers/decodo.js";

test("a dashboard API key goes to the Web Data API as a Bearer token", () => {
  // Low-entropy on purpose: a realistic-looking hex key trips gitleaks' generic-api-key rule.
  const key = "ab".repeat(32);
  assert.deepEqual(decodoEndpoint(key), {
    baseURL: "https://data.decodo.com",
    path: "/v1/scrape",
    authorization: `Bearer ${key}`
  });
});

test("a base64 Basic token keeps the Web Scraping API", () => {
  const token = Buffer.from("user:pass").toString("base64");
  assert.deepEqual(decodoEndpoint(token), {
    baseURL: "https://scraper-api.decodo.com",
    path: "/v2/scrape",
    authorization: `Basic ${token}`
  });
});
