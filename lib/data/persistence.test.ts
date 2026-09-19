import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ENTITY_KEYS, type State } from "./schema";

const PREFIX = "l1nx:data:";
const FLUSH_MS = 400;

// persistence.ts and store.ts keep module-level singletons (the state, the
// flush timer, the "installed" flag), so every test loads a fresh copy.
async function load() {
  vi.resetModules();
  const persistence = await import("./persistence");
  const store = await import("./store");
  return { ...persistence, ...store };
}

// Only the identity matters to these tests, not the full story shape.
function story(id: string) {
  return { _id: id } as unknown as State["forgeStories"][number];
}

function dataKeys(): string[] {
  return Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
}

// installPersistence() registers a beforeunload listener on the shared jsdom
// window. Track and remove them, or listeners from earlier tests would flush
// their stale state into later ones.
let registered: Array<[string, EventListenerOrEventListenerObject]> = [];

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  const add = window.addEventListener.bind(window);
  vi.spyOn(window, "addEventListener").mockImplementation((type, listener, options) => {
    registered.push([type, listener]);
    add(type, listener, options);
  });
});

afterEach(() => {
  for (const [type, listener] of registered) window.removeEventListener(type, listener);
  registered = [];
  vi.useRealTimers();
});

describe("hydrate", () => {
  it("loads persisted slices into the store", async () => {
    localStorage.setItem(PREFIX + "forgeStories", JSON.stringify([{ _id: "s1" }]));
    const { hydrate, getState } = await load();

    expect(hydrate()).toBe(true);
    expect(getState().forgeStories).toEqual([{ _id: "s1" }]);
    expect(getState().forgeCards).toEqual([]);
  });

  it("reports nothing to hydrate on a first visit", async () => {
    const { hydrate } = await load();
    expect(hydrate()).toBe(false);
  });

  it("discards a corrupt slice instead of throwing, and keeps the healthy ones", async () => {
    localStorage.setItem(PREFIX + "forgeCards", "{not json");
    localStorage.setItem(PREFIX + "forgeStories", JSON.stringify([{ _id: "s1" }]));
    const { hydrate, getState } = await load();

    expect(() => hydrate()).not.toThrow();
    expect(localStorage.getItem(PREFIX + "forgeCards")).toBeNull();
    expect(getState().forgeStories).toEqual([{ _id: "s1" }]);
  });

  it("ignores a slice that parses but is not an array", async () => {
    localStorage.setItem(PREFIX + "forgeCards", JSON.stringify({ nope: true }));
    const { hydrate, getState } = await load();

    expect(hydrate()).toBe(false);
    expect(getState().forgeCards).toEqual([]);
  });
});

describe("flush", () => {
  it("writes every slice once the debounce window passes", async () => {
    const { installPersistence, mutate } = await load();
    installPersistence();

    mutate("forgeStories", () => [story("s1")]);
    expect(dataKeys()).toHaveLength(0); // still debouncing

    vi.advanceTimersByTime(FLUSH_MS);
    expect(dataKeys()).toHaveLength(ENTITY_KEYS.length);
    expect(JSON.parse(localStorage.getItem(PREFIX + "forgeStories")!)).toEqual([{ _id: "s1" }]);
  });

  it("coalesces a burst of mutations into the latest state", async () => {
    const { installPersistence, mutate } = await load();
    installPersistence();
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    mutate("forgeStories", () => [story("s1")]);
    vi.advanceTimersByTime(FLUSH_MS - 1);
    mutate("forgeStories", () => [story("s2")]);
    vi.advanceTimersByTime(FLUSH_MS);

    expect(setItem).toHaveBeenCalledTimes(ENTITY_KEYS.length); // one flush, not two
    expect(JSON.parse(localStorage.getItem(PREFIX + "forgeStories")!)).toEqual([{ _id: "s2" }]);
  });

  it("saves a pending edit when the page unloads mid-debounce", async () => {
    const { installPersistence, mutate } = await load();
    installPersistence();

    mutate("forgeStories", () => [story("s1")]);
    window.dispatchEvent(new Event("beforeunload"));

    expect(JSON.parse(localStorage.getItem(PREFIX + "forgeStories")!)).toEqual([{ _id: "s1" }]);
  });

  it("does not persist hydration itself (a read, not an edit)", async () => {
    localStorage.setItem(PREFIX + "forgeStories", JSON.stringify([{ _id: "s1" }]));
    const { installPersistence } = await load();
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    installPersistence();
    vi.advanceTimersByTime(FLUSH_MS * 2);

    expect(setItem).not.toHaveBeenCalled();
  });
});

describe("resetPersistedData", () => {
  it("removes every data slice", async () => {
    const { installPersistence, mutate, resetPersistedData } = await load();
    installPersistence();
    mutate("forgeStories", () => [story("s1")]);
    vi.advanceTimersByTime(FLUSH_MS);

    resetPersistedData();

    expect(dataKeys()).toHaveLength(0);
  });

  // KNOWN BUG, reproduced in the browser on 2026-09-19: Profile -> "Reset all
  // local data" calls resetPersistedData() and then reloads. flushNow() never
  // clears `flushTimer`, so after the first flush of a session the
  // beforeunload handler always sees a truthy timer id and rewrites the whole
  // in-memory state -- undoing the reset before the page has even unloaded.
  //
  // `it.fails` passes while the bug exists and FAILS once it is fixed. When
  // that happens, change it to a plain `it`: it becomes the regression test.
  it.fails("stays empty through the page reload that follows a reset", async () => {
    const { installPersistence, mutate, resetPersistedData } = await load();
    installPersistence();
    mutate("forgeStories", () => [story("s1")]);
    vi.advanceTimersByTime(FLUSH_MS); // the session's first flush

    resetPersistedData();
    window.dispatchEvent(new Event("beforeunload")); // window.location.reload()

    expect(dataKeys()).toHaveLength(0);
  });
});
