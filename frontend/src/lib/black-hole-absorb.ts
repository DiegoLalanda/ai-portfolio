const PORTAL_ID = "black-hole-absorb-portal";

export const BLACK_HOLE_ABSORB_DURATION_MS = 920;
export const BLACK_HOLE_ABSORB_STAGGER_MS = 38;
/** Tiempo hasta ocultar landing tras submit (absorción + margen). */
export const BLACK_HOLE_LANDING_EXIT_MS =
  BLACK_HOLE_ABSORB_DURATION_MS + BLACK_HOLE_ABSORB_STAGGER_MS * 7 + 80;

export interface AbsorbOptions {
  duration?: number;
  delay?: number;
  stagger?: number;
  rotation?: number;
}

function getPortal(): HTMLElement {
  let portal = document.getElementById(PORTAL_ID);
  if (!portal) {
    portal = document.createElement("div");
    portal.id = PORTAL_ID;
    portal.setAttribute("aria-hidden", "true");
    portal.className = "pointer-events-none fixed inset-0 z-[60] overflow-hidden";
    document.body.appendChild(portal);
  }
  return portal;
}

function copyVisualStyles(source: HTMLElement, target: HTMLElement) {
  const computed = getComputedStyle(source);
  target.style.font = computed.font;
  target.style.fontSize = computed.fontSize;
  target.style.fontWeight = computed.fontWeight;
  target.style.fontStyle = computed.fontStyle;
  target.style.letterSpacing = computed.letterSpacing;
  target.style.lineHeight = computed.lineHeight;
  target.style.textAlign = computed.textAlign;
  target.style.color = computed.color;
  target.style.background = computed.background;
  target.style.backdropFilter = computed.backdropFilter;
  target.style.border = computed.border;
  target.style.borderRadius = computed.borderRadius;
  target.style.boxShadow = computed.boxShadow;
  target.style.padding = computed.padding;
  target.style.whiteSpace = computed.whiteSpace;
}

export function clearAbsorbHiddenElements() {
  document.querySelectorAll<HTMLElement>("[data-absorb-hidden]").forEach((el) => {
    el.style.visibility = "";
    el.style.pointerEvents = "";
    el.removeAttribute("data-absorb-hidden");
  });

  const portal = document.getElementById(PORTAL_ID);
  if (portal) portal.remove();
}

export function absorbIntoBlackHole(
  elements: HTMLElement[],
  options: AbsorbOptions = {},
): Promise<void> {
  const {
    duration = BLACK_HOLE_ABSORB_DURATION_MS,
    delay = 0,
    stagger = BLACK_HOLE_ABSORB_STAGGER_MS,
    rotation = 680,
  } = options;

  const visible = elements.filter((el) => el.isConnected);
  if (visible.length === 0) return Promise.resolve();

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    visible.forEach((el) => {
      el.style.visibility = "hidden";
      el.style.pointerEvents = "none";
      el.dataset.absorbHidden = "true";
    });
    return Promise.resolve();
  }

  const portal = getPortal();
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  const animations = visible.map((el, index) => {
    const rect = el.getBoundingClientRect();
    const ex = rect.left + rect.width / 2;
    const ey = rect.top + rect.height / 2;
    const dx = cx - ex;
    const dy = cy - ey;
    const elDelay = delay + index * stagger;

    const clone = el.cloneNode(true) as HTMLElement;
    copyVisualStyles(el, clone);

    el.style.visibility = "hidden";
    el.style.pointerEvents = "none";
    el.dataset.absorbHidden = "true";

    clone.style.position = "absolute";
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.margin = "0";
    clone.style.animation = "none";
    clone.style.transition = "none";
    clone.style.transform = "none";
    clone.style.zIndex = String(10 + index);
    clone.style.pointerEvents = "none";
    clone.style.willChange = "transform, opacity, filter";

    portal.appendChild(clone);

    return clone
      .animate(
        [
          {
            transform: "translate(0, 0) scale(1) rotate(0deg)",
            opacity: 1,
            filter: "blur(0px)",
          },
          {
            offset: 0.55,
            transform: `translate(${dx * 0.72}px, ${dy * 0.72}px) scale(0.35) rotate(${rotation * 0.55}deg)`,
            opacity: 0.75,
            filter: "blur(1px)",
          },
          {
            transform: `translate(${dx}px, ${dy}px) scale(0.02) rotate(${rotation}deg)`,
            opacity: 0,
            filter: "blur(10px)",
          },
        ],
        {
          duration,
          delay: elDelay,
          easing: "cubic-bezier(0.52, 0.02, 0.78, 0.42)",
          fill: "forwards",
        },
      )
      .finished.then(() => clone.remove());
  });

  return Promise.all(animations).then(() => {
    if (portal.childElementCount === 0) portal.remove();
  });
}
