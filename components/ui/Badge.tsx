import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "danger" | "warning";
  className?: string;
}) {
  const toneClasses: Record<string, string> = {
    neutral: "bg-ink/5 text-ink-muted",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    warning: "bg-warning/10 text-warning",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
