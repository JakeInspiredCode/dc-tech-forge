import { describe, expect, it, vi } from "vitest";

const { selectMock } = vi.hoisted(() => ({ selectMock: vi.fn() }));
vi.mock("./postgrest", () => ({ select: selectMock, rpc: vi.fn(), CloudError: class extends Error {} }));

import { fetchWeeklyBoard, validateBoardRow } from "./board";

describe("validateBoardRow", () => {
  it("accepts a callsign with a non-negative XP number, rounding it", () => {
    expect(validateBoardRow({ callsign: "nova_7", xp: 120 })).toEqual({ callsign: "nova_7", xp: 120 });
    expect(validateBoardRow({ callsign: "nova_7", xp: "88.6" })).toEqual({ callsign: "nova_7", xp: 89 });
    expect(validateBoardRow({ callsign: "nova_7", xp: 0 })).toEqual({ callsign: "nova_7", xp: 0 });
  });

  it("drops anything bent", () => {
    expect(validateBoardRow({ callsign: "Nova 7", xp: 1 })).toBeNull();
    expect(validateBoardRow({ callsign: "<b>x</b>", xp: 1 })).toBeNull();
    expect(validateBoardRow({ callsign: "nova_7", xp: -5 })).toBeNull();
    expect(validateBoardRow({ callsign: "nova_7", xp: "lots" })).toBeNull();
    expect(validateBoardRow({ callsign: "nova_7" })).toBeNull();
    expect(validateBoardRow(null)).toBeNull();
  });
});

describe("fetchWeeklyBoard", () => {
  it("reads the view, keeps only valid rows, highest XP first", async () => {
    selectMock.mockResolvedValueOnce([
      { callsign: "rack_rat", xp: 40 },
      { callsign: "BAD NAME", xp: 999 },
      { callsign: "nova_7", xp: "120" },
    ]);
    await expect(fetchWeeklyBoard(10)).resolves.toEqual([
      { callsign: "nova_7", xp: 120 },
      { callsign: "rack_rat", xp: 40 },
    ]);
    expect(selectMock).toHaveBeenCalledWith("weekly_board", "select=callsign,xp&limit=10");
  });
});
