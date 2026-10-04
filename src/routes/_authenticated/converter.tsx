import { createFileRoute } from "@tanstack/react-router";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      {
        property: "og:description",
        content: "Terai and Hilly land unit conversion and arithmetic.",
      },
    ],
  }),
  component: () => null,
});
