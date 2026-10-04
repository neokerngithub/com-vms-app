import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAvatarUrl } from "@/lib/avatar";
import { supabase } from "@/integrations/supabase/client";
import {
  LifeBuoy,
  Mail,
  MessageCircle,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
} from "lucide-react";

const CONTACTS = [
  {
    icon: Mail,
    label: "Email",
    value: "vms.app.nepal@gmail.com",
    href: "mailto:vms.app.nepal@gmail.com",
  },
  { icon: Phone, label: "Phone", value: "+977-9852059599", href: "tel:+9779852059599" },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+977-9852059599",
    href: "https://wa.me/9779852059599",
  },
] as const;
import { AppShell } from "@/components/AppShell";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — VMS" },
      {
        name: "description",
        content: "App preferences and record permission rules in VMS.",
      },
      { property: "og:title", content: "Settings — VMS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:description", content: "App preferences and permissions for VMS." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, profile, refreshProfile } = useAuth();
  const avatarUrl = useAvatarUrl(profile?.avatar_url);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [verificationType, setVerificationType] = useState<"NEC" | "DEAN">("NEC");
  const [number, setNumber] = useState("");
  const [passoutYear, setPassoutYear] = useState("");
  const [status, setStatus] = useState("none");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const kind = profile.verification_type === "DEAN" || (!profile.verification_type && profile.dean_number && !profile.nec_number) ? "DEAN" : "NEC";
    setFullName(profile.full_name ?? "");
    setVerificationType(kind);
    setNumber((kind === "DEAN" ? profile.dean_number : profile.nec_number) ?? "");
    setPassoutYear(profile.passout_year?.toString() ?? "");
    setStatus(profile.verification_status ?? "none");
  }, [profile]);

  useEffect(() => {
    if (!photo) { setPreview(null); return; }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const schema = z.object({
      fullName: z.string().trim().min(1, "Full name is required").max(120),
      number: z.string().trim().max(100),
      passoutYear: z.string().refine((value) => !value || (/^\d{4}$/.test(value) && Number(value) >= 1900 && Number(value) <= 2200), "Enter a valid four-digit passout year"),
    });
    const result = schema.safeParse({ fullName, number, passoutYear });
    if (!result.success) { toast.error(result.error.issues[0]?.message ?? "Check your profile details"); return; }
    if (photo && (!photo.type.startsWith("image/") || photo.size > 5 * 1024 * 1024)) {
      toast.error("Choose an image under 5 MB"); return;
    }
    setSaving(true);
    try {
      let avatarPath = profile?.avatar_url ?? null;
      if (photo) {
        const ext = photo.name.split(".").pop()?.toLowerCase() ?? "jpg";
        avatarPath = `${user.id}/avatar-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("avatars").upload(avatarPath, photo, { contentType: photo.type });
        if (error) throw error;
      }
      const registration = result.data.number.trim();
      const previousNumber = verificationType === "NEC" ? profile?.nec_number : profile?.dean_number;
      const credentialsChanged = registration !== (previousNumber ?? "") || verificationType !== (profile?.verification_type ?? (profile?.dean_number && !profile?.nec_number ? "DEAN" : "NEC"));
      const { error } = await supabase.from("profiles").update({
        full_name: result.data.fullName,
        avatar_url: avatarPath,
        verification_type: verificationType,
        nec_number: verificationType === "NEC" ? registration || null : null,
        dean_number: verificationType === "DEAN" ? registration || null : null,
        passout_year: result.data.passoutYear ? Number(result.data.passoutYear) : null,
        ...(registration && (credentialsChanged || status === "none" || status === "rejected") && !profile?.is_verified ? { verification_status: "pending" } : {}),
      }).eq("id", user.id);
      if (error) throw error;
      setPhoto(null);
      await refreshProfile();
      toast.success("Profile saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile");
    } finally { setSaving(false); }
  };

  return (
    <AppShell title="Settings" back>
      <div className="space-y-4 pb-8">
        <form onSubmit={saveProfile} className="surface-card space-y-4 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">User Profile</p>
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="icon" onClick={() => fileRef.current?.click()} aria-label="Update profile picture" className="relative size-16 shrink-0 overflow-hidden rounded-full bg-surface-2 p-0 ring-2 ring-border">
              <img src={preview ?? avatarUrl ?? "/branding/Round_Logo.png"} alt="Profile picture" className="size-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 grid h-5 place-items-center bg-background/75"><Camera className="size-3 text-foreground" /></span>
            </Button>
            <div className="min-w-0"><p className="text-sm font-bold text-foreground">Profile Picture</p><p className="truncate text-xs text-muted-foreground">{profile?.email ?? ""}</p></div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { setPhoto(e.target.files?.[0] ?? null); e.target.value = ""; }} />
          </div>
          <label className="block space-y-1.5"><span className="text-xs font-bold text-muted-foreground">Full Name</span><input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} required className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm text-foreground outline-none ring-ring focus:ring-2" /></label>
          <label className="block space-y-1.5"><span className="text-xs font-bold text-muted-foreground">Verification Type</span><select value={verificationType} onChange={(e) => { const kind = e.target.value as "NEC" | "DEAN"; setVerificationType(kind); setNumber((kind === "NEC" ? profile?.nec_number : profile?.dean_number) ?? ""); }} className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm text-foreground outline-none ring-ring focus:ring-2"><option value="NEC">NEC</option><option value="DEAN">DEAN</option></select></label>
          <label className="block space-y-1.5"><span className="text-xs font-bold text-muted-foreground">Registration/Membership Number</span><input value={number} onChange={(e) => setNumber(e.target.value)} maxLength={100} className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm text-foreground outline-none ring-ring focus:ring-2" /></label>
          <label className="block space-y-1.5"><span className="text-xs font-bold text-muted-foreground">Passout Year</span><input value={passoutYear} onChange={(e) => setPassoutYear(e.target.value)} type="number" min="1900" max="2200" className="h-12 w-full rounded-xl border border-border bg-surface-2 px-4 text-sm text-foreground outline-none ring-ring focus:ring-2" /></label>
          <p className="text-xs text-muted-foreground">Professional Verification - Submit your Nepal Engineering Council (NEC) number or Diploma Engineers Association Nepal (DEAN) number to request verified valuator status. NEC/DEAN numbers are private and reviewed by an administrator.</p>
          {status === "pending" && <p className="text-xs text-primary">*Verification in review: Your verification request has been submitted. Our administrator will review your information.</p>}
          <Button type="submit" disabled={saving} className="tap gradient-brand h-12 w-full rounded-xl text-sm font-bold text-primary-foreground">{saving ? "Saving…" : "Save Changes"}</Button>
        </form>
        <div id="preferences" className="surface-card scroll-mt-24 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            App Preferences
          </p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">Appearance</p>
              <p className="text-xs text-muted-foreground">
                {theme === "dark" ? "Dark mode" : "Light mode"}
              </p>
            </div>
            <div className="flex shrink-0 rounded-2xl border border-border bg-surface-2 p-1">
              {(
                [
                  { key: "dark", label: "Dark", Icon: Moon },
                  { key: "light", label: "Light", Icon: Sun },
                ] as const
              ).map((o) => (
                <button
                  key={o.key}
                  onClick={() => setTheme(o.key)}
                  aria-pressed={theme === o.key}
                  className={cn(
                    "tap flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold",
                    theme === o.key
                      ? "gradient-brand text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <o.Icon className="size-4" />
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div id="support" className="surface-card scroll-mt-24 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <LifeBuoy className="size-4" /> Support & Contact
          </p>
          <div className="mt-3 space-y-2">
            {CONTACTS.map((c) => (
              <a
                key={c.label}
                href={c.href}
                className="tap grid min-h-11 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5"
              >
                <c.icon className="size-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-[11px] text-muted-foreground">{c.label}</span>
                  <span className="block truncate text-sm font-bold text-foreground">
                    {c.value}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>

        <div id="permissions" className="surface-card scroll-mt-24 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="size-4" /> Permissions & Reporting
          </p>
          <p className="mt-2 text-sm font-bold text-foreground">
            Secure Data Governance — Creator-managed edits with admin moderation
          </p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Active records and their map locations are visible to every signed-in user. Soft-deleted records disappear from Records and Map and remain visible only to administrators in the Recycle Bin.</li>
            <li>• Verified valuators may create records after an administrator reviews their Nepal Engineering Council (NEC) or Diploma Engineers Association Nepal (DEAN) credentials. NEC and DEAN follow the same verification standard; submitting a number does not grant access automatically.</li>
            <li>• Creators can edit or soft-delete their own records. Administrators can restore or permanently delete records.</li>
            <li>• Inaccurate records from others can be reported with a description for administrator review.</li>
            <li>• Government rate contributions from non-admins require administrator approval before appearing in the library.</li>
          </ul>
          <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
            Use the flag icon on any record you did not create and describe the issue in at
            least 10 characters. Flagged records are reviewed by administrators.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
