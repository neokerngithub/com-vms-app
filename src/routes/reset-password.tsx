import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — VMS" },
      {
        name: "description",
        content: "Choose a new password for your VMS valuation account.",
      },
      { property: "og:title", content: "Set a new password — VMS" },
      { property: "og:description", content: "Choose a new VMS account password." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated.");
      navigate({ to: "/map", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="gradient-brand mx-auto grid size-14 place-items-center rounded-2xl text-xl font-black text-primary-foreground shadow-[var(--shadow-glow)]">
          V
        </div>
        <h1 className="mt-6 text-center text-2xl font-extrabold text-foreground">
          Set a new password
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Choose a strong password you'll remember
        </p>

        <form onSubmit={submit} className="surface-card mt-8 space-y-4 p-5">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-muted-foreground">
              New password
            </Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-12 rounded-xl border-border bg-surface-2"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-muted-foreground">
              Confirm password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="h-12 rounded-xl border-border bg-surface-2"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="tap gradient-brand w-full rounded-xl py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
