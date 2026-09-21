"use client";

import { useEffect, useRef } from "react";

// What a modal owes a keyboard: focus moves in when it opens, Tab stays inside
// it, Escape closes it, and focus goes back to whatever opened it.
// Pair with role="dialog", aria-modal="true" and aria-labelledby on the same element.

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusableIn(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.hasAttribute("hidden") && el.getAttribute("aria-hidden") !== "true",
  );
}

/** The key handling, separated from React so it can be tested directly. */
export function handleDialogKey(e: KeyboardEvent, container: HTMLElement, onClose: () => void): void {
  if (e.key === "Escape") {
    e.stopPropagation();
    onClose();
    return;
  }
  if (e.key !== "Tab") return;

  const items = focusableIn(container);
  if (items.length === 0) {
    e.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !container.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !container.contains(active))) {
    e.preventDefault();
    first.focus();
  }
}

export function useModalDialog<T extends HTMLElement = HTMLDivElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // `data-autofocus` marks the control a person wants first (a form's first
    // field rather than its × button); otherwise the first focusable one.
    const preferred = container.querySelector<HTMLElement>("[data-autofocus]");
    (preferred ?? focusableIn(container)[0] ?? container).focus();

    const onKey = (e: KeyboardEvent) => handleDialogKey(e, container, () => closeRef.current());
    container.addEventListener("keydown", onKey);
    return () => {
      container.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, []);

  return ref;
}
