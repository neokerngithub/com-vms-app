import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RecordForm } from "@/components/RecordForm";
import { useRecords, type RecordWithCreator } from "@/hooks/useRecords";

const MapView = lazy(() => import("@/components/MapView"));

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
  const [formOpen, setFormOpen] = useState(false);
  const [editing] = useState<RecordWithCreator | null>(null);
  const navigate = useNavigate();

  return (
    <AppShell title="Map" bare onAdd={() => setFormOpen(true)}>
      <div className="h-[calc(100dvh-13rem)] w-full overflow-hidden">
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
              focus={null}
              onViewRecord={(r) => navigate({ to: "/records", search: { record: r.id } })}
            />
          </Suspense>
        )}
      </div>
      <RecordForm open={formOpen} onOpenChange={setFormOpen} editing={editing} />
    </AppShell>
  );
}
