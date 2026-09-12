import assert from "node:assert/strict";
import test from "node:test";
import { makeExecutor } from "../runner.js";
import { WEB_ACCESS_ALL_TESTS } from "../tests.const.js";
import { APIFY_ACTOR_COUNT, apify, apifyActorRunFor } from "./apify.js";

test("builds a direct URL Actor input", () => {
  assert.deepEqual(
    apifyActorRunFor("https://www.amazon.com/example/dp/B000000000"),
    {
      actorId: "junglee~amazon-crawler",
      input: {
        categoryOrProductUrls: [{ url: "https://www.amazon.com/example/dp/B000000000" }],
        maxItemsPerStartUrl: 1
      }
    }
  );
});

test("builds a source-specific search Actor input", () => {
  assert.deepEqual(apifyActorRunFor("https://www.google.com/search?q=web+access"), {
    actorId: "apify~google-search-scraper",
    input: { queries: "web access", maxPagesPerQuery: 1 }
  });
});

test("counts a target without a compatible Actor as a failed attempt", async () => {
  const result = await makeExecutor(apify)(
    {
      name: "canadagoose",
      url: "https://www.canadagoose.com/us/en/pr/macmillan-parka-2080M.html"
    },
    100
  );

  assert.equal(result.success, false);
  assert.match(result.errorMessage ?? "", /No compatible source-specific Apify Actor for www\.canadagoose\.com/);
});

test("covers the measured source-specific Actor set", () => {
  let supported = 0;
  for (const fixture of WEB_ACCESS_ALL_TESTS) {
    try {
      apifyActorRunFor(fixture.url);
      supported++;
    } catch (error) {
      assert.match(String(error), /No compatible source-specific Apify Actor/);
    }
  }

  assert.deepEqual(
    { routes: APIFY_ACTOR_COUNT, supported, failed: WEB_ACCESS_ALL_TESTS.length - supported },
    { routes: 78, supported: 78, failed: 21 }
  );
});
