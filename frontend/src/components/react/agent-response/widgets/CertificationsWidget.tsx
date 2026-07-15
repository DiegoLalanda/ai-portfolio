import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Award, X } from "lucide-react";
import type { Widget } from "@/types/agent-response";
import { WidgetCard } from "../WidgetCard";
import { useResponseLocale } from "../ResponseLocaleContext";
import { asArray, asRecord, asString, asStringArray } from "../utils";

interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  imageUrl: string;
  issueDate: string;
  expirationDate: string;
  credentialUrl: string;
  description: string;
  skills: string[];
}

const DEFAULT_CERT_IMAGES: Record<string, string> = {
  "cert-argentina-programa-fullstack-jr": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
  "cert-argentina-programa-game-dev": "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
  "cert-utn-robotics-diploma": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80",
  "cert-odoo-developer": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
  "cert-server-deploy": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
  "cert-docker-professional": "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&q=80",
  "cert-python-data-analysis": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80",
};

const CERT_CREDENTIALS: Record<string, string> = {
  "cert-argentina-programa-fullstack-jr": "https://drive.google.com/file/d/1I1nG65tjlgnvyB73R1QDB86A6u219ahl/view?usp=sharing",
  "cert-argentina-programa-game-dev": "https://drive.google.com/file/d/1jyJq7lIdJoO0JEXIBAIOeLvUFvNiXxTB/view?usp=drive_link",
  "cert-utn-robotics-diploma": "https://drive.google.com/file/d/1ShWjjC3qQOC-aHXecntMEzy-Mfvb3rOj/view?usp=drive_link",
  "cert-odoo-developer": "https://drive.google.com/file/d/1VStlfH-DKmZS2VooP805SpxQA5EGROtu/view?usp=drive_link",
  "cert-server-deploy": "https://drive.google.com/file/d/18Y5k5eR9utRnh1SbkzM-PRMC6Cs9AeCj/view?usp=drive_link",
  "cert-docker-professional": "https://drive.google.com/file/d/1Vj7WmZzhyjgynq_wZtjokprMOdhiCnZF/view?usp=drive_link",
  "cert-python-data-analysis": "https://drive.google.com/file/d/1hSBmkMunr0IeiA6heWAPnvztIdI75B_H/view?usp=drive_link",
};

function getGoogleDriveThumbnailUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/(?:file\/d|d)\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    // Usar el endpoint de miniaturas oficial de Google Drive
    // Es el formato más compatible, rápido y libre de restricciones de CORS/cookies para etiquetas <img>
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w300`;
  }
  return null;
}

function parseItem(raw: unknown, index: number): CertificationItem {
  const item = asRecord(raw);
  const id = asString(item.id, `cert-${index}`);
  const credentialUrl = asString(item.credentialUrl) || CERT_CREDENTIALS[id] || "";
  const driveThumbnail = getGoogleDriveThumbnailUrl(credentialUrl);
  // Priorizar la previsualización estática de Google Drive para la miniatura
  const imageUrl = driveThumbnail || asString(item.imageUrl) || DEFAULT_CERT_IMAGES[id] || "";
  return {
    id,
    name: asString(item.name),
    issuer: asString(item.issuer),
    imageUrl,
    issueDate: asString(item.issueDate),
    expirationDate: asString(item.expirationDate),
    credentialUrl,
    description: asString(item.description),
    skills: asStringArray(item.skills),
  };
}

function formatDate(yyyyMm: string): string {
  if (!yyyyMm) return "";
  const [year, month] = yyyyMm.split("-");
  if (!month) return year ?? yyyyMm;
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("es-AR", { year: "numeric", month: "short" });
}

function CertVisual({
  id,
  imageUrl,
  name,
  large = false,
}: {
  id: string;
  imageUrl: string;
  name: string;
  large?: boolean;
}) {
  const [imgSrc, setImgSrc] = useState(imageUrl);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  // Sincronizar imgSrc si la prop imageUrl cambia
  useEffect(() => {
    setImgSrc(imageUrl);
    setFallbackAttempted(false);
  }, [imageUrl]);

  const base = large
    ? "relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-surface-container-highest"
    : "relative flex h-full min-h-[80px] w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container-highest sm:w-28";

  const handleImgError = () => {
    if (!fallbackAttempted) {
      // Si falló la miniatura de Google Drive, intentar con la imagen por defecto de Unsplash
      const defaultImg = DEFAULT_CERT_IMAGES[id];
      if (defaultImg && defaultImg !== imgSrc) {
        setImgSrc(defaultImg);
        setFallbackAttempted(true);
        return;
      }
    }
    // Si ya intentamos el fallback o no hay imagen por defecto, limpiar imgSrc para mostrar el icono Award
    setImgSrc("");
  };

  if (imgSrc) {
    return (
      <div className={base} style={large ? { aspectRatio: "16/9" } : undefined}>
        <img
          src={imgSrc}
          alt={name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={handleImgError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/60 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div className={base} style={large ? { aspectRatio: "16/9" } : undefined}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent opacity-20 transition-transform duration-1000 group-hover:scale-110" />
      <Award
        size={large ? 48 : 24}
        className="relative z-10 text-primary/60"
        aria-hidden="true"
      />
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

function CertDetailModal({
  item,
  closeLabel,
  onClose,
}: {
  item: CertificationItem;
  closeLabel: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  const embedUrl = getGoogleDriveEmbedUrl(item.credentialUrl);

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
      aria-label={item.name}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xl sm:p-8"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* X — fuera del contenedor con overflow-hidden */}
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="secondary-btn absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full sm:right-8 sm:top-8"
      >
        <X size={18} aria-hidden="true" />
      </button>

      <div className="glass-card flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl">
        {/* Vista previa en vivo por defecto */}
        <div className="relative w-full overflow-hidden bg-black/40" style={{ height: "380px" }}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="h-full w-full border-0 bg-surface-container-low"
              allow="autoplay"
              title={item.name}
            />
          ) : item.imageUrl ? (
            <>
              <img
                src={item.imageUrl}
                alt={item.name}
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-[#050505]/20 to-transparent" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent opacity-20" />
              <Award size={56} className="absolute inset-0 m-auto text-primary/60" aria-hidden="true" />
            </>
          )}
        </div>

        {/* info */}
        <div className="flex flex-col gap-3 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <h2 className="text-[20px] font-semibold leading-snug text-on-surface">
              {item.name}
            </h2>
            {item.issueDate && (
              <span className="shrink-0 text-[13px] text-on-surface-variant">
                {formatDate(item.issueDate)}
              </span>
            )}
          </div>

          <p className="text-[14px] font-medium text-primary">{item.issuer}</p>

          {item.description && (
            <p className="text-[13px] leading-relaxed text-on-surface-variant">{item.description}</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CertCard({
  item,
  onOpen,
}: {
  item: CertificationItem;
  onOpen: () => void;
}) {
  return (
    <article
      className="group relative flex cursor-pointer gap-3.5 overflow-hidden rounded-xl border border-white/8 bg-white/[0.03] p-3 transition-colors hover:border-primary/20 hover:bg-white/[0.05] sm:gap-4"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      aria-label={item.name}
    >
      <CertVisual id={item.id} imageUrl={item.imageUrl} name={item.name} />

      <div className="min-w-0 flex-1 py-0.5 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5">
            <h3 className="font-label-md text-[14px] font-semibold leading-snug text-on-surface">
              {item.name}
            </h3>
            {item.issueDate && (
              <span className="shrink-0 text-[12px] text-on-surface-variant">
                {formatDate(item.issueDate)}
              </span>
            )}
          </div>

          <p className="mt-0.5 text-[13px] text-primary">{item.issuer}</p>

          {item.description && (
            <p className="mt-1.5 hidden line-clamp-2 text-[12px] leading-snug text-on-surface-variant sm:block">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

/** data: { items: [{ id, name, issuer, imageUrl, issueDate, credentialUrl, description, skills }] } */
export function CertificationsWidget({ widget }: { widget: Widget }) {
  const locale = useResponseLocale();
  const defaultTitle = locale === "en" ? "Certifications" : "Certificaciones";
  const closeLabel = locale === "en" ? "Close" : "Cerrar";

  const items = asArray(widget.data.items).map(parseItem);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedItem = selectedId ? (items.find((i) => i.id === selectedId) ?? null) : null;

  if (items.length === 0) return null;

  return (
    <>
      <WidgetCard title={widget.title ?? defaultTitle} icon={<Award size={14} aria-hidden="true" />}>
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <CertCard
              key={item.id}
              item={item}
              onOpen={() => setSelectedId(item.id)}
            />
          ))}
        </div>
      </WidgetCard>

      {selectedItem && (
        <CertDetailModal
          item={selectedItem}
          closeLabel={closeLabel}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
