"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Globe, LogOut, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/motion/input";
import { Button } from "@/components/motion/button/base";
import {
  StatefulButton,
  type ButtonState,
} from "@/components/motion/button/stateful";
import { MorphingModal } from "@/components/motion/morphing-modal";
import {
  AnimatedToastStack,
  useAnimatedToastStack,
} from "@/components/motion/animated-toast-stack";
import { CommandPalette } from "@/components/motion/command-palette";
import { BookmarkCard } from "@/components/bookmark-card";
import { BookmarkForm } from "@/components/bookmark-form";
import { deleteBookmark } from "@/app/bookmarks/actions";
import { signOut } from "@/app/auth/actions";
import { collectTags } from "@/lib/queries";
import { domainOf } from "@/lib/format";
import type { Bookmark } from "@/lib/types";

type HomeClientProps = {
  initialBookmarks: Bookmark[];
  existingTags: string[];
};

type ModalState =
  | { mode: "add" }
  | { mode: "edit"; bookmark: Bookmark }
  | { mode: "delete"; bookmark: Bookmark }
  | null;

export function HomeClient({
  initialBookmarks,
  existingTags,
}: HomeClientProps) {
  const router = useRouter();
  const { toasts, showToast, dismissToast } = useAnimatedToastStack();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [deleteState, setDeleteState] = useState<ButtonState>("idle");

  const allTags = useMemo(() => collectTags(bookmarks), [bookmarks]);
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();

  const filtered = useMemo(() => {
    return bookmarks.filter((bookmark) => {
      if (activeTag && !bookmark.tags.includes(activeTag)) return false;
      if (!normalizedQuery) return true;
      return (
        bookmark.title.toLocaleLowerCase().includes(normalizedQuery) ||
        bookmark.url.toLocaleLowerCase().includes(normalizedQuery) ||
        bookmark.tags.some((tag) =>
          tag.toLocaleLowerCase().includes(normalizedQuery),
        )
      );
    });
  }, [bookmarks, activeTag, normalizedQuery]);

  const hasFilters = Boolean(searchQuery.trim() || activeTag);

  const addLocal = (bookmark: Bookmark) => {
    setBookmarks((current) => [bookmark, ...current]);
  };

  const updateLocal = (bookmark: Bookmark) => {
    setBookmarks((current) =>
      current.map((b) => (b.id === bookmark.id ? bookmark : b)),
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveTag(null);
  };

  const handleDelete = async () => {
    if (!modal || modal.mode !== "delete") return;
    setDeleteState("loading");
    const result = await deleteBookmark(modal.bookmark.id);
    if (result.ok) {
      setDeleteState("success");
      setBookmarks((current) =>
        current.filter((b) => b.id !== modal.bookmark.id),
      );
      showToast({
        title: "Bookmark deleted",
        description: modal.bookmark.title,
        status: "success",
      });
      router.refresh();
      setTimeout(() => {
        setModal(null);
        setDeleteState("idle");
      }, 700);
    } else {
      setDeleteState("error");
      showToast({
        title: "Couldn't delete bookmark",
        description: result.error,
        status: "error",
      });
      setTimeout(() => setDeleteState("idle"), 2200);
    }
  };

  const paletteItems = useMemo(
    () =>
      bookmarks.map((bookmark) => ({
        id: bookmark.id,
        label: bookmark.title || bookmark.url,
        group: domainOf(bookmark.url),
        hint: bookmark.url,
        keywords: [bookmark.url, ...bookmark.tags],
        icon: Globe,
        onSelect: () =>
          window.open(bookmark.url, "_blank", "noopener,noreferrer"),
      })),
    [bookmarks],
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="relative z-10 px-5 pt-5 pb-3 md:px-8">
        <div className="grid grid-cols-2 items-center gap-x-3 gap-y-3 md:grid-cols-[1fr_minmax(12rem,28rem)_1fr]">
          <span className="select-none justify-self-start font-display text-4xl leading-none tracking-tight text-white md:text-5xl">
            Potaro
          </span>

          <div className="col-span-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
            <Input
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search title, URL, tags…"
              aria-label="Search bookmarks"
              leftIcon={<Search />}
              classNames={{
                field: "",
                input: "pr-[4.5rem] font-mono text-base",
                rightIcon:
                  "pr-1.5 [&_button]:size-auto [&_button]:h-11 [&_button]:min-w-11 [&_button]:px-2",
              }}
              rightIcon={
                searchQuery ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="size-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label="Open command palette"
                    onClick={() => setPaletteOpen(true)}
                    className="md:hidden"
                  >
                    <span className="flex items-center gap-0.5">
                      <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                        ⌘
                      </kbd>
                      <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                        K
                      </kbd>
                    </span>
                  </button>
                )
              }
            />
          </div>

          <div className="col-start-2 row-start-1 flex items-center justify-self-end gap-1.5 md:col-start-3">
            <button
              type="button"
              aria-label="Search bookmarks (⌘K)"
              onClick={() => setPaletteOpen(true)}
              className="hidden h-8 items-center justify-center gap-1.5 rounded-full border border-white/10 px-3 transition-colors hover:bg-white/5 md:inline-flex"
            >
              <Search className="size-3.5 text-foreground" />
              <kbd className="rounded-sm border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] font-medium leading-[133%] text-muted-foreground">
                ⌘K
              </kbd>
            </button>
            <Button
              type="button"
              size="sm"
              onClick={() => setModal({ mode: "add" })}
              className="font-mono active:scale-[0.96]"
            >
              <Plus className="size-4" />
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={() => {
                void signOut();
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
        {/* Dashed rule separating the two top sections */}
        <div
          aria-hidden="true"
          className="rule-dashed pointer-events-none absolute inset-x-0 bottom-0"
        />
      </header>

      {allTags.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-1.5 border-b-2 border-pink-horror/50 px-5 py-2.5 md:px-8">
          {allTags.map((tag) => {
            const selected = activeTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(selected ? null : tag)}
                className={
                  selected
                    ? "shrink-0 rounded-[3px] border border-white/15 bg-white/10 px-3 py-1 font-mono text-sm text-white transition-colors"
                    : "shrink-0 rounded-[3px] border border-white/10 bg-white/5 px-3 py-1 font-mono text-sm text-foreground transition-colors hover:bg-white/10"
                }
              >
                {tag}
              </button>
            );
          })}
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex shrink-0 items-center gap-1 rounded-[3px] px-3 py-1 font-mono text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <X className="size-3.5" />
              Clear
            </button>
          ) : null}
        </div>
      ) : null}

      <main className="library-canvas flex w-full flex-1 flex-col bg-[#1a1619] px-5 py-4 md:px-8">
        {filtered.length === 0 ? (
          <div className="flex min-h-72 flex-1 flex-col items-center justify-center gap-2 text-center">
            <BookOpen className="size-9 text-primary" aria-hidden="true" />
            {bookmarks.length === 0 ? (
              <>
                <p className="text-base font-semibold text-foreground">
                  No bookmarks yet
                </p>
                <p className="font-mono text-sm text-muted-foreground">
                  Press ⌘K or hit Add to save your first link.
                </p>
                <Button
                  className="mt-3 font-mono"
                  onClick={() => setModal({ mode: "add" })}
                >
                  <Plus className="size-4" />
                  Add bookmark
                </Button>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-foreground">
                  Nothing matches
                </p>
                <p className="font-mono text-sm text-muted-foreground">
                  Try another search or clear the filters.
                </p>
                <Button
                  variant="outline"
                  className="mt-3 font-mono"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="mx-auto grid w-full max-w-[38rem] grid-cols-1 gap-2.5">
              {filtered.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onEdit={(b) => setModal({ mode: "edit", bookmark: b })}
                  onDelete={(b) => setModal({ mode: "delete", bookmark: b })}
                  onTagClick={setActiveTag}
                />
              ))}
            </div>
            <p className="mx-auto w-full max-w-[38rem] py-5 text-center font-mono text-xs text-muted-foreground">
              You&apos;ve reached the end of your library
            </p>
          </>
        )}
      </main>

      {/* ⌘K palette */}
      <CommandPalette
        items={paletteItems}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        placeholder="Search your bookmarks…"
        emptyMessage="No bookmarks match that search."
      />

      {/* Add / edit / delete modal */}
      <MorphingModal
        viewId={modal ? modal.mode : null}
        onClose={() => {
          setModal(null);
          setDeleteState("idle");
        }}
        placement="bottom"
      >
        {modal?.mode === "add" ? (
          <BookmarkForm
            mode="add"
            existingTags={existingTags}
            onClose={() => setModal(null)}
            onSaved={addLocal}
            onToast={(title, description, status) =>
              showToast({ title, description, status })
            }
          />
        ) : null}
        {modal?.mode === "edit" ? (
          <BookmarkForm
            mode="edit"
            initial={modal.bookmark}
            existingTags={existingTags}
            onClose={() => setModal(null)}
            onSaved={updateLocal}
            onToast={(title, description, status) =>
              showToast({ title, description, status })
            }
          />
        ) : null}
        {modal?.mode === "delete" ? (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold leading-tight text-foreground">
                Delete bookmark?
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                “{modal.bookmark.title || modal.bookmark.url}” will be
                permanently removed. This can&apos;t be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setModal(null)}
                disabled={deleteState === "loading"}
              >
                Cancel
              </Button>
              <StatefulButton
                className="flex-1"
                state={deleteState}
                loadingText="Deleting…"
                successText="Deleted"
                errorText="Retry"
                onClick={() => void handleDelete()}
              >
                Delete
              </StatefulButton>
            </div>
          </div>
        ) : null}
      </MorphingModal>

      <AnimatedToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        position="bottom-right"
        fixed
      />
    </div>
  );
}