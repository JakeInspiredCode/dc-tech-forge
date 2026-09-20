import { beforeEach, describe, expect, it, vi } from "vitest";

// The migration runs when the module is first evaluated, so each test seeds
// storage first and then loads a fresh copy of the module.
async function load() {
  vi.resetModules();
  return import("./storage-keys");
}

function snapshot(storage: Storage): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)!;
    out[key] = storage.getItem(key)!;
  }
  return out;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("legacy key migration", () => {
  it("carries a returning L1NX user's progress over to the new keys", async () => {
    localStorage.setItem("l1nx:data:forgeCards", '[{"_id":"c1"}]');
    localStorage.setItem("l1nx:data:forgeProfile", '[{"_id":"p1"}]');
    localStorage.setItem("l1nx-onboarding-done", "true");
    localStorage.setItem("l1nx-last-campaign", "linux-core");
    localStorage.setItem("l1nx:lesson-scale", "1.15");
    localStorage.setItem("l1nx-sound", "off");

    await load();

    expect(snapshot(localStorage)).toEqual({
      "dctf:data:forgeCards": '[{"_id":"c1"}]',
      "dctf:data:forgeProfile": '[{"_id":"p1"}]',
      "dctf:onboarding-done": "true",
      "dctf:last-campaign": "linux-core",
      "dctf:lesson-scale": "1.15",
      "dctf:schema-version": "1",
    });
  });

  it("collapses the per-version reseed markers into the highest version", async () => {
    localStorage.setItem("l1nx-reseed-v2", "done");
    localStorage.setItem("l1nx-reseed-v4", "done");
    localStorage.setItem("l1nx-reseed-v3", "done");

    await load();

    expect(localStorage.getItem("dctf:reseed-version")).toBe("4");
    expect(Object.keys(snapshot(localStorage)).filter((k) => k.startsWith("l1nx"))).toEqual([]);
  });

  it("never overwrites data already saved under a new key", async () => {
    localStorage.setItem("l1nx:data:forgeProfile", '[{"_id":"old"}]');
    localStorage.setItem("dctf:data:forgeProfile", '[{"_id":"new"}]');

    await load();

    expect(localStorage.getItem("dctf:data:forgeProfile")).toBe('[{"_id":"new"}]');
    expect(localStorage.getItem("l1nx:data:forgeProfile")).toBeNull();
  });

  it("migrates session keys, including the un-namespaced loadouts", async () => {
    sessionStorage.setItem("l1nx-session-checkpoint", '{"index":3}');
    sessionStorage.setItem("loadout:linux-m01", '{"m01-s1":true}');

    await load();

    expect(snapshot(sessionStorage)).toEqual({
      "dctf:session-checkpoint": '{"index":3}',
      "dctf:loadout:linux-m01": '{"m01-s1":true}',
    });
  });

  it("drops keys written by features that were removed", async () => {
    localStorage.setItem("l1nx-mascot-personality", "sarcastic");
    localStorage.setItem("l1nx-mascot-muted", "true");
    localStorage.setItem("l1nx-sound", "off");
    localStorage.setItem("dctf:sound", "off"); // migrated by an earlier build
    sessionStorage.setItem("l1nx-mascot-welcomed", "1");

    await load();

    expect(Object.keys(snapshot(localStorage))).toEqual(["dctf:schema-version"]);
    expect(snapshot(sessionStorage)).toEqual({});
  });

  it("leaves other apps on the same origin alone", async () => {
    localStorage.setItem("some-other-app:token", "abc");
    localStorage.setItem("theme", "dark");

    await load();

    expect(localStorage.getItem("some-other-app:token")).toBe("abc");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("is idempotent", async () => {
    localStorage.setItem("l1nx:data:forgeCards", '[{"_id":"c1"}]');
    localStorage.setItem("l1nx-reseed-v4", "done");

    const { migrateLegacyKeys } = await load();
    const afterFirst = snapshot(localStorage);
    migrateLegacyKeys();

    expect(snapshot(localStorage)).toEqual(afterFirst);
  });

  it("does not crash the app when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(load()).resolves.toBeDefined();
  });
});

describe("isAppKey", () => {
  it("recognizes this app's keys only", async () => {
    const { isAppKey, STORAGE_KEYS, SESSION_KEYS } = await load();

    expect(isAppKey(STORAGE_KEYS.onboardingDone)).toBe(true);
    expect(isAppKey(STORAGE_KEYS.dataPrefix + "forgeCards")).toBe(true);
    expect(isAppKey(SESSION_KEYS.loadout("linux-m01"))).toBe(true);
    expect(isAppKey("some-other-app:token")).toBe(false);
    expect(isAppKey("l1nx-last-campaign")).toBe(false);
  });
});
