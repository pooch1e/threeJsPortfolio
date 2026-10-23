/**
 * usePresence — keeps an element mounted through its exit transition.
 * `mounted` gates rendering; `visible` drives the enter/exit CSS state
 * (see .presence / .presence-fade in App.css).
 */
import { useEffect, useState } from "react";

export function usePresence(open, exitMs = 120) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      let inner;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    setVisible(false);
    const timeout = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(timeout);
  }, [open, exitMs]);

  return { mounted, visible };
}
