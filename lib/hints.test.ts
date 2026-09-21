import { beforeEach, describe, expect, it, vi } from "vitest";
import { HINTS, isHintSeen, markHintSeen } from "./hints";
import { STORAGE_KEYS, isAppKey } from "./storage-keys";

beforeEach(() => window.localStorage.clear());

describe("first-visit hints", () => {
  it("are unseen until dismissed, then stay dismissed — each on its own", () => {
    expect(isHintSeen("arsenal")).toBe(false);
    markHintSeen("arsenal");
    expect(isHintSeen("arsenal")).toBe(true);
    expect(isHintSeen("campaign")).toBe(false);
    markHintSeen("campaign");
    markHintSeen("arsenal"); // twice is fine
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.hintsSeen)!).sort()).toEqual(["arsenal", "campaign"]);
  });

  it("use a namespaced key, so Reset clears them with everything else", () => {
    expect(isAppKey(STORAGE_KEYS.hintsSeen)).toBe(true);
  });

  it("survive a corrupted value instead of crashing the page", () => {
    window.localStorage.setItem(STORAGE_KEYS.hintsSeen, "{not json");
    expect(isHintSeen("arsenal")).toBe(false);
    window.localStorage.setItem(STORAGE_KEYS.hintsSeen, '{"arsenal":true}');
    expect(isHintSeen("arsenal")).toBe(false);
    markHintSeen("arsenal");
    expect(isHintSeen("arsenal")).toBe(true);
  });

  it("do nothing, quietly, when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(isHintSeen("mission")).toBe(false);
    expect(() => markHintSeen("mission")).not.toThrow();
  });

  it("are one or two plain sentences each", () => {
    for (const [id, text] of Object.entries(HINTS)) {
      expect(text.length, id).toBeLessThan(200);
      expect(text, id).toMatch(/[.!]$/);
    }
  });
});
