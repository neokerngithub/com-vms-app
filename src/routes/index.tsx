import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MapPin, Calculator, Repeat, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VMS — Land Valuation Management for Nepal" },
      {
        name: "description",
        content:
          "Collect field valuation records, map market rates, convert Nepalese land units and compute fair market and distress values.",
      },
      { property: "og:title", content: "VMS — Land Valuation Management for Nepal" },
      {
        property: "og:description",
        content:
          "Universal map and records of land market rates, unit converter and advanced valuation calculator.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/map", replace: true });
  }, [loading, session, navigate]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <div className="safe-top mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-12">
        <div className="gradient-brand grid size-14 place-items-center rounded-2xl text-xl font-black text-primary-foreground shadow-[var(--shadow-glow)]">
          V
        </div>
        <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
          Valuation <span className="gradient-text">Management</span> System
        </h1>
        <p className="mt-4 max-w-md text-base text-muted-foreground">
          One shared source of truth for land market rates — field records, a universal
          map, Nepalese unit arithmetic and fair market valuation.
        </p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {[
            { icon: MapPin, t: "Universal Map", d: "Every record as a live pin" },
            { icon: Repeat, t: "Converter", d: "Terai, Hilly and Metric units" },
            { icon: Calculator, t: "Valuation", d: "Fair market & distress value" },
            { icon: ShieldCheck, t: "Governed", d: "Owner edits, admin deletes" },
          ].map((f) => (
            <div key={f.t} className="surface-card tap p-4">
              <f.icon className="size-5 text-primary" />
              <p className="mt-3 text-sm font-bold text-foreground">{f.t}</p>
              <p className="text-xs text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>

        <Link
          to="/auth"
          className="tap gradient-brand mt-10 inline-flex items-center justify-center rounded-2xl px-6 py-4 text-base font-bold text-primary-foreground shadow-[var(--shadow-glow)]"
        >
          Sign in to continue
        </Link>
      </div>
    </div>
  );
}
