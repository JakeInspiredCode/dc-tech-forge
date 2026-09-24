import { afterEach, describe, expect, it, vi } from "vitest";

async function load(env: { url?: string; key?: string } = { url: "https://x.supabase.co/", key: "anon" }) {
  vi.resetModules();
  if (env.url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = env.url;
  if (env.key === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = env.key;
  return import("./postgrest");
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

describe("rpc / select", () => {
  it("post to the function with the public key and return the JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ rev: 3 }));
    vi.stubGlobal("fetch", fetchMock);
    const { rpc } = await load();
    await expect(rpc("forge_save", { p_callsign: "a" })).resolves.toEqual({ rev: 3 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://x.supabase.co/rest/v1/rpc/forge_save");
    expect(init.method).toBe("POST");
    expect(init.headers.apikey).toBe("anon");
    expect(init.headers.Authorization).toBe("Bearer anon");
    expect(JSON.parse(init.body)).toEqual({ p_callsign: "a" });
  });

  it("read a view with a GET", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json([{ id: 1 }]));
    vi.stubGlobal("fetch", fetchMock);
    const { select } = await load();
    await expect(select("fleet_log", "select=id&limit=2")).resolves.toEqual([{ id: 1 }]);
    expect(fetchMock.mock.calls[0][0]).toBe("https://x.supabase.co/rest/v1/fleet_log?select=id&limit=2");
    expect(fetchMock.mock.calls[0][1].method).toBe("GET");
  });

  it("turn a message the schema raises into a typed error, and anything else into SERVER", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(json({ code: "P0001", message: "CALLSIGN_TAKEN" }, 400))
      .mockResolvedValueOnce(json({ message: "permission denied for table pilots" }, 401))
      .mockResolvedValueOnce(new Response("<html>bad gateway</html>", { status: 502 })));
    const { rpc, CloudError } = await load();
    await expect(rpc("forge_register", {})).rejects.toMatchObject({ code: "CALLSIGN_TAKEN" });
    await expect(rpc("x", {})).rejects.toMatchObject({ code: "SERVER", message: expect.stringContaining("401") });
    await expect(rpc("x", {})).rejects.toBeInstanceOf(CloudError);
  });

  it("report a network failure as OFFLINE and a hang as TIMEOUT", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    let mod = await load();
    await expect(mod.rpc("x", {})).rejects.toMatchObject({ code: "OFFLINE" });

    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) =>
      new Promise((_, reject) => init.signal!.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))))));
    mod = await load();
    const pending = mod.rpc("x", {});
    const assertion = expect(pending).rejects.toMatchObject({ code: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(15_001);
    await assertion;
  });

  it("refuse to run in a build without the cloud configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { rpc, select } = await load({});
    await expect(rpc("x", {})).rejects.toMatchObject({ code: "NOT_CONFIGURED" });
    await expect(select("fleet_log", "limit=1")).rejects.toMatchObject({ code: "NOT_CONFIGURED" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
