"use client";
// beui.dev/components/motion/drawer

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { EASE_DRAWER, EASE_OUT } from "@/lib/ease";
import { PresenceGate } from "@/lib/presence-gate";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
  children: ReactNode;
  /** Class for the panel surface. */
  className?: string;
  /** Class for the backdrop. */
  backdropClassName?: string;
  ariaLabel?: string;
  /** Close when the backdrop is clicked. Default true. */
  dismissable?: boolean;
}

export function Drawer({
  open,
  onOpenChange,
  side = "right",
  children,
  className,
  backdropClassName,
  ariaLabel,
  dismissable = true,
}: DrawerProps) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onOpenChange]);

  const offscreen = side === "right" ? "100%" : "-100%";

  // Two fixed siblings, no wrapper: the backdrop spans the viewport edges but
  // paints the scrim, and the panel is inset off one side and paints its own
  // surface, so neither is a transparent edge-spanning layer. Both hang off
  // `PresenceGate`, so interaction releases in the same commit that starts the
  // exit rather than when it ends. See tests/fixed-overlay-edge-sampling.test.tsx.
  return (
    <AnimatePresence>
      {open ? (
        <PresenceGate key="backdrop">
          {({ gate }) => (
            <motion.button
              type="button"
              aria-label="Close"
              tabIndex={dismissable ? 0 : -1}
              onClick={() => dismissable && onOpenChange(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              {...gate}
              className={cn(
                "fixed inset-0 z-50 h-full w-full cursor-default bg-background/5 backdrop-blur-[8px] backdrop-saturate-140",
                backdropClassName,
              )}
            />
          )}
        </PresenceGate>
      ) : null}
      {open ? (
        <PresenceGate key="panel">
          {({ gate }) => (
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={ariaLabel}
              initial={
                reduce
                  ? { opacity: 0 }
                  : { transform: `translateX(${offscreen})` }
              }
              animate={
                reduce ? { opacity: 1 } : { transform: "translateX(0%)" }
              }
              exit={
                reduce
                  ? { opacity: 0 }
                  : {
                      transform: `translateX(${offscreen})`,
                      transition: { duration: 0.3, ease: EASE_DRAWER },
                    }
              }
              transition={
                reduce
                  ? { duration: 0.2, ease: EASE_OUT }
                  : { duration: 0.4, ease: EASE_DRAWER }
              }
              {...gate}
              className={cn(
                // Full width on mobile (<640px), ~440px panel on desktop.
                "fixed inset-y-0 z-50 flex w-full flex-col overflow-hidden rounded-sm bg-background shadow-2xl sm:w-[440px] sm:max-w-[85vw]",
                side === "right"
                  ? "right-0 border-l border-border"
                  : "left-0 border-r border-border",
                className,
              )}
            >
              {children}
            </motion.aside>
          )}
        </PresenceGate>
      ) : null}
    </AnimatePresence>
  );
}
