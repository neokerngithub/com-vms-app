<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep professional verification identity fields on profiles and enforce status changes with database-side protections; self-service requests must not grant verified access.
- Read public creator names and verification flags through the limited profile directory; professional numbers remain accessible only to their owner and administrators.
- Enforce government rate approval transitions in the database and expose unpublished contributions only to their creator or administrators; client-side filters alone cannot protect moderation.

- Map, Records and Converter tab screens live in src/components/tabs and are kept mounted by the _authenticated layout (hidden via CSS, never unmounted) so tab switches are instant and the map keeps its tiles; their route files render null.
- The Admin Dashboard derives its metrics from the already-cached admin queries instead of issuing extra requests, so opening it does not delay navigation.

- The Android app (Capacitor) loads the published site via server.url because the app is server-rendered and has no static index.html to bundle; same-origin https keeps auth and tile requests free of CORS issues.
