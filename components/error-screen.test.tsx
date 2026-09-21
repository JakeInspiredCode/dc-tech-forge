import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ErrorScreen from "./error-screen";

describe("ErrorScreen", () => {
  const html = renderToStaticMarkup(<ErrorScreen error={new Error("Cannot read properties of undefined")} reset={() => {}} />);

  it("says what happened and offers the ordinary ways on", () => {
    expect(html).toContain('role="alert"');
    expect(html).toContain("Cannot read properties of undefined");
    expect(html).toContain("Try again");
    expect(html).toContain('href="/"');
  });

  it("offers a way out of a crash that repeats: backup first, then reset", () => {
    expect(html).toContain("Download a backup");
    expect(html).toContain("Reset local data");
    // Reset is two steps — the destructive button is not on screen until asked for.
    expect(html).not.toContain("Yes, erase everything");
  });
});
