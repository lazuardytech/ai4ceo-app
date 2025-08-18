"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/toast";

type Trait = {
  id: string;
  label: string;
  description?: string;
};

const PRESET_TRAITS: Trait[] = [
  { id: "friendly", label: "Friendly", description: "Warm and approachable tone." },
  { id: "concise", label: "Concise", description: "Short, efficient answers." },
  { id: "curious", label: "Curious", description: "Asks clarifying questions when needed." },
  { id: "empathetic", label: "Empathetic", description: "Validates feelings and context." },
  { id: "direct", label: "Direct", description: "Gives straight, actionable guidance." },
  { id: "supportive", label: "Supportive", description: "Encouraging and patient tone." },
];

export function OnboardingForm({ defaultName }: { defaultName?: string | null }) {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState<string>(defaultName ?? "");
  const [selected, setSelected] = useState<string[]>([]);

  const canNext = useMemo(() => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return selected.length > 0;
    return true;
  }, [step, name, selected]);

  const toggleTrait = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), traits: selected }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to save onboarding");
      }

      // Encourage next step: go to billing if no active sub, else home.
      try {
        const statusRes = await fetch("/api/billing/status", { method: "GET" });
        if (statusRes.ok) {
          const data = await statusRes.json();
          if (!data.hasActiveSubscription) {
            router.replace("/billing");
            return;
          }
        }
      } catch {}
      router.replace("/");
    } catch (e: any) {
      toast({ type: "error", description: e?.message || "Failed to save" });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    // If name already present (e.g., autofill), allow fast next
  }, [name]);

  return (
    <div className="mx-auto max-w-xl w-full space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Welcome! Let’s personalize your assistant</h1>
        <p className="text-sm text-muted-foreground">A quick setup to fit your style.</p>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <div className={`h-2 flex-1 rounded bg-muted ${step >= 1 ? "bg-primary" : ""}`} />
        <div className={`h-2 flex-1 rounded bg-muted ${step >= 2 ? "bg-primary" : ""}`} />
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Sarah Tan"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">We’ll use this for a more personal touch.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => router.replace("/")}>Skip</Button>
            <Button disabled={!canNext} onClick={() => setStep(2)}>Next</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Preferred Bot Traits</Label>
            <p className="text-xs text-muted-foreground">Pick at least one. You can change this later.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_TRAITS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`text-left rounded border p-3 hover:bg-accent ${
                    selected.includes(t.id) ? "border-primary" : "border-muted"
                  }`}
                  onClick={() => toggleTrait(t.id)}
                >
                  <div className="font-medium">{t.label}</div>
                  {t.description && (
                    <div className="text-xs text-muted-foreground">{t.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button disabled={!canNext || submitting} onClick={submit}>
              {submitting ? "Saving…" : "Finish"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
