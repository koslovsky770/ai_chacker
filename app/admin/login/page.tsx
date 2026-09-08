"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FieldWrapper, Input } from "@/components/ui/Field";

export default function AdminLoginPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בהתחברות");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא צפויה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 items-center px-6 py-14">
      <Card className="w-full p-8">
        <h1 className="mb-6 text-xl font-bold text-ink">כניסת מנהל</h1>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <FieldWrapper label="סיסמת מנהל" required>
            <Input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} autoFocus />
          </FieldWrapper>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "מתחבר..." : "כניסה"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
