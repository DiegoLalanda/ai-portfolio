/** Parallax suave que sigue al cursor — solo en dispositivos con mouse. */
export function initCursorParallax(strength = 20) {
  const parallaxEl = document.getElementById("parallax-container");
  if (!parallaxEl) return;
  const parallax: HTMLElement = parallaxEl;

  const canFollowCursor = window.matchMedia("(hover: hover) and (pointer: fine)");

  function onMouseMove(event: MouseEvent) {
    if (!canFollowCursor.matches) return;

    const x = (event.clientX / window.innerWidth - 0.5) * strength;
    const y = (event.clientY / window.innerHeight - 0.5) * strength;
    parallax.style.transform = `translate(${x}px, ${y}px)`;
  }

  function syncListener() {
    document.removeEventListener("mousemove", onMouseMove);
    parallax.style.transform = "";

    if (canFollowCursor.matches) {
      document.addEventListener("mousemove", onMouseMove);
    }
  }

  syncListener();
  canFollowCursor.addEventListener("change", syncListener);
}
