"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { THEME_STORAGE_KEY } from "./theme-script";

type Preference = "system" | "light" | "dark";

const OPTIONS: { value: Preference; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

function resolve(pref: Preference): "light" | "dark" {
  if (pref === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  return pref;
}

function apply(pref: Preference) {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  root.dataset.theme = resolve(pref);
  root.dataset.themePreference = pref;
  window.setTimeout(() => root.classList.remove("theme-transition"), 220);
}

/** The preference lives on <html data-theme-preference>, set before paint by ThemeScript. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme-preference"] });
  return () => observer.disconnect();
}

const readPreference = () => (document.documentElement.dataset.themePreference as Preference | undefined) ?? "system";

export function ThemeToggle({ className }: { className?: string }) {
  // Null on the server, so no option renders as selected until the real preference is known.
  const pref = useSyncExternalStore(subscribe, readPreference, () => null);

  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  function choose(next: Preference) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the choice still applies for this visit.
    }
    apply(next);
  }

  return (
    <div role="radiogroup" aria-label="Theme" className={cn("inline-flex rounded-lg border bg-surface p-0.5", className)}>
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={pref === value}
          onClick={() => choose(value)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted transition-colors hover:text-foreground",
            pref === value && "bg-surface-raised text-foreground",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}
