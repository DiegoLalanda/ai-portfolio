import { GraduationCap, ExternalLink, Eye, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Widget } from "@/types/agent-response";
import { localizeEducationFields } from "@/lib/educationCopy";
import { TimelineRail, type TimelineRailItem } from "../TimelineRail";
import { WidgetCard } from "../WidgetCard";
import { useResponseLocale } from "../ResponseLocaleContext";
import { asArray, asRecord, asString, asStringArray } from "../utils";

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  status: string;
  highlights: string[];
  logoUrl?: string;
  credentialUrl?: string;
}

const EDUCATION_LOGOS: Record<string, string> = {
  "edu-uner-web-development": "/images/logos/logo-uner.png",
  "edu-isdica-physics-teaching": "/images/logos/logo-isdica.png",
};

const EDUCATION_CREDENTIALS: Record<string, string> = {
  "edu-uner-web-development": "https://drive.google.com/file/d/17cyaPDr4Txz4DVQGDGYPO4gVckZo0jmc/view?usp=sharing",
  "edu-isdica-physics-teaching": "https://drive.google.com/file/d/1RDLc9KPkjcApTKCm3afeMq-_QQKq64x3/view?usp=drive_link",
};

function getEducationLogo(id: string, institution: string, degree: string): string | undefined {
  const normInst = institution.toLowerCase();
  const normDegree = degree.toLowerCase();
  if (id === "edu-uner-web-development" || normInst.includes("uner") || normInst.includes("entre ríos") || normDegree.includes("desarrollo web")) {
    return "/images/logos/logo-uner.png";
  }
  if (id === "edu-isdica-physics-teaching" || normInst.includes("isdica") || normDegree.includes("física") || normDegree.includes("physics")) {
    return "/images/logos/logo-isdica.png";
  }
  return EDUCATION_LOGOS[id];
}

function parseItem(raw: unknown, index: number): EducationItem {
  const item = asRecord(raw);
  const id = asString(item.id, `education-${index}`);
  const institution = asString(item.institution);
  const degree = asString(item.degree);
  return {
    id,
    institution,
    degree,
    fieldOfStudy: asString(item.fieldOfStudy),
    startDate: asString(item.startDate),
    endDate: asString(item.endDate),
    status: asString(item.status),
    highlights: asStringArray(item.highlights),
    logoUrl: getEducationLogo(id, institution, degree),
    credentialUrl: asString(item.credentialUrl) || EDUCATION_CREDENTIALS[id] || "",
  };
}

function formatDateLabel(item: EducationItem) {
  const range =
    item.startDate || item.endDate
      ? `${item.startDate}${item.endDate ? ` — ${item.endDate}` : ""}`
      : "";

  return (
    <div className="flex flex-wrap items-center gap-2 md:justify-end">
      {item.status && (
        <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          {item.status}
        </span>
      )}
      {range && (
        <span className="text-[12px] text-on-surface-variant font-medium">
          {range}
        </span>
      )}
    </div>
  );
}

function getGoogleDriveEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  return null;
}

function LivePreviewModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    prevFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
      prevFocusRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xl sm:p-8"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        className="secondary-btn absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full sm:right-8 sm:top-8"
      >
        <X size={18} aria-hidden="true" />
      </button>

      <div className="glass-card flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl" style={{ height: "80vh" }}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="text-[16px] font-semibold text-on-surface line-clamp-1">{title}</h3>
        </div>
        <div className="flex-1 bg-black/40">
          <iframe
            src={url}
            className="h-full w-full border-0"
            allow="autoplay"
            title={title}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function EducationDetails({
  item,
  fieldLabel,
  credentialLabel,
  onShowPreview,
}: {
  item: EducationItem;
  fieldLabel: string;
  credentialLabel: string;
  onShowPreview: (url: string, title: string) => void;
}) {
  if (item.highlights.length === 0 && !item.fieldOfStudy && !item.credentialUrl) return null;

  const embedUrl = getGoogleDriveEmbedUrl(item.credentialUrl || "");

  return (
    <div className="space-y-3">
      {item.fieldOfStudy && (
        <p className="font-body-md text-on-surface-variant">
          {fieldLabel}: <span className="text-on-surface">{item.fieldOfStudy}</span>
        </p>
      )}
      {item.highlights.length > 0 && (
        <ul className="space-y-1.5">
          {item.highlights.map((highlight, i) => (
            <li key={i} className="flex gap-2 text-body-md text-on-surface-variant">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              {highlight}
            </li>
          ))}
        </ul>
      )}

      {item.credentialUrl && (
        <div className="pt-1 flex flex-wrap gap-2">
          {embedUrl ? (
            <button
              type="button"
              onClick={() => onShowPreview(embedUrl, item.degree)}
              className="secondary-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-medium text-on-surface hover:text-primary transition-colors"
            >
              <Eye size={13} aria-hidden="true" />
              {credentialLabel}
            </button>
          ) : (
            <a
              href={item.credentialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="secondary-btn inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-medium text-on-surface hover:text-primary transition-colors"
            >
              <ExternalLink size={13} aria-hidden="true" />
              {credentialLabel}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/** data: { items: [{ id, institution, degree, fieldOfStudy, startDate, endDate, status, highlights? }] } */
export function EducationWidget({ widget }: { widget: Widget }) {
  const locale = useResponseLocale();
  const defaultTitle = locale === "en" ? "Education" : "Educación";
  const fieldLabel = locale === "en" ? "Field of study" : "Área de estudio";
  const credentialLabel = locale === "en" ? "View degree" : "Ver título";

  const [previewData, setPreviewData] = useState<{ url: string; title: string } | null>(null);

  const items = asArray(widget.data.items)
    .map(parseItem)
    .map((item) => localizeEducationFields(item, locale));
  if (items.length === 0) return null;

  const railItems: TimelineRailItem[] = items.map((item) => {
    const hasDetails = item.highlights.length > 0 || Boolean(item.fieldOfStudy) || Boolean(item.credentialUrl);
    return {
      id: item.id,
      title: item.degree,
      subtitle: item.institution,
      dateLabel: formatDateLabel(item),
      logoUrl: item.logoUrl,
      details: hasDetails ? (
        <EducationDetails
          item={item}
          fieldLabel={fieldLabel}
          credentialLabel={credentialLabel}
          onShowPreview={(url, title) => setPreviewData({ url, title })}
        />
      ) : undefined,
    };
  });

  return (
    <>
      <WidgetCard title={widget.title ?? defaultTitle} icon={<GraduationCap size={14} aria-hidden="true" />}>
        <TimelineRail items={railItems} defaultOpenFirst orientation="auto" seed={widget.id} />
      </WidgetCard>

      {previewData && (
        <LivePreviewModal
          url={previewData.url}
          title={previewData.title}
          onClose={() => setPreviewData(null)}
        />
      )}
    </>
  );
}
