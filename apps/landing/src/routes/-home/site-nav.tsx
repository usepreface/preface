import * as React from "react";

import { PrefaceLogo } from "@usepreface/ui/brand";
import { Button, buttonVariants } from "@usepreface/ui/components/button";
import { useTheme } from "@usepreface/ui/components/theme-provider";
import { CloseIcon, MenuIcon, MoonIcon, SunIcon } from "@usepreface/ui/icons";
import { cn } from "@usepreface/ui/lib/utils";
import { GitHubLogo } from "@usepreface/ui/logos";

import { formatStars } from "../../lib/github";
import { site } from "../../site";

export const navLinks = [
  { label: "Product", href: "#how-it-works" },
  { label: "Integrations", href: "#integrations" },
  { label: "Docs", href: site.docs },
  { label: "Enterprise", href: "#pricing" },
  { label: "Changelog", href: `${site.github}/releases` },
] as const;

/** Light/dark segmented switch. The active segment comes from the `.dark` class, not state,
 * so the prerendered markup matches whatever theme the boot script applied. */
function ThemeSwitch({ className }: { className?: string }) {
  const { setTheme } = useTheme();
  const segment =
    "flex size-7 items-center justify-center rounded-full text-icon-secondary outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring [&_svg]:size-3.5";
  return (
    <div
      role="group"
      aria-label="Colour theme"
      className={cn("flex items-center gap-0.5 rounded-full bg-surface-3 p-0.75", className)}
    >
      <button
        type="button"
        aria-label="Light theme"
        onClick={() => setTheme("light")}
        className={cn(segment, "not-dark:bg-surface-1 not-dark:text-icon not-dark:shadow-xs")}
      >
        <SunIcon />
      </button>
      <button
        type="button"
        aria-label="Dark theme"
        onClick={() => setTheme("dark")}
        className={cn(segment, "dark:bg-surface-1 dark:text-icon dark:shadow-xs")}
      >
        <MoonIcon />
      </button>
    </div>
  );
}

function GitHubButton({ stars, className }: { stars: number | null; className?: string }) {
  return (
    <a
      href={site.github}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-full border border-border-default px-3 text-fg-secondary outline-none transition-colors hover:border-border-strong hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring",
        className,
      )}
    >
      <GitHubLogo size={16} variant="auto" aria-hidden="true" />
      <span className="font-mono text-xs">{stars === null ? "Star" : formatStars(stars)}</span>
      <span className="sr-only">
        {stars === null ? "Preface on GitHub" : `Preface on GitHub, ${stars} stars`}
      </span>
    </a>
  );
}

export function SiteNav({ stars }: { stars: number | null }) {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const panelId = React.useId();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="landing-enter fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 [--rise:-12px] lg:pt-5">
      <nav
        aria-label="Main"
        data-scrolled={scrolled || undefined}
        className="relative flex h-13 w-full max-w-270 items-center gap-3 rounded-[26px] border border-(--landing-nav-edge) bg-(--landing-nav) pr-2 pl-4 shadow-(--landing-nav-shadow) backdrop-blur-2xl transition-[background-color,box-shadow] duration-300 data-scrolled:bg-(--landing-nav-scrolled) lg:h-14 lg:gap-7 lg:pr-2.5 lg:pl-5.5"
      >
        <a
          href="#top"
          aria-label="Preface home"
          className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-focus-ring"
        >
          <PrefaceLogo size={22} className="max-lg:hidden" />
          <PrefaceLogo size={20} className="lg:hidden" />
        </a>
        <ul className="hidden flex-1 items-center justify-center gap-6.5 lg:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="rounded-sm text-sm text-fg-secondary outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-focus-ring"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <span className="flex-1 lg:hidden" />
        <ThemeSwitch className="max-sm:hidden" />
        <GitHubButton stars={stars} className="max-md:hidden" />
        <a
          href="#get-started"
          className={cn(buttonVariants(), "h-9 rounded-full px-4 max-sm:hidden")}
        >
          Get started
        </a>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full lg:hidden"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </Button>
        <div
          id={panelId}
          hidden={!open}
          className="absolute inset-x-0 top-full mt-2 rounded-3xl border border-(--landing-nav-edge) bg-(--landing-nav-scrolled) p-3 shadow-(--landing-nav-shadow) backdrop-blur-2xl lg:hidden"
        >
          <ul className="flex flex-col">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center rounded-xl px-3 text-base text-foreground outline-none hover:bg-hover focus-visible:ring-3 focus-visible:ring-focus-ring"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center gap-2 border-t pt-3">
            <ThemeSwitch />
            <GitHubButton stars={stars} />
            <a
              href="#get-started"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants(), "ml-auto h-9 rounded-full px-4")}
            >
              Get started
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
