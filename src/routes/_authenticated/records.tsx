import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/records")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { record?: string | undefined } => ({
    record: typeof search['record'] === "string" ? (search['record'] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Universal Records — VMS" },
      {
        name: "description",
        content: "Search and filter every shared land market valuation record.",
      },
      { property: "og:title", content: "Universal Records — VMS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:description", content: "Shared land market valuation records." },
    ],
  }),
  component: () => null,
});
