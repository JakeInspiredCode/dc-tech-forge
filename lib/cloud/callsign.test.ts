import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CALLSIGN_RE, RESERVED_CALLSIGNS, callsignProblem, formatCode, normalizeCallsign, normalizeCode } from "./callsign";

const sql = readFileSync(join(__dirname, "..", "..", "supabase", "schema.sql"), "utf8");

describe("callsign rules", () => {
  it("are the same here as in the database", () => {
    const block = sql.match(/p_callsign = any \(array\[([\s\S]*?)\]\)/)?.[1] ?? "";
    const reserved = [...block.matchAll(/'([a-z0-9_]+)'/g)].map((m) => m[1]);
    expect(reserved.length).toBeGreaterThan(10);
    expect([...reserved].sort()).toEqual([...RESERVED_CALLSIGNS].sort());
    expect(sql).toContain(`'${CALLSIGN_RE.source}'`);
  });

  it("normalize what people type", () => {
    expect(normalizeCallsign("  Rack Rat ")).toBe("rack_rat");
    expect(normalizeCallsign("Nova-7")).toBe("nova_7");
  });

  it("explain a problem in plain words, or none", () => {
    expect(callsignProblem("ab")).toMatch(/3–20/);
    expect(callsignProblem("a".repeat(21))).toMatch(/3–20/);
    expect(callsignProblem("Rack")).toMatch(/lower-case/);
    expect(callsignProblem("rack rat")).not.toBeNull();
    expect(callsignProblem("admin")).toMatch(/reserved/);
    expect(callsignProblem("you")).toMatch(/reserved/);
    expect(callsignProblem("rack_rat")).toBeNull();
  });
});

describe("recovery codes", () => {
  const code = "0123456789abcdef0123456789abcdef";
  it("format for reading and normalize back from any typing", () => {
    expect(formatCode(code)).toBe("0123-4567-89ab-cdef-0123-4567-89ab-cdef");
    expect(normalizeCode(formatCode(code).toUpperCase())).toBe(code);
    expect(normalizeCode(" 0123 4567 89ab cdef 0123 4567 89ab cdef ")).toBe(code);
    expect(normalizeCode("0123-4567")).toBeNull();
    expect(normalizeCode(code + "0")).toBeNull();
  });
});
