import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import MapView, { MapLocateButton } from "@/components/MapView";
import { RecordForm } from "@/components/RecordForm";
import { useAuth } from "@/hooks/useAuth";
import { useRecords, type RecordWithCreator } from "@/hooks/useRecords";


export const Route = createFileRoute("/_authenticated/map")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Map — VMS" },
      {
        name: "description",
        content: "Every land valuation record plotted as an interactive pin across Nepal.",
      },
      { property: "og:title", content: "Map — VMS" },
      { property: "og:description", content: "Interactive map of land market rates." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { data = [], isLoading } = useRecords();
  const { canPublish } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editing] = useState<RecordWithCreator | null>(null);
  const [prefill, setPrefill] = useState<{ latitude: number; longitude: number } | null>(null);
  const [focus, setFocus] = useState<[number, number] | null>(null);
  const clearPinRef = useRef<(() => void) | null>(null);
  const navigate = useNavigate();

  return (
    <AppShell
      title="Map"
      bare
      {...(canPublish ? { onAdd: () => setFormOpen(true) } : {})}
      extraFloatingActions={<MapLocateButton onLocate={setFocus} />}
    >

      <div className="relative flex-1 w-full h-full overflow-hidden">
        {isLoading ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            Loading map…
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                Loading map…
              </div>
            }
          >
            <MapView
              records={data}
              focus={focus}
              onViewRecord={(r) => navigate({ to: "/records", search: { record: r.id } })}

              onDropPin={(coords, clear) => {
                if (!canPublish) {
                  clear();
                  return;
                }
                clearPinRef.current = clear;
                setPrefill({ latitude: coords[0], longitude: coords[1] });
                setFormOpen(true);
              }}
            />
          </Suspense>
        )}
      </div>
      <RecordForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) {
            clearPinRef.current?.();
            clearPinRef.current = null;
            setPrefill(null);
          }
        }}
        editing={editing}
        prefill={prefill}
      />
    </AppShell>
  );
}

