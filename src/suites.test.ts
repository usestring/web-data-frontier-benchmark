import assert from "node:assert/strict";
import test from "node:test";
import { WEB_ACCESS_ALL_TESTS, WEB_ACCESS_SUITES } from "./tests.const.js";

test("the default suite stays the published target set", () => {
  assert.equal(WEB_ACCESS_SUITES.default, WEB_ACCESS_ALL_TESTS);
});

test("target names are unique across suites", () => {
  // `--tests` matches by name within the selected suite, so a name reused in two suites would
  // silently select a different target depending on `--suite`.
  const seen = new Map<string, string>();
  for (const [suiteName, targets] of Object.entries(WEB_ACCESS_SUITES)) {
    if (suiteName === "default") continue;
    for (const target of targets) {
      const name = target.name.toLowerCase();
      const owner = WEB_ACCESS_ALL_TESTS.some((t) => t.name.toLowerCase() === name) ? "default" : seen.get(name);
      assert.equal(owner, undefined, `target "${target.name}" in suite "${suiteName}" collides with suite "${owner}"`);
      seen.set(name, suiteName);
    }
  }
});

test("every target asserts on content, not just a 2xx", () => {
  // A target with no `containsText` passes on any 2xx, so an anti-bot block page served with a
  // 200 would score as a success and inflate that provider's rate.
  for (const [suiteName, targets] of Object.entries(WEB_ACCESS_SUITES)) {
    for (const target of targets) {
      assert.ok(target.containsText, `${suiteName}/${target.name} has no containsText`);
      assert.ok(target.url.startsWith("https://"), `${suiteName}/${target.name} is not https`);
    }
  }
});
