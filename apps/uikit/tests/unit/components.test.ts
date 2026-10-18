import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TimeField } from "@usepreface/ui/components/date-picker";
import { loadHighlighter } from "@usepreface/ui/lib/highlighter";
import { describe, expect, it } from "vitest";

describe("shared UI regressions", () => {
  it("rejects intervals that cannot advance the time picker", () => {
    expect(() => renderToStaticMarkup(createElement(TimeField, { step: 0 }))).toThrow(
      "TimeField step must be a positive integer number of minutes.",
    );
    expect(() => renderToStaticMarkup(createElement(TimeField, { step: -15 }))).toThrow(RangeError);
  });

  it("treats inherited property names as unsupported languages", async () => {
    expect(await loadHighlighter("constructor")).toBeNull();
    expect(await loadHighlighter("__proto__")).toBeNull();

    const typescript = await loadHighlighter("ts");
    expect(typescript?.highlight("const answer = 42").lines).toHaveLength(1);
  });
});
