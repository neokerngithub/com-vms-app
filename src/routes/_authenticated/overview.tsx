import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Calculator,
  FileText,
  Landmark,
  Map as MapIcon,
  MapPin,
  Repeat,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useGovRates, useRecords } from "@/hooks/useRecords";
import { formatNPR } from "@/lib/units";

export const Route = createFileRoute("/_authenticated/overview")({
  head: () => ({
    meta: [
      { title: "Overview — VMS Valuation Dashboard" },
      { name: "description", content: "Executive overview of land valuation records, market rates and government gazettes across Nepal." },
      { property: "og:title", content: "Overview — VMS Valuation Dashboard" },
      { property: "og:description", content: "Key valuation metrics, district coverage and recent field records at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const { profile, user, isAdmin } = useAuth();
  const { data: records = [], isLoading } = useRecords();
  const { data: rates = [] } = useGovRates(false);

  const stats = useMemo(() => {
    const now = Date.now();
    const month = 30 * 24 * 3600 * 1000;
    const recent = records.filter((r) => now - new Date(r.created_at).getTime() < month).length;
    const valid = records.filter((r) => r.market_rate > 0);
    const avg = valid.length ? valid.reduce((s, r) => s + Number(r.market_rate), 0) / valid.length : 0;
    const max = valid.reduce((m, r) => Math.max(m, Number(r.market_rate)), 0);
    const contributors = new Set(records.map((r) => r.created_by)).size;
    const verified = new Set(records.filter((r) => r.creator_verified).map((r) => r.created_by)).size;
    const mine = records.filter((r) => r.created_by === user?.id).length;
    const byDistrict = new Map<string, { count: number; sum: number }>();
    for (const r of records) {
      const k = r.district?.trim() || "Unspecified";
      const d = byDistrict.get(k) ?? { count: 0, sum: 0 };
      d.count++;
      d.sum += Number(r.market_rate) || 0;
      byDistrict.set(k, d);
    }
    const districts = [...byDistrict.entries()]
      .map(([name, d]) => ({ name, count: d.count, avg: d.count ? d.sum / d.count : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    const mapped = records.filter((r) => r.latitude != null && r.longitude != null).length;
    return { recent, avg, max, contributors, verified, mine, districts, mapped };
  }, [records, user?.id]);

  const published = rates.filter((r) => r.approval_status === "published").length;
  const topCount = stats.districts[0]?.count || 1;
  const first = (profile?.full_name || "there").split(" ")[0];

  const kpis = [
    { icon: FileText, label: "Active records", value: records.length.toLocaleString(), hint: `+${stats.recent} in last 30 days` },
    { icon: TrendingUp, label: "Average market rate", value: formatNPR(stats.avg), hint: `Highest ${formatNPR(stats.max)}` },
    { icon: Users, label: "Contributors", value: stats.contributors.toLocaleString(), hint: `${stats.verified} NEC / DEAN verified` },
    { icon: Landmark, label: "Government gazettes", value: published.toLocaleString(), hint: "Published rate publications" },
  ];

  const actions = [
    { to: "/map", icon: MapIcon, label: "Open Universal Map" },
    { to: "/records", icon: FileText, label: "Browse Records" },
    { to: "/calculator", icon: Calculator, label: "Valuation Calculator" },
    { to: "/converter", icon: Repeat, label: "Convert Land Units" },
  ] as const;

  return (
    <AppShell title="Overview">
      <div className="space-y-6">
        <section className="surface-card p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Dashboard</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            Welcome back, <span className="gradient-text">{first}</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You have contributed {stats.mine} record{stats.mine === 1 ? "" : "s"} · {stats.mapped} records are pinned on the map.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="surface-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">{k.label}</p>
                <k.icon className="size-5 text-primary" />
              </div>
              <p className="mt-3 truncate text-2xl font-extrabold text-foreground">{isLoading ? "—" : k.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map((a) => (
            <Link key={a.to} to={a.to} className="tap surface-card flex items-center gap-3 p-4 hover:bg-surface-2">
              <span className="gradient-brand grid size-10 place-items-center rounded-xl text-primary-foreground">
                <a.icon className="size-5" />
              </span>
              <span className="text-sm font-bold text-foreground">{a.label}</span>
            </Link>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="surface-card p-5 lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Recent market submissions</h3>
              <Link to="/records" className="text-xs font-semibold text-primary hover:underline">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3 font-semibold">Location</th>
                    <th className="py-2 pr-3 font-semibold">District</th>
                    <th className="py-2 pr-3 text-right font-semibold">Market rate</th>
                    <th className="py-2 font-semibold">Added by</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 8).map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="max-w-[200px] truncate py-2.5 pr-3 font-medium text-foreground">{r.location_in_cadastral_map}</td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{r.district}</td>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-right font-semibold text-foreground">
                        {formatNPR(Number(r.market_rate))}
                        <span className="text-xs font-normal text-muted-foreground"> / {r.unit}</span>
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-muted-foreground">
                        {r.creator_name}
                        {r.creator_verified && <ShieldCheck className="ml-1 inline size-3.5 text-primary" />}
                      </td>
                    </tr>
                  ))}
                  {!isLoading && records.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No records yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="surface-card p-5 lg:col-span-2">
            <h3 className="mb-4 text-base font-bold text-foreground">District coverage</h3>
            <div className="space-y-3">
              {stats.districts.map((d) => (
                <div key={d.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <MapPin className="size-3.5 text-primary" />{d.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{d.count} · avg {formatNPR(d.avg)}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className="gradient-brand h-full rounded-full" style={{ width: `${(d.count / topCount) * 100}%` }} />
                  </div>
                </div>
              ))}
              {!isLoading && stats.districts.length === 0 && (
                <p className="text-sm text-muted-foreground">No district data yet.</p>
              )}
            </div>
            {isAdmin && (
              <Link to="/admin" className="tap mt-6 flex items-center gap-2 rounded-xl border border-border p-3 text-sm font-semibold text-foreground hover:bg-surface-2">
                <ShieldCheck className="size-4 text-primary" /> Open Admin Console
              </Link>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
