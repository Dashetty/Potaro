"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type InlineTagInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  /** Existing tags across the library, shown as suggestions below the field. */
  options: string[];
};

/**
 * Inline tag entry for the add/edit drawer — no floating dropdown.
 * Enter converts the typed text into a chip inside the field, Backspace
 * removes the last chip, and matching existing tags sit below the field as
 * square chips that can be tapped to add.
 */
export function InlineTagInput({
  value,
  onChange,
  options,
}: InlineTagInputProps) {
  const [query, setQuery] = useState("");

  const trimmed = query.trim().replace(/,/g, "");

  const add = (raw: string) => {
    const clean = raw.trim().replace(/,/g, "");
    if (!clean) return;
    onChange(value.includes(clean) ? value : [...value, clean]);
    setQuery("");
  };

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const suggestions = useMemo(() => {
    const needle = trimmed.toLocaleLowerCase();
    return options.filter(
      (tag) =>
        !value.includes(tag) &&
        (!needle || tag.toLocaleLowerCase().includes(needle)),
    );
  }, [options, trimmed, value]);

  const exactMatch = Boolean(
    trimmed &&
      options.some(
        (tag) => tag.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
      ),
  );
  const showCreateHint = Boolean(trimmed && !exactMatch && suggestions.length === 0);

  return (
    <div className="flex w-full flex-col gap-1.5">
      {/* Selected chips + free-text input, inside the field */}
      <div className="flex min-h-11 w-full cursor-text flex-wrap items-center gap-1.5 rounded-[16.8px] border border-border bg-transparent px-2.5 py-1.5 text-sm text-foreground transition-[border-color] focus-within:ring-2 focus-within:ring-foreground/20">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex h-7 max-w-full items-center gap-1 rounded-lg bg-muted px-2 text-xs font-medium text-foreground"
          >
            <span className="truncate">{tag}</span>
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => remove(tag)}
              className="-mr-1 grid size-5 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden="true" className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            // Enter commits the typed tag; ignore composition Enter (IME).
            if (event.key === "Enter") {
              if (event.nativeEvent.isComposing) return;
              event.preventDefault();
              add(trimmed);
              return;
            }
            // Backspace on an empty field removes the last chip.
            if (event.key === "Backspace" && !query && value.length > 0) {
              event.preventDefault();
              remove(value[value.length - 1]);
            }
          }}
          placeholder={value.length ? "" : "Type a tag, press Enter…"}
          aria-label="Add tags"
          autoComplete="off"
          className="h-7 min-w-12 flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Existing tags as square suggestion chips, filtered by the query */}
      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => add(tag)}
              className={cn(
                "shrink-0 rounded-none border border-white/10 bg-white/5 px-2 py-1 font-mono text-sm leading-5 font-bold text-foreground transition-colors",
                "hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      ) : showCreateHint ? (
        <p className="px-1 font-mono text-xs text-muted-foreground">
          Press Enter to add &ldquo;{trimmed}&rdquo;
        </p>
      ) : null}
    </div>
  );
}