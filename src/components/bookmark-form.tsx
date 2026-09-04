"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/motion/input";
import {
  StatefulButton,
  type ButtonState,
} from "@/components/motion/button/stateful";
import { Button } from "@/components/motion/button/base";
import { Loader } from "@/components/motion/loader";
import { TagMultiSelect } from "@/components/tag-multi-select";
import { addBookmark, updateBookmark } from "@/app/bookmarks/actions";
import { normalizeUrl } from "@/lib/queries";
import type { Bookmark } from "@/lib/types";
import type { ToastStatus } from "@/components/motion/animated-toast-stack";

type BookmarkFormProps = {
  mode: "add" | "edit";
  initial?: Bookmark;
  existingTags: string[];
  onClose: () => void;
  /** Called with the saved bookmark so the list can update optimistically. */
  onSaved: (bookmark: Bookmark) => void;
  onToast: (
    title: string,
    description?: string,
    status?: ToastStatus,
  ) => void;
};

export function BookmarkForm({
  mode,
  initial,
  existingTags,
  onClose,
  onSaved,
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
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {mode === "edit" ? "Edit bookmark" : "Add bookmark"}
        </h2>
        <p className="mt-1 text-sm font-bold text-muted-foreground">
          Paste a URL and we&apos;ll pull the details.
        </p>
      </div>

      <div className="relative">
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
          classNames={{ input: "pr-16" }}
        />
        {metaLoading ? (
          <span className="absolute right-11 top-1/2 -translate-y-1/2 text-primary">
            <Loader variant="spinner" size={16} label="Fetching page details" />
          </span>
        ) : null}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => void fetchMeta(url)}
        className="self-end -mt-2"
      >
        <RefreshCw className="size-3.5" />
        Fetch details
      </Button>

      <Input
        label="Title"
        value={title}
        onChange={setTitle}
        placeholder="Page title"
      />
      <Input
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="A short note about this link (optional)"
      />

      <div className="flex flex-col gap-1.5">
        <span className="px-1 text-sm font-medium text-foreground">Tags</span>
        <TagMultiSelect
          value={tags}
          onChange={setTags}
          options={existingTags}
        />
      </div>

      <div className="mt-2 flex gap-2">
        <StatefulButton
          type="submit"
          className="flex-1"
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
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}