/**
 * Fondo aurora + partículas — mismo enfoque que el prototipo Stitch.
 */
(function initAmbientBackground() {
  const canvas = document.getElementById("aurora-shader-canvas");
  const particlesRoot = document.getElementById("aurora-particles-layer");

  if (!(canvas instanceof HTMLCanvasElement)) return;

  // --- SHADER (ANIMATION_1) ---
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
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m; m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = v_texCoord;
        vec2 mouse = u_mouse / u_resolution;
        float dist = distance(uv, mouse);
        vec2 mouseOffset = (uv - mouse) * smoothstep(0.5, 0.0, dist) * 0.05;
        vec2 distortedUv = uv + mouseOffset;
        float t = u_time * 0.2;
        float n1 = snoise(distortedUv * 2.0 + vec2(t * 0.5, t * 0.3));
        float n2 = snoise(distortedUv * 3.0 - vec2(t * 0.2, n1 * 0.5));
        float n3 = snoise(distortedUv * 5.0 + vec2(n2 * 0.4, t * 0.1));
        vec3 color1 = vec3(0.08, 0.0, 0.25);
        vec3 color2 = vec3(0.0, 0.3, 0.3);
        vec3 color3 = vec3(0.03, 0.03, 0.06);
        float intensity = smoothstep(-0.5, 1.0, n1 * n2 + n3 * 0.5);
        vec3 finalColor = mix(color3, color1, intensity);
        finalColor = mix(finalColor, color2, clamp(n2 * 0.8, 0.0, 1.0) * intensity);
        float vignette = smoothstep(1.2, 0.4, length(uv - 0.5));
        finalColor *= vignette;
        gl_FragColor = vec4(finalColor, 1.0);
      }`;

    function compileShader(type, src) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return shader;
    }

    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    const mousePos = { x: canvas.width / 2, y: canvas.height / 2 };

    window.addEventListener("mousemove", (event) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = (event.clientX - rect.left) / rect.width;
      const ny = 1.0 - (event.clientY - rect.top) / rect.height;
      mousePos.x = nx * canvas.width;
      mousePos.y = ny * canvas.height;
    });

    function render(time) {
      syncShaderSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, time * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mousePos.x, mousePos.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  }

  // --- PARTICLES (ANIMATION_2) ---
  if (!(particlesRoot instanceof HTMLElement)) return;

  let particleAttempts = 0;

  function initParticles() {
    particleAttempts += 1;

    if (typeof window.THREE === "undefined") {
      if (particleAttempts < 120) {
        requestAnimationFrame(initParticles);
      }
      return;
    }

    const THREE = window.THREE;
    const width = window.innerWidth;
    const height = window.innerHeight;

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 5;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.domElement.className = "block h-full w-full";
      particlesRoot.appendChild(renderer.domElement);

      const particlesCount = 1500;
      const positions = new Float32Array(particlesCount * 3);
      const velocities = new Float32Array(particlesCount * 3);

      for (let i = 0; i < particlesCount; i++) {
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
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const mouse = new THREE.Vector2(-999, -999);
      window.addEventListener("mousemove", (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      });

      function animate() {
        requestAnimationFrame(animate);
        const posAttr = geometry.attributes.position;

        for (let i = 0; i < particlesCount; i++) {
          posAttr.array[i * 3] += velocities[i * 3];
          posAttr.array[i * 3 + 1] += velocities[i * 3 + 1];
          posAttr.array[i * 3 + 2] += velocities[i * 3 + 2];

          if (Math.abs(posAttr.array[i * 3]) > 7.5) posAttr.array[i * 3] *= -0.98;
          if (Math.abs(posAttr.array[i * 3 + 1]) > 7.5) posAttr.array[i * 3 + 1] *= -0.98;

          if (mouse.x !== -999) {
            const px = posAttr.array[i * 3];
            const py = posAttr.array[i * 3 + 1];
            const mx = mouse.x * 7.5;
            const my = mouse.y * 7.5;
            const dx = px - mx;
            const dy = py - my;
            const distSq = dx * dx + dy * dy;

            if (distSq < 2.0) {
              const force = (2.0 - distSq) * 0.01;
              posAttr.array[i * 3] += (dx / distSq) * force;
              posAttr.array[i * 3 + 1] += (dy / distSq) * force;
            }
          }
        }

        posAttr.needsUpdate = true;
        points.rotation.y += 0.0002;
        renderer.render(scene, camera);
      }

      animate();

      window.addEventListener("resize", () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
    } catch (error) {
      console.error("Failed to initialize particle background:", error);
    }
  }

  initParticles();
})();
