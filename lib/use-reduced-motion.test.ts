import { afterEach, describe, expect, it, vi } from "vitest";
import { prefersReducedMotion, REDUCED_MOTION_QUERY } from "./use-reduced-motion";

function mockMatchMedia(matches: boolean) {
  const spy = vi.fn((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal("matchMedia", spy);
  return spy;
}

describe("prefersReducedMotion", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads the OS setting", () => {
    const spy = mockMatchMedia(true);
    expect(prefersReducedMotion()).toBe(true);
    expect(spy).toHaveBeenCalledWith(REDUCED_MOTION_QUERY);
  });

  it("is false when the setting is off", () => {
    mockMatchMedia(false);
    expect(prefersReducedMotion()).toBe(false);
  });

  it("is false where matchMedia does not exist (jsdom, old browsers) instead of throwing", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(prefersReducedMotion()).toBe(false);
  });
});
