import type * as React from "react";

import { Input } from "@usepreface/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@usepreface/ui/components/select";
import { SearchIcon } from "@usepreface/ui/icons";

export type Filter = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
};

/** Search and filters above a table, with room for actions on the right. */
export function TableToolbar({
  search,
  onSearch,
  placeholder,
  filters = [],
  children,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  filters?: readonly Filter[];
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-70">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-icon-secondary" />
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="pl-8"
        />
      </div>
      {filters.map((filter) => (
        <Select
          key={filter.label}
          items={filter.options}
          value={filter.value}
          onValueChange={(value) => filter.onChange(String(value))}
        >
          <SelectTrigger aria-label={filter.label} className="w-38">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      <div className="flex-1" />
      {children}
    </div>
  );
}

/** Lower-cased containment, for filtering placeholder rows. */
export function matches(query: string, ...values: readonly string[]): boolean {
  const needle = query.trim().toLowerCase();
  return !needle || values.some((value) => value.toLowerCase().includes(needle));
}
