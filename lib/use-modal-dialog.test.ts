import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { focusableIn, handleDialogKey } from "./use-modal-dialog";

let dialog: HTMLDivElement;
let outside: HTMLButtonElement;

beforeEach(() => {
  document.body.innerHTML = `
    <button id="outside">opener</button>
    <div id="dialog" tabindex="-1">
      <button id="close">×</button>
      <input id="name" />
      <input type="hidden" id="secret" />
      <button id="gone" disabled>disabled</button>
      <button id="save">Save</button>
    </div>`;
  dialog = document.getElementById("dialog") as HTMLDivElement;
  outside = document.getElementById("outside") as HTMLButtonElement;
});
afterEach(() => { document.body.innerHTML = ""; });

const key = (k: string, shiftKey = false) => new KeyboardEvent("keydown", { key: k, shiftKey, cancelable: true, bubbles: true });

describe("focusableIn", () => {
  it("skips disabled and hidden controls", () => {
    expect(focusableIn(dialog).map((e) => e.id)).toEqual(["close", "name", "save"]);
  });
});

describe("handleDialogKey", () => {
  it("closes on Escape and keeps the key from reaching handlers behind the dialog", () => {
    const onClose = vi.fn();
    const e = key("Escape");
    const stop = vi.spyOn(e, "stopPropagation");
    handleDialogKey(e, dialog, onClose);
    expect(onClose).toHaveBeenCalledOnce();
    expect(stop).toHaveBeenCalledOnce();
  });

  it("wraps Tab from the last control to the first", () => {
    document.getElementById("save")!.focus();
    const e = key("Tab");
    handleDialogKey(e, dialog, vi.fn());
    expect(document.activeElement?.id).toBe("close");
    expect(e.defaultPrevented).toBe(true);
  });

  it("wraps Shift+Tab from the first control to the last", () => {
    document.getElementById("close")!.focus();
    const e = key("Tab", true);
    handleDialogKey(e, dialog, vi.fn());
    expect(document.activeElement?.id).toBe("save");
    expect(e.defaultPrevented).toBe(true);
  });

  it("leaves Tab alone in the middle of the dialog", () => {
    document.getElementById("name")!.focus();
    const e = key("Tab");
    handleDialogKey(e, dialog, vi.fn());
    expect(document.activeElement?.id).toBe("name");
    expect(e.defaultPrevented).toBe(false);
  });

  it("pulls focus back in if it has escaped to the page behind", () => {
    outside.focus();
    handleDialogKey(key("Tab"), dialog, vi.fn());
    expect(document.activeElement?.id).toBe("close");
  });

  it("ignores every other key", () => {
    const onClose = vi.fn();
    const e = key("a");
    handleDialogKey(e, dialog, onClose);
    expect(onClose).not.toHaveBeenCalled();
    expect(e.defaultPrevented).toBe(false);
  });
});
