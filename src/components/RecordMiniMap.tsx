import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";

export function RecordMiniMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const center: [number, number] = [latitude, longitude];
  return (
    <MapContainer center={center} zoom={17} minZoom={3} maxZoom={19} scrollWheelZoom={false} className="h-full w-full" style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        maxNativeZoom={18}
      />
      <CircleMarker center={center} radius={9} pathOptions={{ color: "var(--primary)", fillColor: "var(--primary)", fillOpacity: 1, weight: 3 }} />
    </MapContainer>
  );
}