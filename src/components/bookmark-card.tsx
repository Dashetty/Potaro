"use client";

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
import { Tooltip } from "@/components/motion/tooltip";
import { Button } from "@/components/motion/button/base";
import { domainOf, formatRelativeTime } from "@/lib/format";
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
  const title = bookmark.title || bookmark.url;

  const open = () =>
    window.open(bookmark.url, "_blank", "noopener,noreferrer");

  const inner = (
    <div
      role="link"
      tabIndex={0}
      aria-label={title}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter") open();
      }}
      className="group h-full cursor-pointer rounded-[5px] border border-border bg-card p-3.5 shadow-[0_20px_25px_-5px_oklch(0_0_0_/_0.4),0_8px_10px_-6px_oklch(0_0_0_/_0.4)] outline-none transition-[border-color] duration-200 hover:border-white/15 focus-visible:border-primary/50"
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/5 text-primary">
          {bookmark.favicon_url && !faviconFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bookmark.favicon_url}
              alt=""
              className="size-5 rounded-[7px] object-cover"
              loading="lazy"
              onError={() => setFaviconFailed(true)}
            />
          ) : (
            <Globe className="size-4" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 font-display text-base leading-5 tracking-tight text-foreground">
            {title}
          </p>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-sm leading-5 font-bold text-muted-foreground">
            <span className="truncate">{domainOf(bookmark.url)}</span>
            <span aria-hidden="true">
              ·
            </span>
            <span className="shrink-0">
              {formatRelativeTime(bookmark.created_at)}
            </span>
          </div>
        </div>

        {/* Hover actions */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Edit ${title}`}
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
              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-sm leading-5 font-bold text-foreground transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        {bookmark.description ? (
          <Tooltip content={bookmark.description} side="top" delay={350}>
            <div className="h-full">{inner}</div>
          </Tooltip>
        ) : (
          <div className="h-full">{inner}</div>
        )}
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