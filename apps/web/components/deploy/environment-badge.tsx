"use client";

import { cn } from "@/lib/utils";
import type { Environment } from "@shared/types/deployment";

const ENV_STYLES: Record<Environment, { bg: string; text: string; dot: string }> = {
  DEV: {
    bg: "bg-sage-50",
    text: "text-sage-600",
    dot: "bg-sage-500",
  },
  STAGING: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    dot: "bg-amber-500",
  },
  PROD: {
    bg: "bg-sage-50",
    text: "text-sage-600",
    dot: "bg-sage-500",
  },
};

const ENV_LABELS: Record<Environment, string> = {
  DEV: "Dev",
  STAGING: "Staging",
  PROD: "Prod",
};

export function EnvironmentBadge({
  env,
  size = "md",
  showLabel = true,
}: {
  env: Environment;
  size?: "sm" | "md";
  showLabel?: boolean;
}) {
  const styles = ENV_STYLES[env];

  if (!showLabel) {
    return (
      <span
        className={cn(
          "inline-block rounded-full",
          size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
          styles.dot
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        styles.bg,
        styles.text,
        size === "sm"
          ? "px-2 py-0.5 text-[11px]"
          : "px-2.5 py-1 text-[12px]"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
      {ENV_LABELS[env]}
    </span>
  );
}
