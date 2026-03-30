"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  agents: "Agents",
  new: "New",
  workflows: "Workflows",
  runs: "Runs",
  knowledge: "Knowledge",
  tools: "Tools",
  analytics: "Analytics",
  settings: "Settings",
  versions: "Versions",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1.5 text-[13px]">
      {segments.map((segment, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        const label = labelMap[segment] || segment;

        return (
          <span key={href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
            {isLast ? (
              <span className="text-slate-900 font-medium">{label}</span>
            ) : (
              <Link
                href={href}
                className="text-slate-400 transition-colors hover:text-slate-600"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
