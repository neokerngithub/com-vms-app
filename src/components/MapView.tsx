import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { RecordWithCreator } from "@/hooks/useRecords";
import { formatNPR } from "@/lib/units";

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(135deg,#EC4899,#6366F1);box-shadow:0 6px 14px rgba(0,0,0,.5);border:2px solid rgba(255,255,255,.85)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -24],
});

function Recenter({ focus }: { focus: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo(focus, 15, { duration: 0.8 });
  }, [focus, map]);
  return null;
}

export default function MapView({
  records,
  focus,
}: {
  records: RecordWithCreator[];
  focus: [number, number] | null;
}) {
  const pinned = records.filter((r) => r.latitude != null && r.longitude != null);
  const center: [number, number] = pinned.length
    ? [pinned[0]!.latitude as number, pinned[0]!.longitude as number]
    : [26.448557, 87.28256];

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <Recenter focus={focus} />
      {pinned.map((r) => (
        <Marker
          key={r.id}
          position={[r.latitude as number, r.longitude as number]}
          icon={pinIcon}
        >
          <Popup>
            <div style={{ minWidth: 180 }}>
              <strong>{r.location_in_cadastral_map || "Untitled"}</strong>
              <div style={{ fontSize: 12, color: "#475569" }}>{r.district}</div>
              <div style={{ marginTop: 6, fontWeight: 700 }}>
                {formatNPR(r.market_rate)} / {r.unit}
              </div>
              <div style={{ fontSize: 12, color: "#475569" }}>By {r.creator_name}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
