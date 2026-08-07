import * as DialogPrimitive from "@radix-ui/react-dialog";
import { BadgeCheck, Camera, Loader2, LogOut, ShieldCheck, X } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { initialsOf, useAvatarUrl } from "@/lib/avatar";

/** The single unified profile surface — opened from the top-right avatar only. */
export function ProfileModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { profile, user, isAdmin, signOut, refreshProfile } = useAuth();
  const avatarUrl = useAvatarUrl(profile?.avatar_url);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const role = isAdmin ? "Admin" : profile?.is_verified ? "Verified Valuator" : "Guest";

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", user.id);
      if (dbErr) throw dbErr;
      await refreshProfile();
      toast.success("Profile photo updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not upload photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="surface-card fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 p-6 duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <DialogPrimitive.Title className="sr-only">Your profile</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Profile photo, identity, role and sign out.
          </DialogPrimitive.Description>
          <DialogPrimitive.Close
            aria-label="Close profile"
            className="tap absolute right-3 top-3 grid size-11 place-items-center rounded-xl text-muted-foreground"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>

          <div className="flex flex-col items-center text-center">
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Edit profile photo"
              className="tap gradient-brand relative grid size-24 place-items-center overflow-hidden rounded-full text-2xl font-black text-primary-foreground ring-4 ring-border"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile?.full_name ?? "Profile photo"}
                  className="size-full object-cover"
                />
              ) : (
                initialsOf(profile?.full_name, profile?.email)
              )}
              <span className="absolute inset-x-0 bottom-0 grid h-7 place-items-center bg-background/75">
                {uploading ? (
                  <Loader2 className="size-4 animate-spin text-foreground" />
                ) : (
                  <Camera className="size-4 text-foreground" />
                )}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUpload(f);
                e.target.value = "";
              }}
            />

            <p className="mt-4 w-full truncate text-lg font-extrabold text-foreground">
              {profile?.full_name ?? "Valuator"}
            </p>
            <p className="w-full truncate text-sm text-muted-foreground">
              {profile?.email ?? ""}
            </p>

            <span
              className={
                role === "Verified Valuator"
                  ? "mt-3 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1.5 text-[11px] font-bold text-success"
                  : role === "Admin"
                    ? "gradient-brand mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-primary-foreground"
                    : "mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-[11px] font-bold text-muted-foreground"
              }
            >
              {role === "Verified Valuator" ? (
                <BadgeCheck className="size-3.5" />
              ) : (
                <ShieldCheck className="size-3.5" />
              )}
              {role}
            </span>

            <button
              onClick={async () => {
                onOpenChange(false);
                await signOut();
                navigate({ to: "/auth", replace: true });
              }}
              className="tap mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 bg-surface-2 py-3.5 text-sm font-bold text-destructive"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
