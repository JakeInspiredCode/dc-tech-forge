import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/lib/storage-keys";

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));
vi.mock("./postgrest", () => {
  class CloudError extends Error {
    constructor(public readonly code: string) {
      super(code);
    }
  }
  return { rpc: rpcMock, select: vi.fn(), CloudError };
});

const PILOT = { callsign: "nova_7", code: "0123456789abcdef0123456789abcdef", pilotId: "p1" };
const ticket = (i: number) => ({ ticketId: `t${i}`, difficulty: "orientation", score: 90, commandsUsed: [], answer: "", usedHint: false, xpEarned: 1, timeMs: 1 });
const calls = (fn: string) => rpcMock.mock.calls.filter((c) => c[0] === fn);

async function boot(pilot: typeof PILOT | null = PILOT) {
  vi.resetModules();
  rpcMock.mockReset();
  if (pilot) localStorage.setItem(STORAGE_KEYS.pilot, JSON.stringify(pilot));
  const store = await import("@/lib/data/store");
  const { seedIfEmpty } = await import("@/lib/data/seed");
  const { mutations } = await import("@/lib/data/operations");
  const sync = await import("./sync");
  const pilotMod = await import("./pilot");
  const save = await import("./save");
  seedIfEmpty();
  store.goLive();
  return { ...store, mutations, ...sync, ...pilotMod, ...save };
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe("cloud sync", () => {
  it("publishes only rows logged after sign-in, then pushes the save without shipped card content", async () => {
    const { mutations, installCloudSync, markLogStart, getPilot } = await boot();
    rpcMock.mockImplementation(async (fn: string) => {
      if (fn === "forge_load") return { data: null, rev: 0 };
      if (fn === "forge_log") return { id: 1 };
      if (fn === "forge_save") return { rev: 1 };
      throw new Error(`unexpected ${fn}`);
    });
    await mutations["forgeTicketHistory:add"](ticket(0)); // before sign-in: private
    markLogStart();
    installCloudSync();
    await vi.advanceTimersByTimeAsync(10);
    expect(calls("forge_log")).toHaveLength(0);
    // A fresh account, and this browser already has progress: it becomes the save.
    expect(calls("forge_save")).toHaveLength(1);

    await mutations["forgeTicketHistory:add"](ticket(1));
    await vi.advanceTimersByTimeAsync(10);
    expect(calls("forge_log")).toHaveLength(1);
    expect(calls("forge_log")[0][1]).toMatchObject({ p_callsign: "nova_7", p_code: PILOT.code, p_kind: "ticket_resolved", p_ref: "orientation", p_value: 90 });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.cloudOutbox)!)).toEqual([]);

    expect(calls("forge_save")).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(3000);
    expect(calls("forge_save")).toHaveLength(2);
    const payload = calls("forge_save")[1][1].p_data;
    expect(payload.data.forgeCards[0]).not.toHaveProperty("front");
    expect(payload.data.forgeTicketHistory).toHaveLength(2);
    expect(localStorage.getItem(STORAGE_KEYS.cloudRev)).toBe("1");
    expect(localStorage.getItem(STORAGE_KEYS.cloudDirty)).toBeNull();
    expect(getPilot()).toMatchObject({ callsign: "nova_7" });
  });

  it("does nothing while sample progress is loaded", async () => {
    const { mutations, installCloudSync, markLogStart } = await boot();
    localStorage.setItem(STORAGE_KEYS.sampleData, "1");
    rpcMock.mockResolvedValue({ data: null, rev: 0 });
    markLogStart();
    installCloudSync();
    await mutations["forgeTicketHistory:add"](ticket(1));
    await vi.advanceTimersByTimeAsync(5000);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("signs this browser out when the code no longer works", async () => {
    const { mutations, installCloudSync, markLogStart, getPilot } = await boot();
    const { CloudError } = await import("./postgrest");
    rpcMock.mockImplementation(async (fn: string) => {
      if (fn === "forge_load") return { data: null, rev: 0 };
      throw new CloudError("AUTH_FAILED" as never);
    });
    markLogStart();
    installCloudSync();
    await vi.advanceTimersByTimeAsync(10);
    await mutations["forgeTicketHistory:add"](ticket(1));
    await vi.advanceTimersByTimeAsync(10);
    expect(getPilot()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.pilot)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.cloudOutbox)).toBeNull();
  });

  it("keeps a row the cloud can't be reached for, and drops one it rejects", async () => {
    const { mutations, installCloudSync, markLogStart, readOutbox } = await boot();
    const { CloudError } = await import("./postgrest");
    let mode: "offline" | "invalid" = "offline";
    rpcMock.mockImplementation(async (fn: string) => {
      if (fn === "forge_load") return { data: null, rev: 0 };
      if (fn === "forge_save") return { rev: 1 };
      throw new CloudError(mode === "offline" ? "OFFLINE" : "ACTIVITY_INVALID" as never);
    });
    markLogStart();
    installCloudSync();
    await mutations["forgeTicketHistory:add"](ticket(1));
    await vi.advanceTimersByTimeAsync(10);
    expect(readOutbox()).toHaveLength(1);
    mode = "invalid";
    window.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(10);
    expect(readOutbox()).toHaveLength(0);
  });

  it("adopts a newer cloud save on load without pushing it back, and pushes instead when this browser is dirty", async () => {
    const first = await boot();
    const cloud = JSON.parse(JSON.stringify(first.toCloudSave(first.getState())));
    cloud.data.forgeReviews = [{ _id: "r1", _creationTime: 1, cardId: first.getState().forgeCards[0].cardId, timestamp: "2026-09-20T10:00:00.000Z", quality: 5, responseTime: 900 }];

    const clean = await boot();
    rpcMock.mockImplementation(async (fn: string) => {
      if (fn === "forge_load") return { data: cloud, rev: 4 };
      if (fn === "forge_save") return { rev: 5 };
      return {};
    });
    clean.installCloudSync();
    await vi.advanceTimersByTimeAsync(5000);
    expect(clean.getState().forgeReviews).toHaveLength(1);
    expect(localStorage.getItem(STORAGE_KEYS.cloudRev)).toBe("4");
    expect(calls("forge_save")).toHaveLength(0);

    localStorage.setItem(STORAGE_KEYS.cloudDirty, "1");
    const dirty = await boot();
    rpcMock.mockImplementation(async (fn: string) => (fn === "forge_save" ? { rev: 6 } : { data: cloud, rev: 4 }));
    dirty.installCloudSync();
    await vi.advanceTimersByTimeAsync(10);
    expect(calls("forge_load")).toHaveLength(0);
    expect(calls("forge_save")).toHaveLength(1);
    expect(dirty.getState().forgeReviews).toHaveLength(0);
  });
});
