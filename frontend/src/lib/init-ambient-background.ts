/**
 * Inicializa el fondo ambiente sin bloquear en Three.js.
 * El shader WebGL arranca de inmediato; las partículas se cargan en idle.
 */

import { initAuroraShader } from "@/lib/aurora-shader";

export function initAmbientBackground(): void {
  const shaderLayer = document.getElementById("aurora-shader-layer");
  const canvas = document.getElementById("aurora-shader-canvas");

  if (canvas instanceof HTMLCanvasElement) {
    initAuroraShader(canvas);
    shaderLayer?.classList.add("aurora-ready");
  }

  const particlesContainer = document.getElementById("aurora-particles-container");
  if (!particlesContainer) return;

  const loadParticles = () => {
    void import("@/lib/aurora-particles").then(({ initAuroraParticles }) => {
      initAuroraParticles(particlesContainer);
      document.getElementById("aurora-particles-layer")?.classList.add("aurora-ready");
    });
  };

  const scheduleParticles =
    typeof window.requestIdleCallback === "function"
      ? (callback: () => void) => window.requestIdleCallback(callback, { timeout: 1500 })
      : (callback: () => void) => window.setTimeout(callback, 1);

  scheduleParticles(loadParticles);
}
