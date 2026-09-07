"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { BookOpen, Globe, LogOut, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/motion/input";
import { Button } from "@/components/motion/button/base";
import {
  StatefulButton,
  type ButtonState,
} from "@/components/motion/button/stateful";
import { MorphingModal } from "@/components/motion/morphing-modal";
import { Drawer } from "@/components/motion/drawer";
import { Dock, DockItem, DockSeparator } from "@/components/motion/dock";
import {
  AnimatedToastStack,
  useAnimatedToastStack,
} from "@/components/motion/animated-toast-stack";
import { TagBar } from "@/components/tag-bar";
import { CommandPalette } from "@/components/motion/command-palette";
import { BookmarkCard } from "@/components/bookmark-card";
import { BookmarkForm } from "@/components/bookmark-form";
import { deleteBookmark } from "@/app/bookmarks/actions";
import { signOut } from "@/app/auth/actions";
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

  // Latest UI state for the global ⌘N handler, so it never opens the drawer
  // over an open modal or palette.
  const uiStateRef = useRef({ modal, paletteOpen });
  useEffect(() => {
    uiStateRef.current = { modal, paletteOpen };
  }, [modal, paletteOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        const { modal: m, paletteOpen: p } = uiStateRef.current;
        if (!m && !p) setModal({ mode: "add" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const bookmark of bookmarks) {
      for (const tag of bookmark.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return counts;
  }, [bookmarks]);

  // Tags ordered by how many bookmarks carry them (heaviest first), ties
  // alphabetical.
  const allTags = useMemo(
    () =>
      [...tagCounts.keys()].sort((a, b) => {
        const diff = (tagCounts.get(b) ?? 0) - (tagCounts.get(a) ?? 0);
        return diff !== 0 ? diff : a.localeCompare(b);
      }),
    [tagCounts],
  );
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
    <div className="page-shell flex w-full flex-col bg-background">
      <header className="relative z-10 px-5 pt-5 pb-3 md:px-8">
        <div className="grid grid-cols-2 items-center gap-x-3 gap-y-3 md:grid-cols-[1fr_minmax(12rem,28rem)_1fr]">
          <span className="select-none justify-self-start font-display text-4xl leading-none tracking-tight text-white inline-block [translate-y_1px] md:text-5xl">
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
                ) : undefined
              }
            />
          </div>

          <div className="col-start-2 row-start-1 flex items-center justify-self-end gap-1.5 md:col-start-3">
            <Button
              type="button"
              size="sm"
              onClick={() => setModal({ mode: "add" })}
              className="hidden font-mono active:scale-[0.96] md:inline-flex"
            >
              <Plus className="size-4" />
              Add
              <kbd className="hidden rounded-sm border border-white/15 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-medium leading-[133%] text-white md:inline-block">
                ⌘N
              </kbd>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              className="hidden md:inline-flex"
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
        <TagBar
          tags={allTags}
          counts={tagCounts}
          activeTag={activeTag}
          showClear={hasFilters}
          onSelect={setActiveTag}
          onClear={clearFilters}
        />
      ) : null}

      <main className="library-canvas flex w-full flex-1 flex-col bg-[#1a1619] px-5 pb-28 pt-4 md:px-8 md:pb-4">
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
            <motion.div className="grid w-full grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence initial={false} mode="popLayout">
                {filtered.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    onEdit={(b) => setModal({ mode: "edit", bookmark: b })}
                    onDelete={(b) => setModal({ mode: "delete", bookmark: b })}
                    onTagClick={setActiveTag}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
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

      {/* Add / edit drawer — right-side temporary panel */}
      <Drawer
        open={modal !== null && modal.mode !== "delete"}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
        ariaLabel="Add or edit bookmark"
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
      </Drawer>

      {/* Delete confirmation stays in the modal, opened from the context menu */}
      <MorphingModal
        viewId={modal?.mode === "delete" ? "delete" : null}
        onClose={() => {
          setModal(null);
          setDeleteState("idle");
        }}
        placement="bottom"
      >
        {modal?.mode === "delete" ? (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-mono text-lg font-semibold leading-tight text-foreground">
                Delete bookmark?
              </h2>
              <p className="mt-1 font-mono text-sm leading-6 text-muted-foreground">
                “{modal.bookmark.title || modal.bookmark.url}” will be
                permanently removed. This can&apos;t be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 font-mono"
                onClick={() => setModal(null)}
                disabled={deleteState === "loading"}
              >
                Cancel
              </Button>
              <StatefulButton
                className="flex-1 font-mono"
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

      {/* Mobile action dock — Add / Search / Sign out. Desktop keeps these
          in the header; the dock hides at md+. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[env(safe-area-inset-bottom)] md:hidden">
        <Dock className="pointer-events-auto mb-4">
          <DockItem
            aria-label="Add bookmark"
            onClick={() => setModal({ mode: "add" })}
          >
            <Plus className="size-5" />
          </DockItem>
          <DockItem
            aria-label="Search bookmarks"
            onClick={() => setPaletteOpen(true)}
          >
            <Search className="size-5" />
          </DockItem>
          <DockSeparator />
          <DockItem aria-label="Sign out" onClick={() => void signOut()}>
            <LogOut className="size-5" />
          </DockItem>
        </Dock>
      </div>

      <AnimatedToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        position="bottom-right"
        fixed
        className="bottom-[calc(6rem_+_env(safe-area-inset-bottom))] md:bottom-6"
      />
    </div>
  );
}
