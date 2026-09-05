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

export function DocViewerModal({
  url,
  title,
  onOpenChange,
}: {
  url: string | null;
  title: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(url)} onOpenChange={onOpenChange}>
      <DialogContent className="top-2 flex h-[97dvh] max-h-[97dvh] max-w-4xl translate-y-0 flex-col overflow-hidden rounded-3xl border-border bg-popover p-0 sm:max-w-4xl">
        <DialogTitle className="border-b border-border px-5 py-4 text-base font-bold text-foreground">
          {title}
        </DialogTitle>
        {url && (
          <iframe
            src={toEmbedUrl(url)}
            title={title}
            className="size-full min-h-0 flex-1 border-0 bg-surface-2"
            allow="autoplay"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
