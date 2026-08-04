import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — VMS Valuation Management System" },
      {
        name: "description",
        content: "Sign in or create an account to access shared land valuation records.",
      },
      { property: "og:title", content: "Sign in — VMS" },
      { property: "og:description", content: "Access shared land valuation records." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate({ to: "/map", replace: true });
  }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created — check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
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
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Valuation Management System
        </p>

        <form onSubmit={submit} className="surface-card mt-8 space-y-4 p-5">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-muted-foreground">
                Full name
              </Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                maxLength={80}
                className="h-12 rounded-xl border-border bg-surface-2"
                placeholder="Ram Bahadur"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              className="h-12 rounded-xl border-border bg-surface-2"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="tap mt-5 w-full text-center text-sm text-muted-foreground"
        >
          {mode === "signin" ? (
            <>
              New here? <span className="font-semibold text-foreground">Create an account</span>
            </>
          ) : (
            <>
              Already registered?{" "}
              <span className="font-semibold text-foreground">Sign in</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
