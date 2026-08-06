import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  UNIT_ORDER,
  UNIT_GROUPS,
  formatNumber,
  parseCombined,
  formatCombined,
  toSqFt,
  fromSqFt,
} from "@/lib/units";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/converter")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Land Unit Converter — VMS" },
      {
        name: "description",
        content:
          "Convert and add Nepalese land units — Bigha, Kattha, Dhur, Kanwa, Ropani, Aana, Paisa, Dam and metric.",
      },
      { property: "og:title", content: "Land Unit Converter — VMS" },
      {
        property: "og:description",
        content: "Terai and Hilly land unit conversion and arithmetic.",
      },
    ],
  }),
  component: ConverterPage,
});

const MODES = ["Convert", "Combined", "Arithmetic"] as const;
type Mode = (typeof MODES)[number];

const TERAI = ["Bigha", "Kattha", "Dhur", "Kanwa"];
const HILLY = ["Ropani", "Aana", "Paisa", "Dam"];

const COMBINED_UNITS = ["B-K-D-K", "R-A-P-D"];

function ConverterPage() {
  const [mode, setMode] = useState<Mode>("Convert");

  return (
    <AppShell title="Converter">
      <div className="flex rounded-2xl border border-border bg-surface p-1">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "tap flex-1 rounded-xl py-2.5 text-xs font-bold transition-colors",
              mode === m ? "gradient-brand text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="mt-4 pb-8">
        {mode === "Convert" && <ConvertMode />}
        {mode === "Combined" && <CombinedMode />}
        {mode === "Arithmetic" && <ArithmeticMode />}
      </div>
    </AppShell>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Reset form"
      className="tap grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-muted-foreground"
    >
      <RotateCcw className="size-4" />
    </button>
  );
}

/* ------------------------------- Convert -------------------------------- */

const EXAMPLE_VALUE = "5";
const DEFAULT_UNIT = "Kattha";

function ConvertMode() {
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<string>(DEFAULT_UNIT);

  const touched = value.trim() !== "";
  const numeric = Number(touched ? value : EXAMPLE_VALUE);
  const sqft = Number.isFinite(numeric) ? toSqFt(numeric, unit) : 0;

  const reset = () => {
    setValue("");
    setUnit(DEFAULT_UNIT);
  };

  return (
    <div className="space-y-3">
      <div className="surface-card space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Area
          </p>
          <ResetButton onClick={reset} />
        </div>
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={EXAMPLE_VALUE}
          maxLength={16}
          className="h-14 w-full rounded-xl border border-border bg-surface-2 px-4 text-2xl font-extrabold text-foreground outline-none ring-ring placeholder:text-muted-foreground placeholder:opacity-40 focus:ring-2"
        />
        <UnitSelect label="Unit" value={unit} onChange={setUnit} />
      </div>

      <div
        className={cn(
          "surface-card p-5 transition-opacity",
          touched ? "opacity-100" : "opacity-40",
        )}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Total area
        </p>
        <p className="mt-2 text-3xl font-extrabold">
          <span className="gradient-text">{formatNumber(sqft)}</span>
          <span className="ml-2 text-sm font-semibold text-muted-foreground">Sq. Ft.</span>
        </p>
        {!touched && (
          <p className="mt-2 text-xs text-muted-foreground">
            Example shown — type an area for live values.
          </p>
        )}
      </div>

      <BreakdownCards sqft={sqft} faded={!touched} />
    </div>
  );
}

function UnitSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm font-semibold text-foreground outline-none ring-ring focus:ring-2"
      >
        {UNIT_ORDER.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------- Combined ------------------------------- */

const COMBINED_EXAMPLES: Record<"Terai" | "Hilly", string> = {
  Terai: "1-5-10-2",
  Hilly: "2-4-1-0",
};

function CombinedMode() {
  const [system, setSystem] = useState<"Terai" | "Hilly">("Terai");
  const [input, setInput] = useState("");

  const touched = input.trim() !== "";
  const units = system === "Terai" ? TERAI : HILLY;
  const sqft = parseCombined(touched ? input : COMBINED_EXAMPLES[system], units);

  return (
    <div className="space-y-3">
      <div className="surface-card space-y-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 rounded-xl border border-border bg-surface-2 p-1">
            {(["Terai", "Hilly"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSystem(s)}
                className={cn(
                  "tap flex-1 rounded-lg py-2 text-xs font-bold",
                  system === s ? "gradient-brand text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <ResetButton
            onClick={() => {
              setInput("");
              setSystem("Terai");
            }}
          />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {system === "Terai" ? "Bigha-Kattha-Dhur-Kanwa" : "Ropani-Aana-Paisa-Dam"}
        </p>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={COMBINED_EXAMPLES[system]}
          maxLength={32}
          className="h-14 w-full rounded-xl border border-border bg-surface-2 px-4 text-2xl font-extrabold tracking-wider text-foreground outline-none ring-ring placeholder:text-muted-foreground placeholder:opacity-40 focus:ring-2"
        />
        {!touched && (
          <p className="text-xs text-muted-foreground opacity-70">
            Example shown — enter a reading like {COMBINED_EXAMPLES[system]}.
          </p>
        )}
      </div>

      <BreakdownCards sqft={sqft} faded={!touched} />
    </div>
  );
}

function BreakdownCards({ sqft, faded }: { sqft: number; faded: boolean }) {
  return (
    <div className={cn("space-y-3 transition-opacity", faded ? "opacity-40" : "opacity-100")}>
      {UNIT_GROUPS.map((g) => (
        <div key={g.label} className="surface-card p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {g.label}
          </p>
          {g.label !== "Metric" && (
            <p className="mt-2 text-xl font-extrabold text-foreground">
              {formatCombined(sqft, g.units)}
            </p>
          )}
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
            {g.units.map((u) => (
              <div key={u} className="flex items-baseline justify-between gap-2">
                <span className="truncate text-xs text-muted-foreground">{u}</span>
                <span className="text-sm font-bold text-foreground">
                  {formatNumber(fromSqFt(sqft, u))}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Arithmetic ------------------------------ */

interface Row {
  id: string;
  op: "+" | "-";
  value: string;
  unit: string;
}

const ROW_EXAMPLES: Record<string, string> = {
  "B-K-D-K": "1-5-10-2",
  "R-A-P-D": "2-4-1-0",
};

function newRow(op: "+" | "-" = "+"): Row {
  return {
    id: Math.random().toString(36).slice(2),
    op,
    value: "",
    unit: "Kattha",
  };
}

function rowSqft(row: Row, useExample: boolean): number {
  const raw = row.value.trim() || (useExample ? exampleFor(row.unit) : "");
  if (!raw) return 0;
  if (row.unit === "B-K-D-K") return parseCombined(raw, TERAI);
  if (row.unit === "R-A-P-D") return parseCombined(raw, HILLY);
  const n = Number(raw);
  return Number.isFinite(n) ? toSqFt(n, row.unit) : 0;
}

function exampleFor(unit: string): string {
  return ROW_EXAMPLES[unit] ?? "5";
}

function ArithmeticMode() {
  const [rows, setRows] = useState<Row[]>([newRow("+"), newRow("-")]);

  const touched = rows.some((r) => r.value.trim() !== "");

  const total = useMemo(
    () =>
      rows.reduce(
        (sum, r) => sum + (r.op === "+" ? 1 : -1) * rowSqft(r, !touched),
        0,
      ),
    [rows, touched],
  );

  const update = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-3">
      <div className="surface-card flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">Land Arithmetic</p>
          <p className="text-xs text-muted-foreground">
            Add or subtract parcels across single and combined units.
          </p>
        </div>
        <ResetButton onClick={() => setRows([newRow("+"), newRow("-")])} />
      </div>

      {rows.map((row, i) => (
        <div key={row.id} className="surface-card space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex rounded-xl border border-border bg-surface-2 p-1">
              {(["+", "-"] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => update(row.id, { op })}
                  disabled={i === 0}
                  aria-label={op === "+" ? "Add parcel" : "Subtract parcel"}
                  className={cn(
                    "tap grid size-11 place-items-center rounded-lg text-sm font-bold disabled:opacity-60",
                    row.op === op
                      ? "gradient-brand text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {op === "+" ? <Plus className="size-4" /> : <Minus className="size-4" />}
                </button>
              ))}
            </div>
            {rows.length > 1 && (
              <button
                onClick={() => setRows((rs) => rs.filter((r) => r.id !== row.id))}
                aria-label="Remove row"
                className="tap grid size-11 place-items-center rounded-xl border border-border bg-surface-2 text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <input
              inputMode={row.unit.includes("-") ? "text" : "decimal"}
              value={row.value}
              onChange={(e) => update(row.id, { value: e.target.value })}
              placeholder={exampleFor(row.unit)}
              maxLength={32}
              className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-base font-bold text-foreground outline-none ring-ring placeholder:text-muted-foreground placeholder:opacity-40 focus:ring-2"
            />
            <select
              value={row.unit}
              onChange={(e) => update(row.id, { unit: e.target.value })}
              className="h-12 shrink-0 rounded-xl border border-border bg-surface-2 px-3 text-xs font-bold text-foreground outline-none ring-ring focus:ring-2"
            >
              <optgroup label="Single unit">
                {UNIT_ORDER.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Combined">
                {COMBINED_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div
            className={cn(
              "flex items-baseline justify-between gap-2 border-t border-border pt-2 transition-opacity",
              row.value.trim() ? "opacity-100" : "opacity-40",
            )}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Sub-total
            </span>
            <span className="text-sm font-bold text-foreground">
              {row.op === "-" ? "−" : ""}
              {formatNumber(rowSqft(row, !touched))} Sq. Ft.
            </span>
          </div>
        </div>
      ))}

      <button
        onClick={() => setRows((rs) => [...rs, newRow("+")])}
        className="tap flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3.5 text-sm font-bold text-foreground"
      >
        <Plus className="size-4" />
        Add land parcel
      </button>

      <div
        className={cn(
          "surface-card p-5 transition-opacity",
          touched ? "opacity-100" : "opacity-40",
        )}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Total
        </p>
        <p className="mt-2 text-3xl font-extrabold">
          <span className="gradient-text">{formatNumber(total)}</span>
          <span className="ml-2 text-sm font-semibold text-muted-foreground">Sq. Ft.</span>
        </p>
        {!touched && (
          <p className="mt-2 text-xs text-muted-foreground">
            Example values shown — enter a parcel for live totals.
          </p>
        )}
      </div>

      <BreakdownCards sqft={total} faded={!touched} />
    </div>
  );
}
