"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { ExternalLink, Globe, Pencil, Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/motion/context-menu";
import { Button } from "@/components/motion/button/base";
import { formatRelativeTime } from "@/lib/format";
import type { Bookmark } from "@/lib/types";

type BookmarkCardProps = {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onTagClick: (tag: string) => void;
};

export function BookmarkCard({
  bookmark,
  onEdit,
  onDelete,
  onTagClick,
}: BookmarkCardProps) {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const reduce = useReducedMotion();
  const title = bookmark.title || bookmark.url;

  const open = () =>
    window.open(bookmark.url, "_blank", "noopener,noreferrer");

  const cardBody = (
    <motion.div
      role="link"
      tabIndex={0}
      aria-label={title}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter") open();
      }}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
      transition={reduce ? { duration: 0 } : { duration: 0.28, ease: "easeOut" }}
      className="group h-full cursor-pointer rounded-[5px] border border-border bg-card p-3 outline-none transition-[border-color] duration-200 hover:border-white/15 focus-visible:border-primary/50"
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-white/5 text-primary">
          {bookmark.favicon_url && !faviconFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bookmark.favicon_url}
              alt=""
              className="size-5 rounded-[7px] object-cover outline-[oklch(1_0_0_/_0.1)]"
              loading="lazy"
              onError={() => setFaviconFailed(true)}
            />
          ) : (
            <Globe className="size-4" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-baseline gap-2">
            <p className="min-w-0 flex-1 truncate font-display text-base leading-5 tracking-tight text-foreground">
              {title}
            </p>
            <time
              dateTime={bookmark.created_at}
              className="shrink-0 font-mono text-xs font-bold leading-5 text-muted-foreground tabular-nums"
            >
              {formatRelativeTime(bookmark.created_at)}
            </time>
          </div>
          {bookmark.description ? (
            <p className="mt-1 line-clamp-2 font-mono text-xs leading-5 break-words text-muted-foreground">
              {bookmark.description}
            </p>
          ) : null}
        </div>

        {/* Hover actions */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Edit ${title}`}
            className="h-10 w-10"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(bookmark);
            }}
          >
            <Pencil className="size-4 text-muted-foreground transition-colors hover:text-foreground" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Delete ${title}`}
            className="h-10 w-10"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(bookmark);
            }}
          >
            <Trash2 className="size-4 text-muted-foreground transition-colors hover:text-destructive" />
          </Button>
        </div>
      </div>

      {/* Tag chips */}
      {bookmark.tags.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {bookmark.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onTagClick(tag);
              }}
              className="inline-flex min-w-0 max-w-full items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-sm leading-5 font-bold text-foreground transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="truncate">{tag}</span>
            </button>
          ))}
        </div>
      ) : null}
    </motion.div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="h-full">{cardBody}</div>
      </ContextMenuTrigger>
      <ContextMenuContent ariaLabel={`Actions for ${title}`}>
        <ContextMenuLabel>Bookmark</ContextMenuLabel>
        <ContextMenuItem onSelect={open}>
          <ExternalLink className="size-4" />
          Open in new tab
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onEdit(bookmark)}>
          <Pencil className="size-4" />
          Edit
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem tone="destructive" onSelect={() => onDelete(bookmark)}>
          <Trash2 className="size-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
