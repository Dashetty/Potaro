"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectEmpty,
  MultiSelectInput,
  MultiSelectItem,
  MultiSelectLabel,
  MultiSelectList,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/motion/multi-select";

type TagMultiSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
  /** Existing tags across the library, used for autocomplete. */
  options: string[];
};

/**
 * Tag picker: autocompletes from existing tags and lets you type a brand-new
 * tag (a "create" row appears when the typed text matches nothing).
 */
export function TagMultiSelect({
  value,
  onChange,
  options,
}: TagMultiSelectProps) {
  const [query, setQuery] = useState("");

  const trimmed = query.trim().replace(/,/g, "");
  const exactMatch = Boolean(
    trimmed &&
      options.some((tag) => tag.toLowerCase() === trimmed.toLowerCase()),
  );
  const showCreate = Boolean(trimmed && !exactMatch);

  return (
    <MultiSelect
      value={value}
      onValueChange={onChange}
      query={query}
      onQueryChange={setQuery}
    >
      <MultiSelectTrigger>
        <MultiSelectValue placeholder="Add tags…" />
        <MultiSelectInput placeholder="Type to search or create…" />
      </MultiSelectTrigger>
      <MultiSelectContent>
        <MultiSelectList>
          <MultiSelectLabel>Existing tags</MultiSelectLabel>
          {options.map((tag) => (
            <MultiSelectItem key={tag} value={tag}>
              {tag}
            </MultiSelectItem>
          ))}
          {showCreate ? (
            <MultiSelectItem value={trimmed}>
              <span className="inline-flex items-center gap-1.5">
                <Plus className="size-3.5" />
                Add “{trimmed}”
              </span>
            </MultiSelectItem>
          ) : null}
          <MultiSelectEmpty>No tags yet.</MultiSelectEmpty>
        </MultiSelectList>
      </MultiSelectContent>
    </MultiSelect>
  );
}