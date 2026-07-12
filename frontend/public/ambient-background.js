/**
 * Fondo aurora + partículas con lente al cursor; vórtex centrado mientras piensa el agente.
 */
(function initAmbientBackground() {
  const canvas = document.getElementById("aurora-shader-canvas");
  const particlesRoot = document.getElementById("aurora-particles-layer");

  if (!(canvas instanceof HTMLCanvasElement)) return;

  const HOLE_R = 0.055;
  const HOLE_R_THINK = 0.072;
  const LENS_R = 0.30;
  const LENS_R_THINK = 0.40;
  const PULL_STRENGTH = 0.20;
  const PULL_THINK = 0.36;
  const SPIN_STRENGTH = 0.06;
  const SPIN_THINK = 0.20;
  const MOUSE_LERP = 0.10;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const THINKING_LERP = prefersReducedMotion ? 0 : 0.022;

  let thinkingTarget = 0;
  let thinking = 0;

  const targetMouse = { x: canvas.width / 2, y: canvas.height / 2 };
  const mousePos = { x: canvas.width / 2, y: canvas.height / 2 };

  function syncThinkingTarget() {
    const pageRoot = document.getElementById("page-root");
    const isThinking = pageRoot?.classList.contains("is-thinking") ?? false;
    thinkingTarget = isThinking && !prefersReducedMotion ? 1 : 0;
  }

  function updateThinking() {
    thinking += (thinkingTarget - thinking) * THINKING_LERP;
  }

  const pageRoot = document.getElementById("page-root");
  if (pageRoot) {
    const observer = new MutationObserver(syncThinkingTarget);
    observer.observe(pageRoot, { attributes: true, attributeFilter: ["class"] });
  }
  window.addEventListener("loading:start", syncThinkingTarget);
  window.addEventListener("loading:finish", syncThinkingTarget);
  syncThinkingTarget();

  function syncShaderSize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  window.addEventListener("resize", syncShaderSize);
  syncShaderSize();

  window.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = (event.clientX - rect.left) / rect.width;
    const ny = 1.0 - (event.clientY - rect.top) / rect.height;
    targetMouse.x = nx * canvas.width;
    targetMouse.y = ny * canvas.height;
  });

  let lastSmoothFrame = -1;
  function updateSmoothedMouse() {
    const frame = Math.floor(performance.now());
    if (frame === lastSmoothFrame) return;
    lastSmoothFrame = frame;
    mousePos.x += (targetMouse.x - mousePos.x) * MOUSE_LERP;
    mousePos.y += (targetMouse.y - mousePos.y) * MOUSE_LERP;
  }

  /* GLSL: lente idle al cursor + vórtex centrado (paths separados) */
  const GLSL_WARP = `
    vec2 rotateAround(vec2 p, vec2 center, float angle) {
      vec2 d = p - center;
      float c = cos(angle);
      float s = sin(angle);
      return center + vec2(d.x * c - d.y * s, d.x * s + d.y * c);
    }

    float easeThinking(float thinking) {
      return thinking * thinking * (3.0 - 2.0 * thinking);
    }

    vec2 applyIdleLens(
      vec2 uv,
      vec2 mouseUv,
      float aspect,
      float holeR,
      float lensR,
      float pullStr,
      float spinStr
    ) {
      vec2 toMouse = (uv - mouseUv) * vec2(aspect, 1.0);
      float dist = length(toMouse);
      vec2 warpedUv = uv;
      if (dist > 0.0002) {
        float pull = 1.0 - smoothstep(holeR * 1.4, lensR, dist);
        vec2 inward = mouseUv - uv;
        warpedUv += inward * pull * pullStr;
        vec2 tangent = vec2(-inward.y, inward.x);
        warpedUv += tangent * pull * spinStr;
      }
      return warpedUv;
    }

    vec2 applyThinkingVortex(
      vec2 uv,
      float aspect,
      float holeR,
      float time,
      float t
    ) {
      vec2 center = vec2(0.5);
      float lensR = ${LENS_R_THINK.toFixed(2)};
      float pullStr = ${PULL_THINK.toFixed(2)};
      float spinStr = ${SPIN_THINK.toFixed(2)};

      vec2 toCenter = (uv - center) * vec2(aspect, 1.0);
      float dist = length(toCenter);
      vec2 warpedUv = uv;

      if (dist > 0.0002) {
        float pull = 1.0 - smoothstep(holeR * 1.6, lensR, dist);
        pull = pull * pull * (3.0 - 2.0 * pull);
        vec2 inward = center - uv;
        float inwardLen = length(inward);
        if (inwardLen > 0.0002) {
          inward /= inwardLen;
          warpedUv += inward * pull * pullStr;
          vec2 tangent = vec2(-inward.y, inward.x);
          warpedUv += tangent * pull * spinStr * (0.6 + 0.4 * pull);
        }
      }

      float spinAngle = t * time * 0.28;
      return rotateAround(warpedUv, center, spinAngle);
    }

    vec2 applyVortexWarp(
      vec2 uv,
      vec2 mouseUv,
      float aspect,
      float holeR,
      float lensR,
      float pullStr,
      float spinStr,
      float thinking,
      float time
    ) {
      float t = easeThinking(thinking);
      vec2 idleUv = applyIdleLens(uv, mouseUv, aspect, holeR, lensR, pullStr, spinStr);
      if (t < 0.001) return idleUv;
      vec2 thinkUv = applyThinkingVortex(uv, aspect, holeR, time, t);
      return mix(idleUv, thinkUv, t);
    }
  `;

  // --- SHADER (aurora + lensing + vórtex thinking) ---
  const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (gl) {
    const vs = `attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }`;

    const fs = `precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2  u_resolution;
      uniform vec2  u_mouse;
      uniform float u_thinking;
      uniform float u_holeR;
      uniform float u_lensR;
      uniform float u_pullStrength;
      uniform float u_spinStrength;

      ${GLSL_WARP}

      vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1  = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy  -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                               + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                                dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h  = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314*(a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = v_texCoord;
        vec2 mouseUv = u_mouse / u_resolution;
        float aspect = u_resolution.x / max(u_resolution.y, 1.0);

        vec2 warpedUv = applyVortexWarp(
          uv, mouseUv, aspect, u_holeR, u_lensR,
          u_pullStrength, u_spinStrength, u_thinking, u_time
        );

        float t  = u_time * 0.2;
        float n1 = snoise(warpedUv * 2.0 + vec2(t * 0.5, t * 0.3));
        float n2 = snoise(warpedUv * 3.0 - vec2(t * 0.2, n1 * 0.5));
        float n3 = snoise(warpedUv * 5.0 + vec2(n2 * 0.4, t * 0.1));

        vec3 color1 = vec3(0.08, 0.0, 0.25);
        vec3 color2 = vec3(0.0,  0.3, 0.3);
        vec3 color3 = vec3(0.03, 0.03, 0.06);
        float intensity = smoothstep(-0.5, 1.0, n1 * n2 + n3 * 0.5);
        vec3 finalColor = mix(color3, color1, intensity);
        finalColor = mix(finalColor, color2, clamp(n2 * 0.8, 0.0, 1.0) * intensity);

        float vignette = smoothstep(1.2, 0.4, length(uv - 0.5));
        finalColor *= vignette;

        float thinkT = easeThinking(u_thinking);
        vec2 coreDist = (uv - vec2(0.5)) * vec2(aspect, 1.0);
        float coreR = length(coreDist);
        float holeRadius = mix(u_holeR, ${HOLE_R_THINK.toFixed(3)}, thinkT);
        float voidMask = 1.0 - smoothstep(holeRadius * 0.55, holeRadius, coreR);
        float ringGlow = smoothstep(holeRadius, holeRadius * 2.4, coreR)
                       * (1.0 - smoothstep(holeRadius * 2.4, holeRadius * 3.6, coreR));
        finalColor = mix(finalColor, vec3(0.0), voidMask * thinkT);
        finalColor = mix(
          finalColor,
          finalColor * 0.55 + vec3(0.10, 0.04, 0.18) * 0.35,
          ringGlow * thinkT * 0.45
        );

        gl_FragColor = vec4(finalColor, 1.0);
      }`;

    function compileShader(type, src) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
      }
      return shader;
    }

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uThinking = gl.getUniformLocation(program, "u_thinking");
    const uHoleR = gl.getUniformLocation(program, "u_holeR");
    const uLensR = gl.getUniformLocation(program, "u_lensR");
    const uPull = gl.getUniformLocation(program, "u_pullStrength");
    const uSpin = gl.getUniformLocation(program, "u_spinStrength");

    function render(time) {
      updateSmoothedMouse();
      updateThinking();
      syncShaderSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      const t = time * 0.001;
      if (uTime) gl.uniform1f(uTime, t);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mousePos.x, mousePos.y);
      if (uThinking) gl.uniform1f(uThinking, thinking);
      if (uHoleR) gl.uniform1f(uHoleR, HOLE_R);
      if (uLensR) gl.uniform1f(uLensR, LENS_R);
      if (uPull) gl.uniform1f(uPull, PULL_STRENGTH);
      if (uSpin) gl.uniform1f(uSpin, SPIN_STRENGTH);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  }

  // --- PARTICLES (misma lente óptica + órbita al centro mientras piensa) ---
  if (!(particlesRoot instanceof HTMLElement)) return;

  let particleAttempts = 0;

  function initParticles() {
    particleAttempts += 1;

    if (typeof window.THREE === "undefined") {
      if (particleAttempts < 120) requestAnimationFrame(initParticles);
      return;
    }

    const THREE = window.THREE;
    const width = window.innerWidth;
    const height = window.innerHeight;

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
      camera.position.z = 1;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.className = "block h-full w-full";
      particlesRoot.appendChild(renderer.domElement);

      const particlesCount = 700;
      const basePositions = new Float32Array(particlesCount * 3);
      const sizes = new Float32Array(particlesCount);
      const velocities = new Float32Array(particlesCount * 2);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      for (let i = 0; i < particlesCount; i++) {
        basePositions[i * 3] = Math.random();
        basePositions[i * 3 + 1] = Math.random();
        basePositions[i * 3 + 2] = 0;

        const depth = Math.pow(Math.random(), 1.6);
        sizes[i] = (0.8 + depth * 3.4) * pixelRatio;

        velocities[i * 2] = (Math.random() - 0.5) * 0.00012;
        velocities[i * 2 + 1] = (Math.random() - 0.5) * 0.00012;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(basePositions, 3));
      geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
          u_resolution: { value: new THREE.Vector2(width, height) },
          u_time: { value: 0 },
          u_thinking: { value: 0 },
          u_holeR: { value: HOLE_R },
          u_lensR: { value: LENS_R },
          u_pullStrength: { value: PULL_STRENGTH },
          u_spinStrength: { value: SPIN_STRENGTH },
          u_color: { value: new THREE.Color(0xd0bcff) },
          u_opacity: { value: 0.55 },
        },
        vertexShader: `
          attribute float aSize;
          varying float vAlphaScale;
          varying float vCoreDist;

          uniform vec2 u_mouse;
          uniform vec2 u_resolution;
          uniform float u_time;
          uniform float u_thinking;
          uniform float u_holeR;
          uniform float u_lensR;
          uniform float u_pullStrength;
          uniform float u_spinStrength;

          ${GLSL_WARP}

          void main() {
            vec2 uv = position.xy;
            vec2 mouseUv = u_mouse;
            float aspect = u_resolution.x / max(u_resolution.y, 1.0);

            vCoreDist = length((uv - vec2(0.5)) * vec2(aspect, 1.0));

            vec2 warpedUv = applyVortexWarp(
              uv, mouseUv, aspect, u_holeR, u_lensR,
              u_pullStrength, u_spinStrength, u_thinking, u_time
            );

            vec2 clip = warpedUv * 2.0 - 1.0;
            gl_Position = vec4(clip, 0.0, 1.0);
            gl_PointSize = aSize;
            vAlphaScale = mix(0.45, 1.0, smoothstep(0.8, 4.0, aSize));
          }
        `,
        fragmentShader: `
          varying float vAlphaScale;
          varying float vCoreDist;
          uniform vec3 u_color;
          uniform float u_opacity;
          uniform float u_thinking;
          uniform float u_holeR;

          float easeThinking(float thinking) {
            return thinking * thinking * (3.0 - 2.0 * thinking);
          }

          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            float alpha = smoothstep(0.5, 0.15, d) * u_opacity * vAlphaScale;

            float thinkT = easeThinking(u_thinking);
            float holeRadius = mix(u_holeR, ${HOLE_R_THINK.toFixed(3)}, thinkT);
            float coreFade = smoothstep(holeRadius * 0.9, holeRadius * 2.2, vCoreDist);
            alpha *= mix(1.0, coreFade, thinkT);

            if (alpha < 0.01) discard;
            gl_FragColor = vec4(u_color, alpha);
          }
        `,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const posAttr = geometry.attributes.position;
      const VORTEX_CENTER = 0.5;

      function animate() {
        requestAnimationFrame(animate);
        updateSmoothedMouse();
        updateThinking();

        const mouseUvX = canvas.width > 0 ? mousePos.x / canvas.width : 0.5;
        const mouseUvY = canvas.height > 0 ? mousePos.y / canvas.height : 0.5;
        material.uniforms.u_mouse.value.set(mouseUvX, mouseUvY);
        material.uniforms.u_resolution.value.set(canvas.width, canvas.height);
        material.uniforms.u_time.value = performance.now() * 0.001;
        material.uniforms.u_thinking.value = thinking;

        const orbitStrength = thinking * thinking * 0.00016;
        const inwardStrength = thinking * thinking * 0.00006;
        const driftScale = 1 - thinking * 0.92;

        for (let i = 0; i < particlesCount; i++) {
          const pi = i * 3;
          const vi = i * 2;
          let px = posAttr.array[pi];
          let py = posAttr.array[pi + 1];

          if (thinking > 0.01) {
            const dx = px - VORTEX_CENTER;
            const dy = py - VORTEX_CENTER;
            const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
            px += (-dy / dist) * orbitStrength;
            py += (dx / dist) * orbitStrength;
            px += (-dx / dist) * inwardStrength;
            py += (-dy / dist) * inwardStrength;
          }

          px += velocities[vi] * driftScale;
          py += velocities[vi + 1] * driftScale;

          if (px < 0 || px > 1) {
            velocities[vi] *= -1;
            px = Math.max(0, Math.min(1, px));
          }
          if (py < 0 || py > 1) {
            velocities[vi + 1] *= -1;
            py = Math.max(0, Math.min(1, py));
          }

          posAttr.array[pi] = px;
          posAttr.array[pi + 1] = py;
        }

        posAttr.needsUpdate = true;
        renderer.render(scene, camera);
      }

      animate();

      window.addEventListener("resize", () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        material.uniforms.u_resolution.value.set(w, h);
      });
    } catch (error) {
      console.error("Failed to initialize particle background:", error);
    }
  }

  initParticles();
})();
