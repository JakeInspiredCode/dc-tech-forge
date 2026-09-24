import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "@/lib/storage-keys";

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));
vi.mock("./postgrest", () => ({ rpc: rpcMock, select: vi.fn(), CloudError: class extends Error {} }));

async function load() {
  vi.resetModules();
  rpcMock.mockReset();
  return import("./pilot");
}

beforeEach(() => localStorage.clear());

describe("the signed-in pilot", () => {
  it("is nobody until an account is claimed, and survives a reload", async () => {
    let mod = await load();
    expect(mod.getPilot()).toBeNull();
    rpcMock.mockResolvedValue({ pilot_id: "p1", code: "0123456789abcdef0123456789abcdef" });
    const pilot = await mod.registerCallsign("nova_7");
    expect(pilot).toEqual({ callsign: "nova_7", code: "0123456789abcdef0123456789abcdef", pilotId: "p1" });
    expect(rpcMock).toHaveBeenCalledWith("forge_register", { p_callsign: "nova_7" });

    mod = await load();
    expect(mod.getPilot()).toEqual(pilot);
  });

  it("ignores a stored value that isn't a pilot", async () => {
    for (const bad of ["{not json", '{"callsign":"Nova 7","code":"x","pilotId":"p"}', '{"callsign":"nova_7","code":"short","pilotId":"p"}', "null"]) {
      localStorage.setItem(STORAGE_KEYS.pilot, bad);
      const mod = await load();
      expect(mod.getPilot(), bad).toBeNull();
    }
  });

  it("signs out locally only, clearing the sync bookkeeping", async () => {
    const mod = await load();
    rpcMock.mockResolvedValue({ pilot_id: "p1", save_rev: 3 });
    await mod.signIn("nova_7", "0123456789abcdef0123456789abcdef");
    localStorage.setItem(STORAGE_KEYS.cloudRev, "3");
    localStorage.setItem(STORAGE_KEYS.cloudOutbox, "[]");
    mod.signOut();
    expect(mod.getPilot()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.cloudRev)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.cloudOutbox)).toBeNull();
    expect(rpcMock).not.toHaveBeenCalledWith("forge_delete_account", expect.anything());
  });

  it("rotates the code in place and deletes the account through the API", async () => {
    const mod = await load();
    rpcMock.mockResolvedValueOnce({ pilot_id: "p1", save_rev: 0 });
    await mod.signIn("nova_7", "0123456789abcdef0123456789abcdef");
    rpcMock.mockResolvedValueOnce({ code: "ffffffffffffffffffffffffffffffff" });
    await expect(mod.rotateCode()).resolves.toBe("ffffffffffffffffffffffffffffffff");
    expect(mod.getPilot()?.code).toBe("ffffffffffffffffffffffffffffffff");
    rpcMock.mockResolvedValueOnce({ deleted: true });
    await mod.deleteCloudAccount();
    expect(rpcMock).toHaveBeenLastCalledWith("forge_delete_account", { p_callsign: "nova_7", p_code: "ffffffffffffffffffffffffffffffff" });
    expect(mod.getPilot()).toBeNull();
  });
});
