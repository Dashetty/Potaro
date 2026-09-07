"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { X } from "lucide-react";

type TagBarProps = {
  /** Tags in display order — heaviest first (count desc, ties alphabetical). */
  tags: string[];
  counts: Map<string, number>;
  activeTag: string | null;
  /** Show the Clear control (a search or tag filter is active). */
  showClear: boolean;
  onSelect: (tag: string | null) => void;
  onClear: () => void;
};

/** Width of the gradient fade on a scrollable edge. */
const EDGE_FADE_PX = 20;

/**
 * The Tag Bar — the tag filter strip under the header. On phones it's a
 * single-line rail: it starts sliding exactly when the chips outgrow the
 * width (no threshold constant), with a hidden scrollbar, a fade on
 * whichever edge can scroll, and the active chip scrolled into view.
 * Desktop keeps the wrapped, centered bar.
 */
export function TagBar({
  tags,
  counts,
  activeTag,
  showClear,
  onSelect,
  onClear,
}: TagBarProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 1);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  // Re-measure when the chip set changes or the scroller resizes; onScroll
  // keeps the edges live while swiping.
  useEffect(measure, [tags, measure]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  // Tap a tag on a card deep in the list and the rail finds its chip.
  useEffect(() => {
    if (!activeTag) return;
    itemRefs.current.get(activeTag)?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }, [activeTag]);

  // The mask fades only the edge that can actually scroll — a static mask
  // would fade chips even when the whole rail fits.
  const fade = (canScroll: boolean) => (canScroll ? `${EDGE_FADE_PX}px` : "0");
  const gradient = `linear-gradient(to right, transparent, black ${fade(canLeft)}, black calc(100% - ${fade(canRight)}), transparent)`;
  const maskStyle: CSSProperties | undefined =
    canLeft || canRight
      ? { maskImage: gradient, WebkitMaskImage: gradient }
      : undefined;

  return (
    <div className="border-b-2 border-pink-horror/50">
      <div
        ref={scrollerRef}
        role="group"
        aria-label="Filter by tag"
        onScroll={measure}
        style={maskStyle}
        className="flex flex-nowrap items-center justify-start gap-1.5 overflow-x-auto overscroll-x-contain px-5 py-2.5 scrollbar-none md:flex-wrap md:justify-center md:overflow-visible md:px-8"
      >
        {tags.map((tag) => {
          const selected = activeTag === tag;
          const count = counts.get(tag) ?? 0;
          return (
            <button
              key={tag}
              type="button"
              ref={(el) => {
                if (el) itemRefs.current.set(tag, el);
                else itemRefs.current.delete(tag);
              }}
              onClick={() => onSelect(selected ? null : tag)}
              aria-pressed={selected}
              className={
                "flex h-7 max-w-full shrink-0 items-stretch overflow-hidden rounded-[3px] border font-mono transition-colors " +
                (selected
                  ? "border-white/15 bg-white/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10")
              }
            >
              <span className="grid w-[25px] shrink-0 place-items-center rounded-l-xs rounded-br-md bg-primary text-xs text-primary-foreground tabular-nums">
                {count}
              </span>
              <span className="flex min-w-0 items-center px-2.5 text-sm text-foreground">
                <span className="truncate">{tag}</span>
              </span>
            </button>
          );
        })}
        {showClear ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex shrink-0 items-center gap-1 rounded-[3px] px-3 py-1 font-mono text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <X className="size-3.5" />
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
