import * as React from "react";

import { PrefaceMark } from "@usepreface/ui/brand";
import { Kbd } from "@usepreface/ui/components/kbd";
import { SearchIcon } from "@usepreface/ui/icons";
import { BrandLogo } from "@usepreface/ui/logos/registry";

import { useInView } from "../../../../hooks/use-in-view";
import { actions, documents } from "./samples";
import { useTypedQuery } from "./use-typed-query";

function matches(words: string, query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return terms.length === 0 || terms.some((t) => words.includes(t.slice(0, 4)));
}

function Hint({ keys, children }: { keys: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <Kbd className="h-5 min-w-6 px-1 font-mono text-[11px]">{keys}</Kbd>
      {children}
    </span>
  );
}

const groupHeading =
  "px-3 pt-3 pb-1.5 font-mono text-[11px] leading-3.5 font-medium tracking-[0.08em] text-fg-tertiary uppercase";
const row =
  "flex h-11 cursor-default items-center gap-3 rounded-[10px] px-3 text-base text-foreground select-none data-active:bg-hover";

/*
 * A small listbox palette (input + aria-activedescendant). It is written out here rather than
 * using cmdk because cmdk scrolls the selected item into view, which would scroll the page
 * while the demo types.
 */
export function CommandPaletteDemo() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, "-25% 0px");
  const typed = useTypedQuery(inView);
  const query = typed.value.trim();
  const id = React.useId();
  const visibleDocs = documents.filter((d) => matches(d.words, query));
  const options = ["ask", ...visibleDocs.map((d) => d.title), ...actions.map((a) => a.title)];
  const [active, setActive] = React.useState("ask");
  const current = options.includes(active) ? active : "ask";
  const optionId = (value: string) => `${id}-${options.indexOf(value)}`;

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const i = options.indexOf(current);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = (i + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
      setActive(options[next] ?? "ask");
    } else if (event.key === "Escape") {
      typed.onValueChange("");
    }
  };

  return (
    <div
      ref={ref}
      className="w-full max-w-200 overflow-hidden rounded-2xl border border-border-subtle bg-popover text-popover-foreground shadow-[0_32px_80px_rgb(23_71_201/0.18)] dark:shadow-[0_32px_80px_rgb(0_0_0/0.6)]"
    >
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <SearchIcon size={20} className="shrink-0 text-icon-secondary" />
        <input
          role="combobox"
          aria-expanded="true"
          aria-controls={`${id}-list`}
          aria-activedescendant={optionId(current)}
          aria-label="Search or ask"
          placeholder="Search or ask anything"
          value={typed.value}
          onChange={(e) => typed.onValueChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="h-full min-w-0 flex-1 bg-transparent text-lg text-foreground caret-primary outline-none placeholder:text-fg-tertiary"
        />
        <Kbd className="h-6 px-1.5 font-mono text-xs">esc</Kbd>
      </div>
      <div id={`${id}-list`} role="listbox" aria-label="Results" className="p-2 sm:p-3">
        <div
          id={optionId("ask")}
          role="option"
          aria-selected={current === "ask"}
          data-active={current === "ask" || undefined}
          onPointerMove={() => setActive("ask")}
          className="flex cursor-default items-center gap-3 rounded-[10px] px-3 py-2.5 select-none data-active:bg-primary-subtle"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-slate">
            <PrefaceMark tone="ice" size={18} title="" />
          </span>
          <span className="flex min-w-0 flex-col text-left">
            <span className="truncate text-base text-foreground">
              <span className="text-fg-accent">Ask Preface:</span>{" "}
              {query ? `“How do I ${query}?”` : "“Ask anything about Acme”"}
            </span>
            <span className="text-13 text-fg-secondary">
              Answers from {Math.max(visibleDocs.length + 1, 2)} sources with citations
            </span>
          </span>
          <span aria-hidden="true" className="ml-auto text-xs text-fg-accent">
            ↵
          </span>
        </div>
        {visibleDocs.length ? (
          <div role="group" aria-labelledby={`${id}-docs`}>
            <div id={`${id}-docs`} className={groupHeading}>
              Documents
            </div>
            {visibleDocs.map(({ title, meta, icon: Icon }) => (
              <div
                key={title}
                id={optionId(title)}
                role="option"
                aria-selected={current === title}
                data-active={current === title || undefined}
                onPointerMove={() => setActive(title)}
                className={row}
              >
                {typeof Icon === "string" ? (
                  <BrandLogo name={Icon} size={18} aria-hidden="true" />
                ) : (
                  <Icon size={18} className="text-icon-secondary" />
                )}
                <span className="truncate">{title}</span>
                <span className="ml-auto shrink-0 text-sm text-fg-tertiary max-sm:hidden">
                  {meta}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        <div role="group" aria-labelledby={`${id}-actions`}>
          <div id={`${id}-actions`} className={groupHeading}>
            Actions
          </div>
          {actions.map(({ title, keys, icon: Icon }) => (
            <div
              key={title}
              id={optionId(title)}
              role="option"
              aria-selected={current === title}
              data-active={current === title || undefined}
              onPointerMove={() => setActive(title)}
              className={row}
            >
              <Icon size={18} className="text-icon-secondary" />
              <span className="truncate">{title}</span>
              <span className="ml-auto flex items-center gap-2 text-sm text-fg-tertiary max-sm:hidden">
                Action
                <Kbd className="h-6 gap-1.5 px-1.5 font-mono text-xs">{keys.join(" ")}</Kbd>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-5 border-t bg-surface-2 px-5 py-3 text-sm text-fg-secondary">
        <Hint keys="↑↓">Navigate</Hint>
        <Hint keys="↵">Open</Hint>
        <span className="max-sm:hidden">
          <Hint keys="⌘↵">Ask Preface</Hint>
        </span>
        <span className="ml-auto flex items-center gap-2 font-medium text-foreground">
          <PrefaceMark size={18} title="" />
          Preface
        </span>
      </div>
    </div>
  );
}
