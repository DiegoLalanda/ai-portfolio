/**
 * Campo de partículas flotantes renderizado con three.js.
 * Portado 1:1 desde el diseño exportado de Stitch.
 */

import * as THREE from "three";

const PARTICLES_COUNT = 1500;
const MAX_PIXEL_RATIO = 2;

export function initAuroraParticles(container: HTMLElement): void {
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  container.appendChild(renderer.domElement);

  const positions = new Float32Array(PARTICLES_COUNT * 3);
  const velocities = new Float32Array(PARTICLES_COUNT * 3);

  for (let i = 0; i < PARTICLES_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 15;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

    velocities[i * 3] = (Math.random() - 0.5) * 0.002;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.015,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  const mouse = new THREE.Vector2(-999, -999);
  let animationFrameId = 0;
  let isRunning = true;

  window.addEventListener("mousemove", (event) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;
  });

  function animate() {
    if (!isRunning) return;

    const array = geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < PARTICLES_COUNT; i++) {
      array[i * 3] += velocities[i * 3];
      array[i * 3 + 1] += velocities[i * 3 + 1];
      array[i * 3 + 2] += velocities[i * 3 + 2];

      if (Math.abs(array[i * 3]) > 7.5) array[i * 3] *= -0.98;
      if (Math.abs(array[i * 3 + 1]) > 7.5) array[i * 3 + 1] *= -0.98;

      if (mouse.x !== -999) {
        const px = array[i * 3];
        const py = array[i * 3 + 1];
        const mx = mouse.x * 7.5;
        const my = mouse.y * 7.5;
        const dx = px - mx;
        const dy = py - my;
        const distSq = dx * dx + dy * dy;

        if (distSq < 2.0) {
          const force = (2.0 - distSq) * 0.01;
          array[i * 3] += (dx / distSq) * force;
          array[i * 3 + 1] += (dy / distSq) * force;
        }
      }
    }

    geometry.attributes.position.needsUpdate = true;
    points.rotation.y += 0.0002;
    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(animate);
  }

  function startLoop() {
    if (isRunning) return;
    isRunning = true;
    animationFrameId = requestAnimationFrame(animate);
  }

  function stopLoop() {
    isRunning = false;
    cancelAnimationFrame(animationFrameId);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopLoop();
    else startLoop();
  });

  startLoop();

  window.addEventListener("resize", () => {
    const newWidth = container.clientWidth || window.innerWidth;
    const newHeight = container.clientHeight || window.innerHeight;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  });
}
