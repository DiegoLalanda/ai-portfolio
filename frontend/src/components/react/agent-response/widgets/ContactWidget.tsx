import { Mail, MapPin, Phone, SquareArrowOutUpRight } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { WidgetCard } from "../WidgetCard";
import { asArray, asRecord, asString } from "../utils";

interface ContactLink {
  label: string;
  url: string;
}

function parseLink(raw: unknown): ContactLink | null {
  const link = asRecord(raw);
  const url = asString(link.url);
  if (!url) return null;
  return { label: asString(link.label, url), url };
}

/** data: { email, phone, location, links: [{ label, url }] } */
export function ContactWidget({ widget }: { widget: Widget }) {
  const email = asString(widget.data.email);
  const phone = asString(widget.data.phone);
  const location = asString(widget.data.location);
  const links = asArray(widget.data.links)
    .map(parseLink)
    .filter((link): link is ContactLink => link !== null);

  if (!email && !phone && !location && links.length === 0) return null;

  return (
    <WidgetCard title={widget.title ?? "Contact"} icon={<Mail size={14} aria-hidden="true" />}>
      <div className="space-y-3">
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3 text-body-md text-on-surface-variant transition-colors hover:border-primary/20 hover:text-primary"
          >
            <Mail size={15} className="shrink-0 text-primary" aria-hidden="true" />
            {email}
          </a>
        )}
        {phone && (
          <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3 text-body-md text-on-surface-variant">
            <Phone size={15} className="shrink-0 text-primary" aria-hidden="true" />
            {phone}
          </div>
        )}
        {location && (
          <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3 text-body-md text-on-surface-variant">
            <MapPin size={15} className="shrink-0 text-primary" aria-hidden="true" />
            {location}
          </div>
        )}
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3 text-body-md text-secondary transition-colors hover:border-secondary/30 hover:underline"
          >
            <SquareArrowOutUpRight size={14} className="shrink-0" aria-hidden="true" />
            {link.label}
          </a>
        ))}
      </div>
    </WidgetCard>
  );
}
