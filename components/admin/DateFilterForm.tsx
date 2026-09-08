import { Button } from "@/components/ui/Button";

export function DateFilterForm({ from, to }: { from?: string; to?: string }) {
  return (
    <form className="flex flex-wrap items-end gap-3" action="/admin" method="get">
      <label className="text-sm">
        <span className="mb-1 block text-ink-muted">מתאריך</span>
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-ink-muted">עד תאריך</span>
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm"
        />
      </label>
      <Button type="submit" variant="secondary">
        סינון
      </Button>
      {(from || to) && (
        <a href="/admin" className="text-sm text-primary hover:underline">
          נקה סינון
        </a>
      )}
    </form>
  );
}
