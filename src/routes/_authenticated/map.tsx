import { createFileRoute } from "@tanstack/react-router";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:description", content: "Interactive map of land market rates." },
    ],
  }),
  component: () => null,
});
