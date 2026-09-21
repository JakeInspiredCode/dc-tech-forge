import type { KeyboardEvent } from "react";

/**
 * Enter or Space runs `action` — what a native <button> does for free.
 *
 * For the places a real <button> doesn't fit (an SVG node, a card whose body
 * must stay readable outside the control). Pair it with `role="button"` and
 * `tabIndex={0}`; prefer a real <button> everywhere else.
 */
export function onActivate(action: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };
}
