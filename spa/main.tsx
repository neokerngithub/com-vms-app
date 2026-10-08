// Client-only entry for the bundled Android (Capacitor) build. Reuses the app's routes
// with hash history so deep links work from a file-served WebView.
import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import { createHashHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import "../src/styles.css";
import { routeTree } from "../src/routeTree.gen";

// The web build's root renders the full <html> document; in the SPA the document is index.html.
(routeTree.options as { shellComponent?: unknown }).shellComponent = ({ children }: { children: ReactNode }) => children;

const queryClient = new QueryClient();
const router = createRouter({
  routeTree,
  history: createHashHistory(),
  context: { queryClient },
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
  defaultPreload: "intent",
  defaultPendingMs: 1000,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
