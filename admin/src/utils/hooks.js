import { useEffect, useLayoutEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Eases a number from its current value to `target` (used for the KPI cards).
export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const shown = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion() || duration <= 0) {
      shown.current = target;
      setValue(target);
      return undefined;
    }
    const from = shown.current;
    const startedAt = performance.now();
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      shown.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

// Tracks the pixel width of an element so SVG charts can draw at their real size.
export function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    setWidth(Math.round(element.getBoundingClientRect().width));
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
