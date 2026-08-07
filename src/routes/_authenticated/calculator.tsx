import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNIT_GROUPS, computeValuation, formatNPR, formatNumber } from "@/lib/units";

export const Route = createFileRoute("/_authenticated/calculator")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Advanced Valuation Calculator — VMS" },
      {
        name: "description",
        content:
          "Compute commercial, government, fair market and distress value from area, rates and weighting.",
      },
      { property: "og:title", content: "Advanced Valuation Calculator — VMS" },
      {
        property: "og:description",
        content: "Fair market and distress value in real-time NPR.",
      },
    ],
  }),
  component: CalculatorPage,
});

function UnitSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-12 rounded-xl border-border bg-surface-2 text-foreground">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-border bg-popover">
        {UNIT_GROUPS.map((g) => (
          <SelectGroup key={g.label}>
            <SelectLabel className="text-muted-foreground">{g.label}</SelectLabel>
            {g.units.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground">{label}</Label>
      <input
        value={value}
        inputMode="decimal"
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full min-w-0 rounded-xl border border-border bg-surface-2 px-4 text-base font-semibold text-foreground outline-none ring-ring focus:ring-2"
      />
    </div>
  );
}

function CalculatorPage() {
  const [area, setArea] = useState("");
  const [areaUnit, setAreaUnit] = useState("Kattha");
  const [govRate, setGovRate] = useState("");
  const [govRateUnit, setGovRateUnit] = useState("Kattha");
  const [marketRate, setMarketRate] = useState("");
  const [marketRateUnit, setMarketRateUnit] = useState("Kattha");
  const [govShare, setGovShare] = useState(50);
  const [distress, setDistress] = useState(85);

  const result = useMemo(
    () =>
      computeValuation({
        area: Number(area) || (area === "" ? 1 : 0),
        areaUnit,
        govRate: Number(govRate) || (govRate === "" ? 500000 : 0),
        govRateUnit,
        marketRate: Number(marketRate) || (marketRate === "" ? 900000 : 0),
        marketRateUnit,
        govSharePct: govShare,
        marketSharePct: 100 - govShare,
        distressPct: distress,
      }),
    [area, areaUnit, govRate, govRateUnit, marketRate, marketRateUnit, govShare, distress],
  );

  const touched = area !== "" || govRate !== "" || marketRate !== "";

  const reset = () => {
    setArea("");
    setAreaUnit("Kattha");
    setGovRate("");
    setGovRateUnit("Kattha");
    setMarketRate("");
    setMarketRateUnit("Kattha");
    setGovShare(50);
    setDistress(85);
  };

  return (
    <AppShell title="Advanced Calculator" back>
      <div className="space-y-4 pb-8">
        <section className="surface-card space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Property area
            </p>
            <button
              onClick={reset}
              aria-label="Reset form"
              className="tap grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-muted-foreground"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_9.5rem] gap-3">
            <NumberField label="Area" value={area} onChange={setArea} placeholder="1" />
            <div className="space-y-2">
              <Label className="text-muted-foreground">Unit</Label>
              <UnitSelect value={areaUnit} onChange={setAreaUnit} />
            </div>
          </div>
          <p className={touched ? "text-xs text-muted-foreground" : "text-xs text-muted-foreground opacity-40"}>
            = {formatNumber(result.areaSqFt)} Sq. Ft.
          </p>
        </section>


        <section className="surface-card space-y-4 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Rates
          </p>
          <div className="grid grid-cols-[minmax(0,1fr)_9.5rem] gap-3">
            <NumberField
              label="Government rate (Rs.)"
              value={govRate}
              onChange={setGovRate}
              placeholder="500000"
            />
            <div className="space-y-2">
              <Label className="text-muted-foreground">Per</Label>
              <UnitSelect value={govRateUnit} onChange={setGovRateUnit} />
            </div>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_9.5rem] gap-3">
            <NumberField
              label="Market rate (Rs.)"
              value={marketRate}
              onChange={setMarketRate}
              placeholder="900000"
            />
            <div className="space-y-2">
              <Label className="text-muted-foreground">Per</Label>
              <UnitSelect value={marketRateUnit} onChange={setMarketRateUnit} />
            </div>
          </div>
          <div
            className={
              "grid gap-1 border-t border-border pt-3 text-xs text-muted-foreground" +
              (touched ? "" : " opacity-40")
            }
          >
            <div className="flex justify-between gap-3">
              <span>Gov. rate / Sq. Ft.</span>
              <span className="font-semibold text-foreground">
                {formatNPR(result.govRatePerSqFt)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Market rate / Sq. Ft.</span>
              <span className="font-semibold text-foreground">
                {formatNPR(result.marketRatePerSqFt)}
              </span>
            </div>
          </div>
        </section>

        <section className="surface-card space-y-5 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Weighting
          </p>
          <div>
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-muted-foreground">Gov. share</span>
              <span className="text-foreground">{govShare}%</span>
            </div>
            <Slider
              value={[govShare]}
              onValueChange={([v]) => setGovShare(v ?? 0)}
              min={0}
              max={100}
              step={5}
              className="mt-3"
            />
            <div className="mt-2 flex items-center justify-between text-sm font-semibold">
              <span className="text-muted-foreground">Market share</span>
              <span className="text-foreground">{100 - govShare}%</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-muted-foreground">Distress</span>
              <span className="text-foreground">{distress}%</span>
            </div>
            <Slider
              value={[distress]}
              onValueChange={([v]) => setDistress(v ?? 0)}
              min={0}
              max={100}
              step={1}
              className="mt-3"
            />
          </div>
        </section>

        <section className={"surface-card overflow-hidden p-0" + (touched ? "" : " opacity-40")}>
          <div className="gradient-brand px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/80">
              Fair market value
            </p>
            <p className="mt-1 text-3xl font-extrabold text-primary-foreground">
              {formatNPR(result.fairMarketValue)}
            </p>
          </div>
          <div className="divide-y divide-border">
            <Row label="Commercial value" value={formatNPR(result.commercialValue)} />
            <Row label="Government value" value={formatNPR(result.governmentValue)} />
            <Row
              label={`Distress value (${distress}%)`}
              value={formatNPR(result.distressValue)}
              highlight
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4">
      <span className="truncate text-sm text-muted-foreground">{label}</span>
      <span
        className={`shrink-0 text-base font-bold ${highlight ? "gradient-text" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}
