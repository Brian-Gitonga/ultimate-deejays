import { useEffect, useEffectEvent, useSyncExternalStore, type RefObject } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// A modal is portalled to document.body, so it only renders in the browser.
const noSubscribe = () => () => {};
const useInBrowser = () => useSyncExternalStore(noSubscribe, () => true, () => false);

/**
 * What every modal here does while it's open: focus moves into it (to
 * `initialFocus`, else its first control), Tab stays inside, Escape asks to
 * close, the page behind doesn't scroll, and focus goes back to whatever
 * opened it afterwards. Returns false until it's in the browser; render
 * nothing until then.
 */
export function useModal(panelRef: RefObject<HTMLElement | null>, onClose: () => void, initialFocus?: () => HTMLElement | null) {
  const inBrowser = useInBrowser();
  // Callers pass new functions each render; opening and closing shouldn't rerun on that.
  const close = useEffectEvent(onClose);
  const firstFocus = useEffectEvent(() => initialFocus?.() ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? null);

  useEffect(() => {
    if (!inBrowser) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    firstFocus()?.focus({ preventScroll: true });
    document.documentElement.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el.matches("input"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      opener?.focus({ preventScroll: true });
    };
  }, [inBrowser, panelRef]);

  return inBrowser;
}
