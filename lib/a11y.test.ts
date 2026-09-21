import { describe, expect, it, vi } from "vitest";
import type { KeyboardEvent } from "react";
import { onActivate } from "./a11y";

const key = (k: string) => ({ key: k, preventDefault: vi.fn() }) as unknown as KeyboardEvent & { preventDefault: ReturnType<typeof vi.fn> };

describe("onActivate", () => {
  it.each(["Enter", " "])("runs the action on %j and swallows the key", (k) => {
    const action = vi.fn();
    const e = key(k);
    onActivate(action)(e);
    expect(action).toHaveBeenCalledOnce();
    // Space would otherwise scroll the page.
    expect(e.preventDefault).toHaveBeenCalledOnce();
  });

  it.each(["Tab", "Escape", "a", "ArrowDown"])("ignores %j so focus and typing still work", (k) => {
    const action = vi.fn();
    const e = key(k);
    onActivate(action)(e);
    expect(action).not.toHaveBeenCalled();
    expect(e.preventDefault).not.toHaveBeenCalled();
  });
});
