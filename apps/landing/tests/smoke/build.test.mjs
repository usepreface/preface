import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("prerenders the complete landing page rather than an SSR error shell", async () => {
  const html = await readFile(new URL("../../.output/public/index.html", import.meta.url), "utf8");

  assert.match(html, /<main id="main"/);
  assert.match(html, /Ask your company/);
  assert.match(html, /id="how-it-works"/);
  assert.match(html, /id="integrations"/);
  assert.match(html, /id="pricing"/);
  assert.match(html, /id="get-started"/);
  assert.match(html, /<footer/);
  assert.doesNotMatch(html, /Cannot read properties of null|Something went wrong/);
});
