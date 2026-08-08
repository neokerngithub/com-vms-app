import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { Layers, LocateFixed, X } from "lucide-react";
import type { RecordWithCreator } from "@/hooks/useRecords";
import { formatNPR } from "@/lib/units";
import { cn } from "@/lib/utils";

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(135deg,#EC4899,#6366F1);box-shadow:0 6px 14px rgba(0,0,0,.5);border:2px solid rgba(255,255,255,.85)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

const meIcon = L.divIcon({
  className: "",
  html: `<div class="vms-locate-dot"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const LAYERS = {
  dark: {
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  },
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics",
  },
} as const;

type LayerKey = keyof typeof LAYERS;

function Recenter({ focus }: { focus: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo(focus, 16, { duration: 0.8 });
  }, [focus, map]);
  return null;
}

function LiveLocation({
  onPosition,
}: {
  onPosition: (p: { coords: [number, number]; accuracy: number } | null) => void;
}) {
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) =>
        onPosition({
          coords: [pos.coords.latitude, pos.coords.longitude],
          accuracy: pos.coords.accuracy,
        }),
      () => onPosition(null),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [onPosition]);
  return null;
}

function AccuracyAura({
  center,
  accuracy,
}: {
  center: [number, number];
  accuracy: number;
}) {
  const map = useMap();
  useEffect(() => {
    const circle = L.circle(center, {
      radius: Math.min(Math.max(accuracy, 8), 400),
      color: "#3B82F6",
      weight: 1,
      fillColor: "#3B82F6",
      fillOpacity: 0.12,
    }).addTo(map);
    return () => {
      circle.remove();
    };
  }, [center, accuracy, map]);
  return null;
}

export default function MapView({
  records,
  focus,
  onViewRecord,
}: {
  records: RecordWithCreator[];
  focus: [number, number] | null;
  onViewRecord?: (record: RecordWithCreator) => void;
}) {
  const [layer, setLayer] = useState<LayerKey>("dark");
  const [me, setMe] = useState<{ coords: [number, number]; accuracy: number } | null>(null);
  const [target, setTarget] = useState<[number, number] | null>(focus);
  const [selected, setSelected] = useState<RecordWithCreator | null>(null);

  useEffect(() => {
    if (focus) setTarget(focus);
  }, [focus]);

  const pinned = useMemo(
    () => records.filter((r) => r.latitude != null && r.longitude != null),
    [records],
  );

  const center: [number, number] = pinned.length
    ? [pinned[0]!.latitude as number, pinned[0]!.longitude as number]
    : [26.448557, 87.28256];

  const active = LAYERS[layer];

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer key={layer} attribution={active.attribution} url={active.url} />
        <Recenter focus={target} />
        <LiveLocation onPosition={setMe} />
        {me && (
          <>
            <AccuracyAura center={me.coords} accuracy={me.accuracy} />
            <Marker position={me.coords} icon={meIcon} />
          </>
        )}
        {pinned.map((r) => (
          <Marker
            key={r.id}
            position={[r.latitude as number, r.longitude as number]}
            icon={pinIcon}
            eventHandlers={{ click: () => setSelected(r) }}
          />
        ))}
      </MapContainer>

      {/* Layer switcher */}
      <div className="absolute right-3 top-3 z-[500] flex flex-col gap-1 rounded-2xl border border-border bg-background p-1">
        {(Object.keys(LAYERS) as LayerKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setLayer(k)}
            className={cn(
              "tap flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold",
              layer === k
                ? "gradient-brand text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            <Layers className="size-3.5" />
            {LAYERS[k].label}
          </button>
        ))}
      </div>

      {/* GPS target */}
      <button
        aria-label="Center on my location"
        onClick={() => {
          if (me) {
            setTarget([me.coords[0] + Math.random() * 1e-9, me.coords[1]]);
          } else if (typeof navigator !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) =>
              setTarget([pos.coords.latitude, pos.coords.longitude]),
            );
          }
        }}
        className="tap absolute bottom-4 right-3 z-[500] grid size-12 place-items-center rounded-full border border-border bg-background text-primary shadow-[var(--shadow-elegant)]"
      >
        <LocateFixed className="size-5" />
      </button>

      {/* Pin bottom sheet */}
      {selected && (
        <div className="absolute inset-0 z-[600] flex items-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-background/70" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="surface-card animate-in slide-in-from-bottom relative m-2 w-full rounded-3xl p-4 duration-200"
          >
            <button
              aria-label="Close"
              onClick={() => setSelected(null)}
              className="tap absolute right-3 top-3 grid size-8 place-items-center rounded-lg border border-border bg-surface-2 text-muted-foreground"
            >
              <X className="size-4" />
            </button>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
              <div className="size-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface-2">
                {selected.image_url ? (
                  <img
                    src={selected.image_url}
                    alt={selected.location_in_cadastral_map || "Property"}
                    className="size-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-[10px] text-muted-foreground">
                    No photo
                  </div>
                )}
              </div>
              <div className="min-w-0 pr-8">
                <p className="truncate text-sm font-bold text-foreground">
                  {selected.location_in_cadastral_map || "Untitled plot"}
                </p>
                <p className="truncate text-xs text-muted-foreground">{selected.district}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selected.type_of_road && (
                    <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                      {selected.type_of_road}
                    </span>
                  )}
                  {selected.locality && (
                    <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                      {selected.locality}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold">
              <span className="gradient-text">{formatNPR(selected.market_rate)}</span>
              <span className="ml-2 text-xs font-semibold text-muted-foreground">
                per {selected.unit}
              </span>
            </p>
            <button
              onClick={() => onViewRecord?.(selected)}
              className="tap gradient-brand mt-4 w-full rounded-2xl py-3.5 text-sm font-bold text-primary-foreground"
            >
              View Full Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
