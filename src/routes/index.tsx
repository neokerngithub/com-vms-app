import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MapPin, Calculator, Repeat, ShieldCheck, ArrowRight } from "lucide-react";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
    if (!loading && session) navigate({ to: "/overview", replace: true });
  }, [loading, session, navigate]);

  const modules = [
    { icon: MapPin, code: "M-01", t: "Universal Map", d: "Every valuation record as a live, verified pin." },
    { icon: Repeat, code: "M-02", t: "Unit Converter", d: "Terai, Hilly and metric arithmetic to 4 decimals." },
    { icon: Calculator, code: "M-03", t: "Valuation Calculator", d: "Fair market and distress value in rupees." },
    { icon: ShieldCheck, code: "M-04", t: "Governed Records", d: "NEC / DEAN verification, audit logs, moderation." },
  ];
  const units = [
    ["1 Ropani", "16 Aana", "5,476.0000 sq ft"],
    ["1 Aana", "4 Paisa", "342.2500 sq ft"],
    ["1 Bigha", "20 Kattha", "72,900.0000 sq ft"],
    ["1 Kattha", "20 Dhur", "3,645.0000 sq ft"],
  ];

  return (
    <div className="survey-grid flex min-h-[100dvh] flex-col">
      <header className="safe-top border-b border-border bg-background">
        <div className="mx-auto flex h-12 w-full max-w-6xl items-center gap-3 px-5">
          <img src="/branding/vms-emblem-white.png" alt="VMS emblem" className="logo-adaptive h-5 w-auto" />
          <span className="font-mono text-[12px] font-semibold tracking-[0.18em] text-foreground">VMS</span>
          <span className="hidden font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground sm:inline">/ Valuation Management System</span>
          <Link to="/auth" className="tap ml-auto inline-flex items-center rounded-sm border border-border px-3 font-mono text-[11px] uppercase tracking-[0.1em] text-foreground hover:border-primary">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 py-12 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <section className="page-transition">
          <p className="mono-label flex items-center gap-2"><span className="size-1.5 bg-primary" /> Nepal · Land valuation toolkit</p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.08] text-foreground sm:text-5xl lg:text-[56px]">
            Survey-grade valuation,<br />
            <span className="text-brand-indigo-soft">one shared record.</span>
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            Field records, a universal rate map, Nepalese unit arithmetic and fair market valuation — built
            for registered NEC and DEAN valuators.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/auth" className="tap gradient-brand inline-flex items-center gap-2 rounded-sm px-5 py-3 font-mono text-[12px] font-semibold uppercase tracking-[0.12em]">
              Open workstation <ArrowRight className="size-4" />
            </Link>
            <span className="font-mono text-[11px] text-muted-foreground">27.7172° N · 85.3240° E</span>
          </div>

          <div className="mt-12 grid grid-cols-1 border-l border-t border-border sm:grid-cols-2">
            {modules.map((f) => (
              <div key={f.t} className="border-b border-r border-border bg-background p-4 transition-colors hover:bg-surface">
                <div className="flex items-center justify-between">
                  <f.icon className="size-4 text-brand-indigo-soft" strokeWidth={1.75} />
                  <span className="font-mono text-[10px] text-muted-foreground/70">{f.code}</span>
                </div>
                <p className="mt-3 text-[13px] font-semibold text-foreground">{f.t}</p>
                <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="page-transition border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="mono-label">Sheet 01 · Unit reference</p>
            <span className="font-mono text-[10px] text-muted-foreground">SCALE 1:1</span>
          </div>
          <table className="w-full font-mono text-[12px]">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Unit</th>
                <th className="px-4 py-2 font-medium">Equals</th>
                <th className="px-4 py-2 text-right font-medium">Area</th>
              </tr>
            </thead>
            <tbody>
              {units.map((r) => (
                <tr key={r[0]} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-4 py-2.5 text-foreground">{r[0]}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r[1]}</td>
                  <td className="px-4 py-2.5 text-right text-foreground">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid-cols-3 border-t border-border">
            {[["FMV", "Rs. 0.00"], ["Area", "0.0000"], ["Role", "Guest"]].map(([k, v]) => (
              <div key={k} className="border-r border-border px-4 py-3 last:border-0">
                <p className="mono-label">{k}</p>
                <p className="mt-1 font-mono text-[13px] text-foreground">{v}</p>
              </div>
            ))}
          </div>
        </aside>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex h-10 w-full max-w-6xl items-center justify-between px-5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
          <span>Valuation Management System</span>
          <span className="hidden sm:inline">Datum WGS 84</span>
        </div>
      </footer>
    </div>
  );
}
