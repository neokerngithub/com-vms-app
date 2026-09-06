import { useEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/** Turn a Google Drive share link into an embeddable preview URL. */
export function toEmbedUrl(url: string): string {
  const drive = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (drive?.[1]) return `https://drive.google.com/file/d/${drive[1]}/preview`;
  const open = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (open?.[1]) return `https://drive.google.com/file/d/${open[1]}/preview`;
  if (/docs\.google\.com/.test(url)) return url.replace(/\/(edit|view)(\?.*)?$/, "/preview");
  return url;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function DocViewerModal({
  url,
  title,
  onOpenChange,
}: {
  url: string | null;
  title: string;
  onOpenChange: (open: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const stateRef = useRef({ zoom, offset });
  stateRef.current = { zoom, offset };

  useEffect(() => {
    if (!url) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [url]);

  const zoomAt = (nextZoom: number, px?: number, py?: number) => {
    const { zoom: z, offset: o } = stateRef.current;
    const next = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    const rect = containerRef.current?.getBoundingClientRect();
    const cx = px ?? (rect ? rect.width / 2 : 0);
    const cy = py ?? (rect ? rect.height / 2 : 0);
    const k = next / z;
    const nx = cx - (cx - o.x) * k;
    const ny = cy - (cy - o.y) * k;
    setZoom(next);
    setOffset(next === 1 ? { x: 0, y: 0 } : { x: nx, y: ny });
  };

  // Native non-passive wheel/pinch handling.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !url) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const rect = el.getBoundingClientRect();
      zoomAt(
        stateRef.current.zoom * Math.exp(-dy * 0.0025),
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [url]);

  // Touch pinch + pan, and mouse drag pan while zoomed.
  const gesture = useRef<{
    mode: "none" | "pan" | "pinch";
    startX: number;
    startY: number;
    startOffset: { x: number; y: number };
    startDist: number;
    startZoom: number;
  }>({
    mode: "none",
    startX: 0,
    startY: 0,
    startOffset: { x: 0, y: 0 },
    startDist: 0,
    startZoom: 1,
  });

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0]!, e.touches[1]!];
      gesture.current = {
        mode: "pinch",
        startX: (a.clientX + b.clientX) / 2,
        startY: (a.clientY + b.clientY) / 2,
        startOffset: offset,
        startDist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        startZoom: zoom,
      };
    } else if (e.touches.length === 1 && zoom > 1) {
      const t = e.touches[0]!;
      gesture.current = {
        mode: "pan",
        startX: t.clientX,
        startY: t.clientY,
        startOffset: offset,
        startDist: 0,
        startZoom: zoom,
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const g = gesture.current;
    if (g.mode === "pinch" && e.touches.length === 2) {
      const [a, b] = [e.touches[0]!, e.touches[1]!];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const rect = containerRef.current?.getBoundingClientRect();
      const next = clamp((g.startZoom * dist) / (g.startDist || 1), MIN_ZOOM, MAX_ZOOM);
      const cx = (a.clientX + b.clientX) / 2 - (rect?.left ?? 0);
      const cy = (a.clientY + b.clientY) / 2 - (rect?.top ?? 0);
      const k = next / stateRef.current.zoom;
      const o = stateRef.current.offset;
      setZoom(next);
      setOffset(next === 1 ? { x: 0, y: 0 } : { x: cx - (cx - o.x) * k, y: cy - (cy - o.y) * k });
    } else if (g.mode === "pan" && e.touches.length === 1) {
      const t = e.touches[0]!;
      setOffset({
        x: g.startOffset.x + (t.clientX - g.startX),
        y: g.startOffset.y + (t.clientY - g.startY),
      });
    }
  };

  const onTouchEnd = () => {
    gesture.current.mode = "none";
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    gesture.current = {
      mode: "pan",
      startX: e.clientX,
      startY: e.clientY,
      startOffset: offset,
      startDist: 0,
      startZoom: zoom,
    };
    const move = (ev: MouseEvent) => {
      const g = gesture.current;
      if (g.mode !== "pan") return;
      setOffset({
        x: g.startOffset.x + (ev.clientX - g.startX),
        y: g.startOffset.y + (ev.clientY - g.startY),
      });
    };
    const up = () => {
      gesture.current.mode = "none";
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const zoomed = zoom > 1;

  return (
    <Dialog open={Boolean(url)} onOpenChange={onOpenChange}>
      <DialogContent className="top-2 flex h-[97dvh] max-h-[97dvh] max-w-4xl translate-y-0 flex-col overflow-hidden rounded-3xl border-border bg-popover p-0 sm:max-w-4xl">
        <DialogTitle className="border-b border-border px-5 py-4 text-base font-bold text-foreground">
          {title}
        </DialogTitle>
        {url && (
          <div
            ref={containerRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            className="relative min-h-0 flex-1 overflow-hidden bg-surface-2"
            style={{ touchAction: zoomed ? "none" : "manipulation" }}
          >
            <iframe
              src={toEmbedUrl(url)}
              title={title}
              className="size-full border-0 bg-surface-2"
              allow="autoplay"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transformOrigin: "0 0",
                pointerEvents: zoomed ? "none" : "auto",
              }}
            />
          </div>
        )}
        <div className="flex items-center justify-center gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={() => zoomAt(zoom / 1.3)}
            aria-label="Zoom out"
            className="tap flex size-11 items-center justify-center rounded-xl border border-border bg-surface-2 text-foreground"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-16 text-center text-xs font-bold text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => zoomAt(zoom * 1.3)}
            aria-label="Zoom in"
            className="tap flex size-11 items-center justify-center rounded-xl border border-border bg-surface-2 text-foreground"
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            aria-label="Reset zoom"
            className="tap flex h-11 items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 text-xs font-bold text-foreground"
          >
            <RotateCcw className="size-4" />
            Reset
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
