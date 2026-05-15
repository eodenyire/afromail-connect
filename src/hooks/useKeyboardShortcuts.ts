import { useEffect } from "react";

type Handler = (e: KeyboardEvent) => void;
export interface ShortcutMap { [key: string]: Handler }

// Tracks key sequences too: e.g. "g i" → "gi".
export function useKeyboardShortcuts(map: ShortcutMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    let buffer = "";
    let timer: ReturnType<typeof setTimeout> | null = null;

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const editable = (e.target as HTMLElement)?.isContentEditable;
      if (tag === "INPUT" || tag === "TEXTAREA" || editable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (timer) clearTimeout(timer);
      buffer += k;
      // First, try the longest match
      if (map[buffer]) {
        e.preventDefault();
        map[buffer](e);
        buffer = "";
        return;
      }
      // Otherwise, schedule a single-key dispatch
      timer = setTimeout(() => {
        if (map[buffer]) {
          map[buffer](e);
        }
        buffer = "";
      }, 350);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [map, enabled]);
}
