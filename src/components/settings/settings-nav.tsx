"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/app/settings", label: "General" },
  { href: "/app/settings/services", label: "Services" },
  { href: "/app/settings/staff", label: "Staff" },
  { href: "/app/settings/team", label: "Team" },
  { href: "/app/settings/app", label: "Phone app" },
  { href: "/app/settings/activity", label: "Activity" },
];

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings" className="mb-6 flex gap-1 overflow-x-auto border-b">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 whitespace-nowrap border-b-2 border-transparent px-3 pb-2.5 text-sm font-medium text-muted hover:text-foreground",
              active && "border-foreground text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
