"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Input } from "@/components/motion/input";
import {
  StatefulButton,
  type ButtonState,
} from "@/components/motion/button/stateful";
import { Button } from "@/components/motion/button/base";
import { Loader } from "@/components/motion/loader";
import { InlineTagInput } from "@/components/inline-tag-input";
import { addBookmark, updateBookmark } from "@/app/bookmarks/actions";
import { normalizeUrl, urlKey } from "@/lib/queries";
import { useTouchCapable } from "@/lib/hooks/use-touch-capable";
import { useEntrance } from "@/lib/hooks/use-entrance";
import type { Bookmark } from "@/lib/types";
import type { ToastStatus } from "@/components/motion/animated-toast-stack";

type BookmarkFormProps = {
  mode: "add" | "edit";
  initial?: Bookmark;
  /** The current library, for the duplicate-URL warning. */
  bookmarks: Bookmark[];
  existingTags: string[];
  onClose: () => void;
  /** Called with the saved bookmark so the list can update optimistically. */
  onSaved: (bookmark: Bookmark) => void;
  /** Switch the drawer to edit another bookmark (duplicate hint). */
  onRequestEdit: (bookmark: Bookmark) => void;
  onToast: (title: string, description?: string, status?: ToastStatus) => void;
};

export function BookmarkForm({
  mode,
  initial,
  bookmarks,
  existingTags,
  onClose,
  onSaved,
  onRequestEdit,
  onToast,
}: BookmarkFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState(initial?.url ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [faviconUrl, setFaviconUrl] = useState(initial?.favicon_url ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [urlError, setUrlError] = useState<string | undefined>();
  const [metaLoading, setMetaLoading] = useState(false);
  const [saveState, setSaveState] = useState<ButtonState>("idle");
  const fetchedForUrl = useRef<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const canTouch = useTouchCapable();

  // Focus the URL field on open, but on touch wait out the drawer's 400ms
  // entrance — focusing mid-slide makes the keyboard resize the visual
  // viewport and stutter the panel.
  useEffect(() => {
    const timer = setTimeout(
      () => urlInputRef.current?.focus(),
      canTouch ? 450 : 0,
    );
    return () => clearTimeout(timer);
  }, [canTouch]);

  const entrance = useEntrance();

  // Flag a URL the library already has (ignoring the bookmark being edited)
  // so the user finds out before hitting the server's unique constraint.
  const duplicate = useMemo(() => {
    const key = urlKey(url);
    if (!key) return undefined;
    return bookmarks.find(
      (bookmark) => bookmark.id !== initial?.id && urlKey(bookmark.url) === key,
    );
  }, [bookmarks, url, initial?.id]);

  // Staggered interior: sections 30ms apart, everything settled (~430ms)
  // before the touch focus lands at 450ms. Never blocks interaction;
  // reduced motion skips the stagger entirely.

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  const fetchMeta = useCallback(
    async (rawUrl: string) => {
      const candidate = rawUrl.trim();
      if (!candidate || fetchedForUrl.current === candidate) return;
      fetchedForUrl.current = candidate;
      setMetaLoading(true);
      try {
        const response = await fetch(
          `/api/meta?url=${encodeURIComponent(candidate)}`,
        );
        const data = await response.json();
        setTitle((current) => current || (data.title ?? ""));
        setDescription((current) => current || (data.description ?? ""));
        if (data.faviconUrl) setFaviconUrl(data.faviconUrl);
        if (!data.title) {
          onToast(
            "Couldn't fetch page details",
            "Enter a title manually, then save.",
            "info",
          );
        }
      } catch {
        onToast(
          "Couldn't fetch page details",
          "Enter a title manually, then save.",
          "info",
        );
      } finally {
        setMetaLoading(false);
      }
    },
    [onToast],
  );

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (fetchedForUrl.current !== url.trim()) {
      // Fetch details for a URL that was never fetched (e.g. edited URL).
      void fetchMeta(url);
    }

    if (!url.trim()) {
      setUrlError("A URL is required.");
      return;
    }
    setUrlError(undefined);
    setSaveState("loading");

    const result =
      mode === "edit" && initial
        ? await updateBookmark(initial.id, {
            url,
            title,
            description,
            favicon_url: faviconUrl || null,
            tags,
          })
        : await addBookmark({
            url,
            title,
            description,
            favicon_url: faviconUrl || null,
            tags,
          });

    if (result.ok) {
      setSaveState("success");
      const savedBookmark: Bookmark =
        mode === "edit" && initial
          ? {
              ...initial,
              url: normalizeUrl(url),
              title: title.trim(),
              description: description?.trim() || null,
              favicon_url: faviconUrl || null,
              tags,
            }
          : {
              id: result.id!,
              url: normalizeUrl(url),
              title: title.trim(),
              description: description?.trim() || null,
              favicon_url: faviconUrl || null,
              tags,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
      onSaved(savedBookmark);
      onToast(
        mode === "edit" ? "Bookmark updated" : "Bookmark saved",
        title || url,
        "success",
      );
      router.refresh();
      closeTimer.current = setTimeout(onClose, 900);
    } else {
      setSaveState("error");
      onToast("Couldn't save bookmark", result.error, "error");
      const timer = setTimeout(() => setSaveState("idle"), 2200);
      closeTimer.current = timer;
    }
  };

  return (
    <form onSubmit={handleSave} className="flex h-full flex-col">
      {/* Drawer header — fixed at the top */}
      <motion.header
        {...entrance(0)}
        className="shrink-0 border-b border-border px-5 pb-4 pt-5"
      >
        <h2 className="font-mono text-[20px] leading-[140%] font-semibold tracking-[-0.5px] text-foreground">
          {mode === "edit" ? "Edit bookmark" : "Add bookmark"}
        </h2>
        <p className="mt-1 font-mono text-sm leading-[142.857%] text-muted-foreground">
          Paste a URL and we&apos;ll pull the details.
        </p>
      </motion.header>

      {/* Scrollable fields between header and footer */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 py-4">
        <motion.div {...entrance(0.03)}>
          <Input
            label="URL"
            type="url"
            value={url}
            onChange={(value) => {
              setUrl(value);
              if (urlError) setUrlError(undefined);
              if (mode === "add") fetchedForUrl.current = null;
            }}
            onBlur={() => mode === "add" && void fetchMeta(url)}
            placeholder="https://example.com/article"
            autoComplete="off"
            required
            error={urlError}
            leftIcon={<Link2 />}
            ref={urlInputRef}
            rightIcon={
              metaLoading ? (
                <Loader
                  variant="spinner"
                  size={16}
                  label="Fetching page details"
                  className="pointer-events-none text-primary"
                />
              ) : undefined
            }
            classNames={{
              label: "font-mono",
              // Always reserve the right gutter so the fetch spinner (and the
              // text) never jump when it appears/disappears.
              input: "pr-12 font-mono font-light leading-5",
              rightIcon: "pr-2",
            }}
          />
          {duplicate ? (
            <p className="px-1 font-mono text-xs leading-5 text-muted-foreground">
              Already saved{duplicate.title ? ` as “${duplicate.title}”` : ""}{" "}
              —{" "}
              <button
                type="button"
                onClick={() => onRequestEdit(duplicate)}
                className="font-bold text-preppy-rose underline-offset-2 hover:underline"
              >
                edit it
              </button>
            </p>
          ) : null}
        </motion.div>

        <motion.div {...entrance(0.03)} className="self-end -mt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void fetchMeta(url)}
            className="font-mono"
          >
            <RefreshCw className="size-3.5" />
            Fetch details
          </Button>
        </motion.div>

        <motion.div {...entrance(0.06)}>
          <Input
            label="Title"
            value={title}
            onChange={setTitle}
            placeholder="Page title"
            classNames={{
              label: "font-mono",
              input: "font-mono font-light leading-5",
            }}
          />
        </motion.div>
        <motion.div {...entrance(0.09)}>
          <Input
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="A short note"
            classNames={{
              label: "font-mono",
              input: "font-mono font-light leading-5",
            }}
          />
        </motion.div>

        <motion.div {...entrance(0.12)} className="flex flex-col gap-1.5">
          <span className="px-1 font-mono text-sm font-medium text-foreground">
            Tags
          </span>
          <InlineTagInput
            value={tags}
            onChange={setTags}
            options={existingTags}
          />
        </motion.div>
      </div>

      {/* Sticky footer with Cancel + Save */}
      <motion.footer
        {...entrance(0.15)}
        className="shrink-0 border-t border-border px-5 py-4"
      >
        <div className="flex gap-2">
          <StatefulButton
            type="submit"
            className="flex-1 font-mono"
            state={saveState}
            loadingText="Saving…"
            successText="Saved"
            errorText="Try again"
          >
            {mode === "edit" ? "Save changes" : "Save bookmark"}
          </StatefulButton>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saveState === "loading"}
            className="font-mono"
          >
            Cancel
          </Button>
        </div>
      </motion.footer>
    </form>
  );
}
