import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/support")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Support & Contact — VMS" },
      {
        name: "description",
        content: "Reach the VMS team for help with records, valuation data or access.",
      },
      { property: "og:title", content: "Support & Contact — VMS" },
      { property: "og:description", content: "Get help with VMS records and valuations." },
    ],
  }),
  component: SupportPage,
});

const CONTACTS = [
  { icon: Mail, label: "Email", value: "vms.app.nepal@gmail.com", href: "mailto:vms.app.nepal@gmail.com" },
  { icon: Phone, label: "Phone", value: "+977-9852059599", href: "tel:+9779852059599" },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+977-9852059599",
    href: "https://wa.me/9779852059599",
  },
];

function SupportPage() {
  return (
    <AppShell title="Support / Contact" back>
      <div className="space-y-4 pb-8">
        <div className="surface-card p-5">
          <h2 className="text-lg font-bold text-foreground">We're here to help</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Questions about a record, a valuation figure or your account access? Reach out
            and the team will respond within one working day.
          </p>
        </div>

        {CONTACTS.map((c) => (
          <a
            key={c.label}
            href={c.href}
            className="surface-card tap grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 p-4"
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface-2 text-primary">
              <c.icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="truncate text-sm font-bold text-foreground">{c.value}</p>
            </div>
          </a>
        ))}

        <div className="surface-card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Reporting inaccurate data
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the flag icon on any record you did not create. Flagged records are
            reviewed by administrators, who are the only users able to remove data.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
