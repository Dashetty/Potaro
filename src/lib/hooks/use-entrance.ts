"use client";

import { useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/lib/ease";

/**
 * Shared entrance props: fade + rise over EASE_OUT, reduce-aware. Returns a
 * prop factory so staggered sections can each pass their delay and rise
 * distance — `const entrance = useEntrance()` then `{...entrance(0.04)}`.
 */
export function useEntrance() {
  const reduce = useReducedMotion();

  return (delay = 0, y = 10) => ({
    initial: reduce
      ? false
      : { opacity: 0, transform: `translateY(${y}px)` },
    animate: reduce
      ? { opacity: 1 }
      : { opacity: 1, transform: "translateY(0px)" },
    transition: reduce
      ? { duration: 0 }
      : { duration: 0.28, ease: EASE_OUT, delay },
  });
}
