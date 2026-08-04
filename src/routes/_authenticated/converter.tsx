import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNIT_GROUPS, breakdown, formatNumber, fromSqFt, toSqFt } from "@/lib/units";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/converter")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Land Unit Converter — VMS" },
      {
        name: "description",
        content:
          "Convert and add Nepalese land units — Bigha, Kattha, Dhur, Ropani, Aana, Paisa, Daam and metric.",
      },
      { property: "og:title", content: "Land Unit Converter — VMS" },
      {
        property: "og:description",
        content: "Terai, Hilly and Metric land unit conversion and arithmetic.",
      },
    ],
  }),
  component: ConverterPage,
});

const ALL_UNITS = UNIT_GROUPS.flatMap((g) => g.units);

function UnitSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn("h-12 rounded-xl border-border bg-surface-2 text-foreground", className)}
      >
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

function ConverterPage() {
  return (
    <AppShell title="Converter">
      <Tabs defaultValue="convert">
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl border border-border bg-surface p-1">
          <TabsTrigger
            value="convert"
            className="tap rounded-xl text-sm font-bold data-[state=active]:gradient-brand data-[state=active]:text-primary-foreground"
          >
            Convert
          </TabsTrigger>
          <TabsTrigger
            value="arithmetic"
            className="tap rounded-xl text-sm font-bold data-[state=active]:gradient-brand data-[state=active]:text-primary-foreground"
          >
            Arithmetic
          </TabsTrigger>
        </TabsList>
        <TabsContent value="convert" className="mt-4">
          <ConvertTab />
        </TabsContent>
        <TabsContent value="arithmetic" className="mt-4">
          <ArithmeticTab />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function ConvertTab() {
  const [value, setValue] = useState("1");
  const [unit, setUnit] = useState("Ropani");
  const sqft = toSqFt(Number(value) || 0, unit);

  return (
    <div className="space-y-4">
      <div className="surface-card grid grid-cols-[minmax(0,1fr)_9.5rem] gap-3 p-4">
        <input
          value={value}
          inputMode="decimal"
          onChange={(e) => setValue(e.target.value)}
          className="h-12 w-full min-w-0 rounded-xl border border-border bg-surface-2 px-4 text-lg font-bold text-foreground outline-none ring-ring focus:ring-2"
        />
        <UnitSelect value={unit} onChange={setUnit} />
      </div>

      {UNIT_GROUPS.map((g) => (
        <div key={g.label} className="surface-card p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {g.label}
          </p>
          <div className="mt-3 space-y-2">
            {g.units.map((u) => (
              <div key={u} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-sm text-muted-foreground">{u}</span>
                <span className="shrink-0 text-sm font-bold text-foreground">
                  {formatNumber(fromSqFt(sqft, u))}
                </span>
              </div>
            ))}
          </div>
          {g.label !== "Metric" && (
            <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              {breakdown(
                sqft,
                g.label === "Terai"
                  ? ["Bigha", "Kattha", "Dhur"]
                  : ["Ropani", "Aana", "Paisa", "Daam"],
              )
                .map((b) => `${formatNumber(b.value, 2)} ${b.unit}`)
                .join(" · ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

interface Row {
  id: number;
  op: "+" | "-";
  value: string;
  unit: string;
}

function ArithmeticTab() {
  const [rows, setRows] = useState<Row[]>([
    { id: 1, op: "+", value: "2", unit: "Kattha" },
    { id: 2, op: "+", value: "10", unit: "Dhur" },
  ]);
  const [outUnit, setOutUnit] = useState("Sq. Ft.");

  const totalSqFt = useMemo(
    () =>
      rows.reduce(
        (sum, r) =>
          sum + (r.op === "+" ? 1 : -1) * toSqFt(Number(r.value) || 0, r.unit),
        0,
      ),
    [rows],
  );

  const update = (id: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="surface-card p-3">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
            <button
              onClick={() => update(r.id, { op: r.op === "+" ? "-" : "+" })}
              aria-label="Toggle add or subtract"
              className={cn(
                "tap grid size-11 shrink-0 place-items-center rounded-xl font-bold",
                r.op === "+"
                  ? "gradient-brand text-primary-foreground"
                  : "border border-border bg-surface-2 text-destructive",
              )}
            >
              {r.op === "+" ? <Plus className="size-5" /> : <Minus className="size-5" />}
            </button>
            <input
              value={r.value}
              inputMode="decimal"
              onChange={(e) => update(r.id, { value: e.target.value })}
              className="h-11 w-full min-w-0 rounded-xl border border-border bg-surface-2 px-3 text-base font-semibold text-foreground outline-none ring-ring focus:ring-2"
            />
            <button
              onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
              aria-label="Remove row"
              className="tap grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-2">
            <UnitSelect value={r.unit} onChange={(v) => update(r.id, { unit: v })} />
          </div>
        </div>
      ))}

      <button
        onClick={() =>
          setRows((rs) => [
            ...rs,
            { id: Date.now(), op: "+", value: "", unit: "Sq. Ft." },
          ])
        }
        className="tap w-full rounded-2xl border border-dashed border-border bg-surface py-3 text-sm font-semibold text-muted-foreground"
      >
        Add another area
      </button>

      <div className="surface-card p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_9.5rem] items-center gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Total
          </p>
          <UnitSelect value={outUnit} onChange={setOutUnit} />
        </div>
        <p className="mt-3 text-3xl font-extrabold">
          <span className="gradient-text">{formatNumber(fromSqFt(totalSqFt, outUnit))}</span>
          <span className="ml-2 text-sm font-semibold text-muted-foreground">{outUnit}</span>
        </p>
        <div className="mt-4 grid gap-1 border-t border-border pt-3 text-xs text-muted-foreground">
          {ALL_UNITS.map((u) => (
            <div key={u} className="flex items-center justify-between gap-3">
              <span className="truncate">{u}</span>
              <span className="shrink-0 font-semibold text-foreground">
                {formatNumber(fromSqFt(totalSqFt, u), 3)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
