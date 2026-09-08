import { PROVIDERS } from "@/lib/config";
import type { ProviderName } from "@/lib/types";
import { cn } from "@/lib/cn";

const styles: Record<ProviderName, { bg: string; letter: string }> = {
  openai: { bg: "bg-openai", letter: "C" },
  gemini: { bg: "bg-gemini", letter: "G" },
  anthropic: { bg: "bg-anthropic", letter: "A" },
};

export function ProviderMark({ provider, className }: { provider: ProviderName; className?: string }) {
  const style = styles[provider];
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white",
        style.bg,
        className
      )}
      aria-hidden
    >
      {style.letter}
    </span>
  );
}

export function ProviderLabel({ provider, className }: { provider: ProviderName; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold text-ink", className)}>
      <ProviderMark provider={provider} />
      {PROVIDERS[provider].label}
    </span>
  );
}
