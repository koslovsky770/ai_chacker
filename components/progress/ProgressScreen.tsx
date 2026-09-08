"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

const PHASES = [
  "מנתחים את העסק...",
  "יוצרים חיפושים של לקוחות פוטנציאליים...",
  "בודקים את ChatGPT...",
  "בודקים את Gemini...",
  "בודקים את Claude...",
  "מזהים את המתחרים שמופיעים...",
];

const POLL_INTERVAL_MS = 1800;
const PHASE_INTERVAL_MS = 2600;

interface Progress {
  status: "pending" | "processing" | "completed" | "failed";
  total: number;
  completed: number;
}

export function ProgressScreen({ auditId }: { auditId: number }) {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress>({ status: "pending", total: 0, completed: 0 });
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    const phaseTimer = setInterval(() => {
      setPhaseIndex((i) => (i + 1) % PHASES.length);
    }, PHASE_INTERVAL_MS);
    return () => clearInterval(phaseTimer);
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    async function tick() {
      if (stoppedRef.current) return;
      try {
        const res = await fetch(`/api/audits/${auditId}/process`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "שגיאה בבדיקת הסטטוס");
        setError(null);
        setProgress(data);

        if (data.status === "completed") {
          stoppedRef.current = true;
          setTimeout(() => router.push(`/report/${auditId}`), 900);
          return;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "שגיאת רשת, מנסים שוב...");
      }
      timeoutId = setTimeout(tick, POLL_INTERVAL_MS);
    }

    tick();
    return () => {
      stoppedRef.current = true;
      clearTimeout(timeoutId);
    };
  }, [auditId, router]);

  const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
  const isDone = progress.status === "completed";
  const phaseText = isDone
    ? "מכינים את הדוח שלך..."
    : percentage > 0 && percentage < 100
      ? PHASES[phaseIndex]
      : PHASES[0];

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 items-center px-6 py-14">
      <Card className="w-full p-8 text-center">
        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <h1 className="text-xl font-bold text-ink">{phaseText}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {progress.total > 0
            ? `הושלמו ${progress.completed} מתוך ${progress.total} בדיקות`
            : "מתחילים את הבדיקה..."}
        </p>
        <div className="mt-6">
          <ProgressBar value={percentage} />
        </div>
        {error && <p className="mt-4 text-xs text-warning">{error}</p>}
        <p className="mt-8 text-xs text-ink-muted">
          הבדיקה יכולה לקחת כמה דקות - זה בסדר גמור להישאר בעמוד הזה.
        </p>
      </Card>
    </div>
  );
}
