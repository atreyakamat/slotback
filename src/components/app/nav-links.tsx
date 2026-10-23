"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, ListChecks, RefreshCcw, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/app", label: "Today", icon: LayoutDashboard },
  { href: "/app/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/app/campaigns", label: "Recovery", icon: RefreshCcw },
  { href: "/app/waitlist", label: "Waitlist", icon: ListChecks },
  { href: "/app/settings", label: "Settings", icon: Settings },
] as const;

type Orientation = "vertical" | "horizontal";

export function NavLinks({ orientation = "vertical" }: { orientation?: Orientation }) {
  return <NavList orientation={orientation} pathname={usePathname()} />;
}

/** Rendered while the current path is unknown (dynamic routes stream it in). */
export function NavLinksFallback({ orientation = "vertical" }: { orientation?: Orientation }) {
  return <NavList orientation={orientation} pathname={null} />;
}

function NavList({ orientation, pathname }: { orientation: Orientation; pathname: string | null }) {
  return (
    <nav aria-label="Main" className={cn("flex gap-1", orientation === "vertical" ? "flex-col" : "flex-row")}>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname !== null && (href === "/app" ? pathname === "/app" : pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-raised hover:text-foreground",
              active && "bg-surface-raised text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {/* Icon-only on narrow screens in the top bar; the label stays available to screen readers. */}
            <span className={orientation === "horizontal" ? "sr-only sm:not-sr-only" : undefined}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
