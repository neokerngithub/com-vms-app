import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.8l7.8 6.1C12.3 13.7 17.6 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.1a14.6 14.6 0 0 1 0-8.2l-7.8-6.1a24 24 0 0 0 0 20.4l7.8-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 47.5c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2.1 1.4-4.8 2.3-7.7 2.3-6.4 0-11.7-4.2-13.6-10l-7.8 6.1C6.5 42.1 14.6 47.5 24 47.5z"
      />
    </svg>
  );
}

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate({ to: "/map", replace: true });
    }
  }, [session, navigate]);

  const google = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/map`,
      });
      if (result.error) throw result.error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Reset link sent — check your inbox.");
        setMode("signin");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/map`,
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
          {mode === "signin"
            ? "Welcome back"
            : mode === "signup"
              ? "Create your account"
              : "Reset your password"}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {mode === "forgot"
            ? "We'll email you a secure reset link"
            : "Valuation Management System"}
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
          {mode !== "forgot" && (
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
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="tap text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </button>
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="tap gradient-brand w-full rounded-xl py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
          </button>

          {mode !== "forgot" && (
            <>
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  or
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <button
                type="button"
                onClick={google}
                disabled={busy}
                className="tap flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface-2 py-3.5 text-sm font-bold text-foreground disabled:opacity-60"
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </>
          )}
        </form>

        {mode === "forgot" ? (
          <button
            onClick={() => setMode("signin")}
            className="tap mt-5 flex w-full items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to sign in
          </button>
        ) : (
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="tap mt-5 w-full text-center text-sm text-muted-foreground"
          >
            {mode === "signin" ? (
              <>
                New here?{" "}
                <span className="font-semibold text-foreground">Create an account</span>
              </>
            ) : (
              <>
                Already registered?{" "}
                <span className="font-semibold text-foreground">Sign in</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
