import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layers, LocateFixed, Search, X, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import type { RecordWithCreator } from "@/hooks/useRecords";
import { formatNPR } from "@/lib/units";
import { cn } from "@/lib/utils";
import { usePhotoUrl } from "@/lib/photos";

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(135deg,#C8102E,#002B7F);box-shadow:0 6px 14px rgba(0,0,0,.5);border:2px solid rgba(255,255,255,.85)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

const tempIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50%;background:#0EA5E9;border:3px solid #fff;box-shadow:0 6px 14px rgba(0,0,0,.5)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const meIcon = L.divIcon({
  className: "",
  html: `<div class="vms-locate-dot"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const LAYERS = {
  satellite: {
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics",
  },
  standard: {
    label: "Standard Light",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  },
} as const;

type LayerKey = keyof typeof LAYERS;

type Suggestion = { label: string; lat: number; lng: number };

function parseCoords(input: string): Suggestion | null {
  const cleaned = input
    .trim()
    .replace(/[NnEe]\b/g, "")
    .replace(/[°]/g, "");
  const m = cleaned.match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { label: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng };
}

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
    let warned = false;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        warned = false;
        onPosition({
          coords: [pos.coords.latitude, pos.coords.longitude],
          accuracy: pos.coords.accuracy,
        });
      },
      () => {
        if (!warned) {
          warned = true;
          toast("Weak GPS signal. Using last known location.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [onPosition]);
  return null;
}

function AccuracyAura({ center, accuracy }: { center: [number, number]; accuracy: number }) {
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

function LongPress({ onLongPress }: { onLongPress: (p: [number, number]) => void }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useMapEvents({
    mousedown(e) {
      clear();
      timer.current = setTimeout(() => onLongPress([e.latlng.lat, e.latlng.lng]), 650);
    },
    mouseup: clear,
    mouseout: clear,
    dragstart: clear,
    movestart: clear,
    zoomstart: clear,
    contextmenu(e) {
      clear();
      onLongPress([e.latlng.lat, e.latlng.lng]);
    },
  });
  useEffect(() => clear, []);
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 0);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function MapView({
  records,
  focus,
  onViewRecord,
  onDropPin,
}: {
  records: RecordWithCreator[];
  focus: [number, number] | null;
  onViewRecord?: (record: RecordWithCreator) => void;
  onDropPin?: (coords: [number, number], clear: () => void) => void;
}) {
  const [layer, setLayer] = useState<LayerKey>("satellite");
  const [layerOpen, setLayerOpen] = useState(false);
  const [me, setMe] = useState<{ coords: [number, number]; accuracy: number } | null>(null);
  const [target, setTarget] = useState<[number, number] | null>(focus);
  const [temp, setTemp] = useState<[number, number] | null>(null);
  const [selected, setSelected] = useState<RecordWithCreator | null>(null);
  const selectedPhoto = usePhotoUrl(selected?.image_url ?? null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [openList, setOpenList] = useState(false);

  useEffect(() => {
    if (focus) setTarget(focus);
  }, [focus]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    const direct = parseCoords(q);
    if (direct) {
      setResults([direct]);
      return;
    }
    const ctrl = new AbortController();
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=np&limit=6&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { signal: ctrl.signal });
        const json = (await res.json()) as Array<{
          display_name: string;
          lat: string;
          lon: string;
        }>;
        setResults(
          json.map((r) => ({
            label: r.display_name,
            lat: Number(r.lat),
            lng: Number(r.lon),
          })),
        );
      } catch {
        /* aborted or offline */
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      ctrl.abort();
      clearTimeout(t);
      setSearching(false);
    };
  }, [query]);

  const pinned = useMemo(
    () => records.filter((r) => r.latitude != null && r.longitude != null),
    [records],
  );

  const center: [number, number] = pinned.length
    ? [pinned[0]!.latitude as number, pinned[0]!.longitude as number]
    : [26.448557, 87.28256];

  const active = LAYERS[layer];

  const pick = (s: Suggestion) => {
    setQuery(s.label);
    setOpenList(false);
    setTemp([s.lat, s.lng]);
    setTarget([s.lat, s.lng]);
  };

  const longPress = useCallback(
    (coords: [number, number]) => {
      setTemp(coords);
      onDropPin?.(coords, () => setTemp(null));
    },
    [onDropPin],
  );

  return (
    <div className="relative h-full w-full">
      <div className="relative z-0 h-full w-full">
        <MapContainer
          center={center}
          zoom={11}
          minZoom={3}
          maxBounds={[[-90, -180], [90, 180]]}
          maxBoundsViscosity={1}
          scrollWheelZoom
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer key={layer} attribution={active.attribution} url={active.url} />
          <MapResizer />
          <Recenter focus={target} />
          <LiveLocation onPosition={setMe} />
          <LongPress onLongPress={longPress} />
          {me && (
            <>
              <AccuracyAura center={me.coords} accuracy={me.accuracy} />
              <Marker position={me.coords} icon={meIcon} />
            </>
          )}
          {temp && <Marker position={temp} icon={tempIcon} />}
          {pinned.map((r) => (
            <Marker
              key={r.id}
              position={[r.latitude as number, r.longitude as number]}
              icon={pinIcon}
              eventHandlers={{ click: () => setSelected(r) }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Floating search bar */}
      <div className="pointer-events-none absolute inset-x-0 top-3 z-[500] flex justify-center px-3">
        <div className="pointer-events-auto w-full max-w-md">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 shadow-[var(--shadow-elegant)]">
            {searching ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <Search className="size-4 shrink-0 text-muted-foreground" />
            )}
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpenList(true);
              }}
              onFocus={() => setOpenList(true)}
              placeholder="Search place or 26.4525, 87.2718"
              aria-label="Search the map"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setTemp(null);
                }}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          {openList && results.length > 0 && (
            <ul className="mt-2 max-h-64 overflow-y-auto rounded-2xl border border-border bg-background p-1 shadow-[var(--shadow-elegant)]">
              {results.map((r) => (
                <li key={`${r.lat}-${r.lng}-${r.label}`}>
                  <button
                    onClick={() => pick(r)}
                    className="tap flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-foreground hover:bg-surface-2"
                  >
                    <MapPin className="size-4 shrink-0 text-primary" />
                    <span className="line-clamp-2">{r.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Layer switcher */}
      <div className="absolute right-3 top-20 z-[500] flex flex-col items-end gap-1">
        <button
          aria-label="Map layers"
          onClick={() => setLayerOpen((v) => !v)}
          className="tap grid size-12 place-items-center rounded-2xl border border-border bg-background text-foreground shadow-[var(--shadow-elegant)]"
        >
          <Layers className="size-5" />
        </button>
        {layerOpen && (
          <div className="flex flex-col gap-1 rounded-2xl border border-border bg-background p-1 shadow-[var(--shadow-elegant)]">
            {(Object.keys(LAYERS) as LayerKey[]).map((k) => (
              <button
                key={k}
                onClick={() => {
                  setLayer(k);
                  setLayerOpen(false);
                }}
                className={cn(
                  "tap flex items-center rounded-xl px-3 py-2 text-[11px] font-bold",
                  layer === k ? "gradient-brand text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {LAYERS[k].label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* GPS target */}
      <button
        aria-label="Center on my location"
        className="tap absolute bottom-4 right-3 z-[500] grid size-12 place-items-center rounded-full border border-border bg-background text-primary shadow-[var(--shadow-elegant)]"
        onClick={() => {
          if (me) {
            setTarget([me.coords[0] + Math.random() * 1e-9, me.coords[1]]);
          } else if (typeof navigator !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => setTarget([pos.coords.latitude, pos.coords.longitude]),
              () => toast("Weak GPS signal. Using last known location."),
              { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
            );
          }
        }}
        className="tap absolute bottom-4 right-3 z-[55] grid size-12 place-items-center rounded-full border border-border bg-background text-primary shadow-[var(--shadow-elegant)]"
      >
        <LocateFixed className="size-5" />
      </button>

      {/* Pin bottom sheet */}
      {selected && (
        <div className="absolute inset-0 z-[600] flex items-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60" />
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
                {selectedPhoto ? (
                  <img
                    src={selectedPhoto}
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
