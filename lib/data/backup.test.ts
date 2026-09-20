import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/lib/storage-keys";

async function load() {
  vi.resetModules();
  const backup = await import("./backup");
  const store = await import("./store");
  const persistence = await import("./persistence");
  const { seedIfEmpty } = await import("./seed");
  const { loadSampleData } = await import("./sample-data");
  return { ...backup, ...store, ...persistence, seedIfEmpty, loadSampleData };
}

// A minimal file that passes validation; tests corrupt one thing at a time.
function validFile(overrides: Record<string, unknown> = {}, data: Record<string, unknown> = {}) {
  return {
    app: "dc-tech-forge",
    kind: "progress-backup",
    version: 1,
    exportedAt: "2026-09-19T12:00:00.000Z",
    sampleData: false,
    data,
    ...overrides,
  };
}

const card = (overrides: Record<string, unknown> = {}) => ({
  _id: "c1",
  _creationTime: 1,
  cardId: "linux-001",
  topicId: "linux",
  type: "easy",
  front: "Q",
  back: "A",
  difficulty: 1,
  tier: 1,
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  dueDate: "2026-09-19",
  ...overrides,
});

let registered: Array<[string, EventListenerOrEventListenerObject]> = [];

beforeEach(() => {
  localStorage.clear();
  const add = window.addEventListener.bind(window);
  vi.spyOn(window, "addEventListener").mockImplementation((type, listener, options) => {
    registered.push([type, listener]);
    add(type, listener, options);
  });
});

afterEach(() => {
  for (const [type, listener] of registered) window.removeEventListener(type, listener);
  registered = [];
});

describe("round trip", () => {
  it("restores exactly what was exported, in a different browser", async () => {
    const source = await load();
    source.seedIfEmpty();
    await source.loadSampleData();
    const text = JSON.stringify(source.buildBackup());
    const exported = source.getState();

    localStorage.clear(); // a different browser
    const target = await load();
    const parsed = target.parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    target.installPersistence();
    target.restoreBackup(parsed.backup);

    expect(target.getState()).toEqual(exported);
    // Persisted immediately — the caller reloads right after.
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.dataPrefix + "forgeReviews")!)).toEqual(
      exported.forgeReviews,
    );
    expect(localStorage.getItem(STORAGE_KEYS.sampleData)).toBe("1");
  });

  it("treats a missing section as empty", async () => {
    const { parseBackup } = await load();
    const result = parseBackup(JSON.stringify(validFile({}, { forgeCards: [card()] })));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.data.forgeCards).toHaveLength(1);
      expect(result.backup.data.forgeReviews).toEqual([]);
    }
  });
});

describe("rejects files that are not backups", () => {
  it.each([
    ["not JSON", "{oops", /isn't valid JSON/],
    ["some other JSON", JSON.stringify({ hello: "world" }), /isn't a DC-Tech-Forge progress backup/],
    ["a card deck export", JSON.stringify([{ front: "Q", back: "A" }]), /isn't a DC-Tech-Forge progress backup/],
    ["a newer version", JSON.stringify(validFile({ version: 99 })), /newer version/],
    ["no data section", JSON.stringify(validFile({ data: null })), /no data section/],
    ["an unknown section", JSON.stringify(validFile({}, { forgeEvil: [] })), /unrecognized section: forgeEvil/],
    ["an oversized file", "x".repeat(5_000_001), /too large/],
  ])("%s", async (_label, text, message) => {
    const { parseBackup } = await load();
    const result = parseBackup(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(message);
  });
});

describe("rejects damaged records, and says where", () => {
  it.each([
    ["a section that is not a list", { forgeCards: { nope: true } }, /forgeCards must be a list/],
    ["a row that is not a record", { forgeCards: ["x"] }, /forgeCards\[0\] is not a record/],
    ["a row without an id", { forgeCards: [card({ _id: undefined })] }, /forgeCards\[0\]\._id/],
    // The shape that used to crash /cards on every load (localeCompare on a number).
    ["a numeric topicId", { forgeCards: [card({ topicId: 1 })] }, /forgeCards\[0\]\.topicId must be text/],
    ["steps that are not a list", { forgeCards: [card({ steps: "x" })] }, /forgeCards\[0\]\.steps must be a list of text/],
    ["a missing required field", { forgeCards: [card({ front: undefined })] }, /forgeCards\[0\]\.front is missing/],
    ["an out-of-range tier", { forgeCards: [card({ tier: 9 })] }, /tier must be between 1 and 4/],
    ["a non-finite number", { forgeCards: [card({ easeFactor: "NaN" })] }, /easeFactor must be a number/],
    ["a second bad row", { forgeCards: [card(), card({ back: 5 })] }, /forgeCards\[1\]\.back must be text/],
  ])("%s", async (_label, data, message) => {
    const { parseBackup } = await load();
    const result = parseBackup(JSON.stringify(validFile({}, data)));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(message);
  });

  it("never touches the store when the file is bad", async () => {
    const { parseBackup, getState, seedIfEmpty } = await load();
    seedIfEmpty();
    const before = getState();

    parseBackup(JSON.stringify(validFile({}, { forgeCards: [card({ topicId: 1 })] })));

    expect(getState()).toBe(before);
  });
});

describe("hostile input", () => {
  it("drops fields it does not know about", async () => {
    const { parseBackup } = await load();
    const result = parseBackup(
      JSON.stringify(validFile({}, { forgeCards: [card({ onload: "alert(1)", extra: { a: 1 } })] })),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.keys(result.backup.data.forgeCards[0]).sort()).toEqual(Object.keys(card()).sort());
    }
  });

  it("cannot reach a prototype through nested records", async () => {
    const { parseBackup } = await load();
    // Written as text: an object literal would set the prototype instead of
    // creating the own "__proto__" key that JSON.parse produces.
    const text = JSON.stringify(
      validFile({}, {
        forgeSessions: [
          { _id: "s1", _creationTime: 1, type: "daily-training", startTime: "t", cardIds: [], answers: ["PLACEHOLDER"] },
        ],
      }),
    ).replace('"PLACEHOLDER"', '{"cardId":"c","__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}');

    const result = parseBackup(text);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const answer = result.backup.data.forgeSessions[0].answers[0] as unknown as Record<string, unknown>;
      expect(Object.keys(answer)).toEqual(["cardId"]);
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe("backupFilename", () => {
  it("is dated and branded", async () => {
    const { backupFilename } = await load();
    expect(backupFilename(new Date("2026-09-19T12:00:00Z"))).toBe("dc-tech-forge-backup-2026-09-19.json");
  });
});
